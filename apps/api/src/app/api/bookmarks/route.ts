import { db } from "../../../db";
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { bookmarkCollections, bookmarks } from '../../../db/schema';
import { env } from '../../../lib/env';


export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get('itemType');
    const collectionId = searchParams.get('collectionId');
    const subjectId = searchParams.get('subjectId');
    const query = searchParams.get('q');

    const conditions = [eq(bookmarks.userId, userId)];

    if (itemType && itemType !== 'all') {
      conditions.push(eq(bookmarks.itemType, itemType));
    }
    if (collectionId && collectionId !== 'all') {
      conditions.push(eq(bookmarks.collectionId, collectionId));
    }
    if (subjectId && subjectId !== 'all') {
      conditions.push(eq(bookmarks.subjectId, subjectId));
    }
    if (query) {
      conditions.push(
        or(
          ilike(bookmarks.title, `%${query}%`),
          ilike(bookmarks.description, `%${query}%`),
          ilike(bookmarks.topicTitle, `%${query}%`),
          ilike(bookmarks.subjectName, `%${query}%`),
        )!,
      );
    }

    const userBookmarks = await db
      .select({
        id: bookmarks.id,
        userId: bookmarks.userId,
        collectionId: bookmarks.collectionId,
        collectionName: bookmarkCollections.name,
        collectionColor: bookmarkCollections.color,
        itemType: bookmarks.itemType,
        title: bookmarks.title,
        description: bookmarks.description,
        targetUrl: bookmarks.targetUrl,
        subjectId: bookmarks.subjectId,
        subjectName: bookmarks.subjectName,
        moduleNumber: bookmarks.moduleNumber,
        topicTitle: bookmarks.topicTitle,
        metadata: bookmarks.metadata,
        createdAt: bookmarks.createdAt,
        updatedAt: bookmarks.updatedAt,
      })
      .from(bookmarks)
      .leftJoin(bookmarkCollections, eq(bookmarks.collectionId, bookmarkCollections.id))
      .where(and(...conditions))
      .orderBy(desc(bookmarks.createdAt));

    return NextResponse.json({ bookmarks: userBookmarks }, { status: 200 });
  } catch (error) {
    console.error('[bookmarks] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as {
      itemType: string;
      title: string;
      description?: string;
      targetUrl: string;
      subjectId?: string;
      subjectName?: string;
      moduleNumber?: string;
      topicTitle?: string;
      collectionId?: string;
      metadata?: Record<string, unknown>;
    };

    if (!body.title || !body.itemType || !body.targetUrl) {
      return NextResponse.json(
        { error: 'Missing required bookmark fields: title, itemType, targetUrl' },
        { status: 400 },
      );
    }

    // Check duplicate bookmark for this user and targetUrl
    const existing = await db
      .select({ id: bookmarks.id })
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.targetUrl, body.targetUrl)))
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      // Update existing
      const [updated] = await db
        .update(bookmarks)
        .set({
          title: body.title,
          description: body.description ?? null,
          collectionId: body.collectionId ?? null,
          subjectId: body.subjectId ?? null,
          subjectName: body.subjectName ?? null,
          moduleNumber: body.moduleNumber ?? null,
          topicTitle: body.topicTitle ?? null,
          metadata: body.metadata ?? null,
          updatedAt: new Date(),
        })
        .where(eq(bookmarks.id, existing[0].id))
        .returning();

      return NextResponse.json({ bookmark: updated, status: 'updated' }, { status: 200 });
    }

    const [created] = await db
      .insert(bookmarks)
      .values({
        userId,
        itemType: body.itemType,
        title: body.title,
        description: body.description ?? null,
        targetUrl: body.targetUrl,
        subjectId: body.subjectId ?? null,
        subjectName: body.subjectName ?? null,
        moduleNumber: body.moduleNumber ?? null,
        topicTitle: body.topicTitle ?? null,
        collectionId: body.collectionId ?? null,
        metadata: body.metadata ?? null,
      })
      .returning();

    return NextResponse.json({ bookmark: created, status: 'created' }, { status: 201 });
  } catch (error) {
    console.error('[bookmarks] POST error:', error);
    return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const targetUrl = searchParams.get('targetUrl');

    if (!id && !targetUrl) {
      return NextResponse.json({ error: 'Bookmark id or targetUrl is required' }, { status: 400 });
    }

    const condition = id
      ? and(eq(bookmarks.id, id), eq(bookmarks.userId, userId))
      : and(eq(bookmarks.targetUrl, targetUrl!), eq(bookmarks.userId, userId));

    const deleted = await db.delete(bookmarks).where(condition).returning();

    return NextResponse.json({ success: true, deletedCount: deleted.length }, { status: 200 });
  } catch (error) {
    console.error('[bookmarks] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as {
      id: string;
      title?: string;
      description?: string;
      collectionId?: string | null;
      metadata?: Record<string, unknown>;
    };

    if (!body.id) {
      return NextResponse.json({ error: 'Bookmark id is required' }, { status: 400 });
    }

    const [updated] = await db
      .update(bookmarks)
      .set({
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.collectionId !== undefined && { collectionId: body.collectionId }),
        ...(body.metadata !== undefined && { metadata: body.metadata }),
        updatedAt: new Date(),
      })
      .where(and(eq(bookmarks.id, body.id), eq(bookmarks.userId, userId)))
      .returning();

    return NextResponse.json({ bookmark: updated }, { status: 200 });
  } catch (error) {
    console.error('[bookmarks] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update bookmark' }, { status: 500 });
  }
}

