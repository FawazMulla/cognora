import { db } from "../../../../db";
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { userNavigationState } from '../../../../db/schema';
import { env } from '../../../../lib/env';


export const dynamic = 'force-dynamic';

const inMemoryNavState = new Map<string, any>();
const isValidUuid = (val?: string | null) => Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fast-path: return in-memory state if recently set
  const memoryState = inMemoryNavState.get(userId);
  if (memoryState) {
    return NextResponse.json({ navigationState: memoryState }, { status: 200 });
  }

  try {
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
    console.warn('[navigation/last-state] GET fallback:', error);
    return NextResponse.json({ navigationState: null }, { status: 200 });
  }
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: {
    lastPage: string;
    subjectId?: string;
    subjectName?: string;
    moduleNumber?: string;
    topic?: string;
    resourceId?: string;
    resourceTitle?: string;
    scrollPercentage?: number;
  } = { lastPage: '/' };

  try {
    body = (await request.json()) as typeof body;

    if (!body.lastPage) {
      return NextResponse.json({ error: 'lastPage is required' }, { status: 400 });
    }

    const statePayload = {
      lastPage: body.lastPage,
      subjectId: body.subjectId || null,
      subjectName: body.subjectName || null,
      moduleNumber: body.moduleNumber || null,
      topic: body.topic || null,
      resourceId: body.resourceId || null,
      resourceTitle: body.resourceTitle || null,
      scrollPercentage: body.scrollPercentage || 0,
      updatedAt: new Date().toISOString(),
    };

    // Always update in-memory cache for fast, reliable reads
    inMemoryNavState.set(userId, statePayload);

    const safeSubjectId = isValidUuid(body.subjectId) ? body.subjectId! : null;

    const [saved] = await db
      .insert(userNavigationState)
      .values({
        userId,
        lastPage: body.lastPage,
        subjectId: safeSubjectId,
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
          subjectId: safeSubjectId,
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

    return NextResponse.json({ navigationState: saved || statePayload }, { status: 200 });
  } catch (error) {
    console.warn('[navigation/last-state] POST fallback:', error);
    return NextResponse.json(
      {
        navigationState: inMemoryNavState.get(userId) || {
          lastPage: body.lastPage,
          subjectId: body.subjectId || null,
          subjectName: body.subjectName || null,
          moduleNumber: body.moduleNumber || null,
          topic: body.topic || null,
          resourceId: body.resourceId || null,
          resourceTitle: body.resourceTitle || null,
          scrollPercentage: body.scrollPercentage || 0,
          updatedAt: new Date().toISOString(),
        },
      },
      { status: 200 },
    );
  }
}
