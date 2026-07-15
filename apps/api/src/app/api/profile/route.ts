import { NextResponse } from "next/server";
import { profileSchema } from "../../../lib/validators/profile";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { academicProfiles, subjects, studentModels } from "../../../db/schema";
import { env } from "../../../lib/env";
import { eq } from "drizzle-orm";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profiles = await db.select().from(academicProfiles).where(eq(academicProfiles.userId, userId)).limit(1);
    if (profiles.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ profile: profiles[0] }, { status: 200 });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { university, branch, semester, subjects: initialSubjects } = parsed.data;

    // Create academic profile
    const insertedProfiles = await db.insert(academicProfiles).values({
      userId,
      university,
      branch,
      semester,
    }).returning();

    const profileRecord = insertedProfiles[0] as any;
    if (!profileRecord) {
      throw new Error("Failed to create academic profile");
    }
    const profileId = profileRecord.id;

    // Insert submitted subjects
    if (initialSubjects && initialSubjects.length > 0) {
      await db.insert(subjects).values(
        initialSubjects.map((sub: any) => ({
          userId,
          academicProfileId: profileId,
          name: sub.name,
          examDate: sub.examDate ? sub.examDate : null,
        }))
      );
    }

    // Initialize student model (as per design 15.1)
    await db.insert(studentModels).values({
      userId,
    }).onConflictDoNothing();

    return NextResponse.json({ message: "Profile created", profile: insertedProfiles[0] }, { status: 201 });
  } catch (error) {
    console.error("Profile POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = profileSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { university, branch, semester } = parsed.data;

    const updated = await db.update(academicProfiles)
      .set({
        university,
        branch,
        semester,
        updatedAt: new Date(),
      } as any)
      .where(eq(academicProfiles.userId, userId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Profile updated", profile: updated[0] }, { status: 200 });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
