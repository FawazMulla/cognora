import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { flashcards } from "@/db/schema";
import { env } from "@/lib/env";
import { eq } from "drizzle-orm";
import { calculateSM2 } from "@/lib/sm2";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cardId = params.id;
    const body = await request.json();
    const { rating } = body; // 0, 1, 2, 3

    if (rating === undefined || rating < 0 || rating > 3) {
      return NextResponse.json({ error: "rating must be 0, 1, 2, or 3" }, { status: 400 });
    }

    const cards = await db.select().from(flashcards).where(eq(flashcards.id, cardId)).limit(1);
    if (!cards.length || cards[0].userId !== userId) {
      return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });
    }

    const card = cards[0];
    const { intervalDays, easeFactor, dueDate } = calculateSM2(
      rating,
      card.intervalDays || 1,
      card.easeFactor || 2.5
    );

    const isCorrect = rating > 0;
    const reviewCount = (card.reviewCount || 0) + 1;
    // rough running average approximation
    const prevCorrect = (card.correctRecallRate || 0) * (reviewCount - 1);
    const correctRecallRate = (prevCorrect + (isCorrect ? 1 : 0)) / reviewCount;

    const updated = await db.update(flashcards)
      .set({
        intervalDays,
        easeFactor,
        dueDate: dueDate.toISOString(),
        reviewCount,
        correctRecallRate,
        lastReviewedAt: new Date(),
      })
      .where(eq(flashcards.id, cardId))
      .returning();

    return NextResponse.json({ flashcard: updated[0] }, { status: 200 });
  } catch (error) {
    console.error("POST flashcard review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
