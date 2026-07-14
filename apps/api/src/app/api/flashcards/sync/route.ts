import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { flashcards } from "@/db/schema";
import { env } from "@/lib/env";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { calculateNextSM2 } from "@/lib/sm2";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

const SyncEventSchema = z.object({
  card_id: z.string().uuid(),
  rating: z.enum(["again", "hard", "good", "easy"]),
  reviewed_at: z.string(),
  client_uuid: z.string().uuid()
});

const SyncPayloadSchema = z.object({
  events: z.array(SyncEventSchema)
});

// A simple in-memory cache to prevent processing the same client_uuid twice
// In production, use Redis.
const processedSyncEvents = new Set<string>();

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parseResult = SyncPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Validation failed", details: parseResult.error.issues }, { status: 400 });
    }

    const { events } = parseResult.data;
    let syncedCount = 0;
    
    // We process each event sequentially to update flashcards
    // In a highly concurrent production setup, we would do a batch transaction
    for (const event of events) {
      if (processedSyncEvents.has(event.client_uuid)) {
        console.log(`[SYNC] Skipped deduplicated event: ${event.client_uuid}`);
        continue;
      }

      // Fetch current card state
      const [card] = await db.select().from(flashcards).where(eq(flashcards.id, event.card_id));
      if (!card) continue; // Skip if card deleted or not found
      if (card.userId !== userId) continue; // Skip if not owner

      const currentInterval = card.intervalDays || 0;
      const currentEase = card.easeFactor ? Number(card.easeFactor) : 2.5;

      const { newInterval, newEase, newDueDate } = calculateNextSM2(
        currentInterval,
        currentEase,
        event.rating
      );

      await db.update(flashcards)
        .set({
          intervalDays: newInterval,
          easeFactor: newEase.toString(),
          nextReviewDate: newDueDate,
          reviewCount: (card.reviewCount || 0) + 1,
        })
        .where(eq(flashcards.id, event.card_id));

      processedSyncEvents.add(event.client_uuid);
      syncedCount++;
    }

    return NextResponse.json({ success: true, syncedCount }, { status: 200 });
  } catch (error) {
    console.error("POST flashcards sync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
