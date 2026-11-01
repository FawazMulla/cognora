import { db } from "../../../../db";
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { userNavigationState } from '../../../../db/schema';
import { env } from '../../../../lib/env';


export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const states = await db
      .select()
      .from(userNavigationState)
      .where(eq(userNavigationState.userId, userId))
      .limit(1);

    if (states.length === 0 || !states[0]) {
      return NextResponse.json({ navigationState: null }, { status: 200 });
    }

    return NextResponse.json({ navigationState: states[0] }, { status: 200 });
  } catch (error) {
    console.error('[navigation/last-state] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch navigation state' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as {
      lastPage: string;
      subjectId?: string;
      subjectName?: string;
      moduleNumber?: string;
      topic?: string;
      resourceId?: string;
      resourceTitle?: string;
      scrollPercentage?: number;
    };

    if (!body.lastPage) {
      return NextResponse.json({ error: 'lastPage is required' }, { status: 400 });
    }

    const [saved] = await db
      .insert(userNavigationState)
      .values({
        userId,
        lastPage: body.lastPage,
        subjectId: body.subjectId ?? null,
        subjectName: body.subjectName ?? null,
        moduleNumber: body.moduleNumber ?? null,
        topic: body.topic ?? null,
        resourceId: body.resourceId ?? null,
        resourceTitle: body.resourceTitle ?? null,
        scrollPercentage: body.scrollPercentage ?? 0,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userNavigationState.userId,
        set: {
          lastPage: body.lastPage,
          subjectId: body.subjectId ?? null,
          subjectName: body.subjectName ?? null,
          moduleNumber: body.moduleNumber ?? null,
          topic: body.topic ?? null,
          resourceId: body.resourceId ?? null,
          resourceTitle: body.resourceTitle ?? null,
          scrollPercentage: body.scrollPercentage ?? 0,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({ navigationState: saved }, { status: 200 });
  } catch (error) {
    console.error('[navigation/last-state] POST error:', error);
    return NextResponse.json({ error: 'Failed to update navigation state' }, { status: 500 });
  }
}

