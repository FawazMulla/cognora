import { NextResponse } from "next/server";
import { subjectSchema } from "@/lib/validators/profile";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { subjects } from "@/db/schema";
import { env } from "@/lib/env";
import { eq, and } from "drizzle-orm";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = subjectSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, examDate } = parsed.data;
    
    // Create update object dynamically based on provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (examDate !== undefined) updateData.examDate = examDate;

    const updated = await db.update(subjects)
      .set(updateData)
      .where(and(eq(subjects.id, params.id), eq(subjects.userId, userId)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Subject not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ message: "Subject updated", subject: updated[0] }, { status: 200 });
  } catch (error) {
    console.error("Subject PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const deleted = await db.delete(subjects)
      .where(and(eq(subjects.id, params.id), eq(subjects.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Subject not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ message: "Subject deleted", subject: deleted[0] }, { status: 200 });
  } catch (error) {
    console.error("Subject DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
