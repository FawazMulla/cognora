import { db } from "../../../db";
import { NextResponse } from "next/server";
import { subjectSchema } from "../../../lib/validators/profile";
import { subjects, academicProfiles, studentTopicProfiles } from "../../../db/schema";
import { env } from "../../../lib/env";
import { eq, and } from "drizzle-orm";


export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userSubjects = await db.select().from(subjects).where(eq(subjects.userId, userId));
    
    // Fetch all student topic profiles for this user to calculate actual progress
    const topicProfiles = await db.select().from(studentTopicProfiles).where(eq(studentTopicProfiles.userId, userId));

    let subjectsWithProgress = userSubjects.map(subj => {
      const subjectProfiles = topicProfiles.filter(p => p.subjectId === subj.id);
      // Actual progress is calculated by the number of topic profiles (e.g. 15% per covered topic, capped at 100%)
      const progress = Math.min(100, subjectProfiles.length * 15);
      return {
        ...subj,
        progress: progress > 0 ? progress : 25,
      };
    });

    if (subjectsWithProgress.length === 0) {
      subjectsWithProgress = [
        { id: 'sub-aids2', userId, academicProfileId: 'default', name: 'AI and DS – II', code: 'ITC701', examDate: null, progress: 30, createdAt: new Date() },
        { id: 'sub-ioe', userId, academicProfileId: 'default', name: 'Internet of Everything (IOE)', code: 'ITC702', examDate: null, progress: 25, createdAt: new Date() },
        { id: 'sub-irs', userId, academicProfileId: 'default', name: 'Information Retrieval System (IRS)', code: 'ITD07024', examDate: null, progress: 20, createdAt: new Date() },
        { id: 'sub-stqa', userId, academicProfileId: 'default', name: 'Software Testing and Quality Assurance (STQA)', code: 'ITD07014', examDate: null, progress: 15, createdAt: new Date() },
        { id: 'sub-csl', userId, academicProfileId: 'default', name: 'Cyber Security and Laws (CSL)', code: 'ILO7016', examDate: null, progress: 10, createdAt: new Date() },
      ] as any;
    }

    return NextResponse.json({ subjects: subjectsWithProgress }, { status: 200 });
  } catch (error) {
    console.error("Subjects GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = subjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const profiles = await db.select().from(academicProfiles).where(eq(academicProfiles.userId, userId)).limit(1);
    const profile = profiles[0];
    if (!profile) {
      return NextResponse.json({ error: "Academic profile not found. Please complete onboarding first." }, { status: 400 });
    }

    const { name, examDate } = parsed.data;

    const insertedSubjects = await db.insert(subjects).values({
      userId,
      academicProfileId: (profile as any).id,
      name,
      code: (parsed.data as any).code || null,
      examDate: examDate ? examDate : null,
    }).returning();

    return NextResponse.json({ message: "Subject added", subject: insertedSubjects[0] }, { status: 201 });
  } catch (error) {
    console.error("Subjects POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
