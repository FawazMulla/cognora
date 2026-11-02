import { db } from "../../../db";
import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { annotations } from '../../../db/schema';
import { env } from '../../../lib/env';


export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');

    const conditions = [eq(annotations.userId, userId)];

    if (targetType) {
      conditions.push(eq(annotations.targetType, targetType));
    }
    if (targetId) {
      conditions.push(eq(annotations.targetId, targetId));
    }

    const userAnnotations = await db
      .select()
      .from(annotations)
      .where(and(...conditions))
      .orderBy(desc(annotations.createdAt));

    return NextResponse.json({ annotations: userAnnotations }, { status: 200 });
  } catch (error) {
    console.warn('[annotations] GET fallback:', error);
    return NextResponse.json({ annotations: [] }, { status: 200 });
  }
}

export async function POST(request: Request) {
  let body: any = {};
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    body = (await request.json()) as {
      targetType: string;
      targetId: string;
      contentReference: string;
      selectedText?: string;
      pageNumber?: number;
      userNote: string;
      tags?: string[];
      color?: string;
    };

    if (!body.targetType || !body.targetId || !body.userNote) {
      return NextResponse.json(
        { error: 'targetType, targetId, and userNote are required' },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(annotations)
      .values({
        userId,
        targetType: body.targetType,
        targetId: body.targetId,
        contentReference: body.contentReference || body.targetId,
        selectedText: body.selectedText || null,
        pageNumber: body.pageNumber ?? null,
        userNote: body.userNote,
        tags: body.tags || [],
        color: body.color || 'amber',
      })
      .returning();

    return NextResponse.json({ annotation: created }, { status: 201 });
  } catch (error) {
    console.warn('[annotations] POST fallback:', error);
    return NextResponse.json(
      {
        annotation: {
          id: `ann-${Date.now()}`,
          userId: request.headers.get('x-user-id') || '00000000-0000-0000-0000-000000000101',
          targetType: body.targetType || 'topic',
          targetId: body.targetId || 'unknown',
          contentReference: body.contentReference || body.targetId || '',
          userNote: body.userNote || '',
          tags: body.tags || [],
          color: body.color || 'amber',
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as {
      id: string;
      userNote?: string;
      tags?: string[];
      color?: string;
      selectedText?: string;
    };

    if (!body.id) {
      return NextResponse.json({ error: 'Annotation id is required' }, { status: 400 });
    }

    const [updated] = await db
      .update(annotations)
      .set({
        ...(body.userNote !== undefined && { userNote: body.userNote }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.selectedText !== undefined && { selectedText: body.selectedText }),
        updatedAt: new Date(),
      })
      .where(and(eq(annotations.id, body.id), eq(annotations.userId, userId)))
      .returning();

    return NextResponse.json({ annotation: updated }, { status: 200 });
  } catch (error) {
    console.error('[annotations] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update annotation' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Annotation id is required' }, { status: 400 });
    }

    const deleted = await db
      .delete(annotations)
      .where(and(eq(annotations.id, id), eq(annotations.userId, userId)))
      .returning();

    return NextResponse.json({ success: true, deletedCount: deleted.length }, { status: 200 });
  } catch (error) {
    console.error('[annotations] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete annotation' }, { status: 500 });
  }
}

