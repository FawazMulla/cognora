import { db } from "../../../../db";
import { and, desc, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { bookmarkCollections, bookmarks } from '../../../../db/schema';
import { env } from '../../../../lib/env';


export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const collections = await db
      .select({
        id: bookmarkCollections.id,
        name: bookmarkCollections.name,
        color: bookmarkCollections.color,
        icon: bookmarkCollections.icon,
        description: bookmarkCollections.description,
        createdAt: bookmarkCollections.createdAt,
        updatedAt: bookmarkCollections.updatedAt,
        itemCount: sql<number>`count(${bookmarks.id})::int`,
      })
      .from(bookmarkCollections)
      .leftJoin(bookmarks, eq(bookmarkCollections.id, bookmarks.collectionId))
      .where(eq(bookmarkCollections.userId, userId))
      .groupBy(bookmarkCollections.id)
      .orderBy(desc(bookmarkCollections.createdAt));

    return NextResponse.json({ collections }, { status: 200 });
  } catch (error) {
    console.error('[bookmark/collections] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as {
      name: string;
      color?: string;
      icon?: string;
      description?: string;
    };

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
    }

    const [created] = await db
      .insert(bookmarkCollections)
      .values({
        userId,
        name: body.name.trim(),
        color: body.color || '#4f75f2',
        icon: body.icon || 'Folder',
        description: body.description?.trim() || null,
      })
      .returning();

    return NextResponse.json({ collection: created }, { status: 201 });
  } catch (error) {
    console.error('[bookmark/collections] POST error:', error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as {
      id: string;
      name?: string;
      color?: string;
      icon?: string;
      description?: string;
    };

    if (!body.id) {
      return NextResponse.json({ error: 'Collection id is required' }, { status: 400 });
    }

    const [updated] = await db
      .update(bookmarkCollections)
      .set({
        ...(body.name && { name: body.name.trim() }),
        ...(body.color && { color: body.color }),
        ...(body.icon && { icon: body.icon }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        updatedAt: new Date(),
      })
      .where(and(eq(bookmarkCollections.id, body.id), eq(bookmarkCollections.userId, userId)))
      .returning();

    return NextResponse.json({ collection: updated }, { status: 200 });
  } catch (error) {
    console.error('[bookmark/collections] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Collection id is required' }, { status: 400 });
    }

    // Bookmarks with this collectionId will automatically have collection_id set to null via onDelete: 'set null'
    const deleted = await db
      .delete(bookmarkCollections)
      .where(and(eq(bookmarkCollections.id, id), eq(bookmarkCollections.userId, userId)))
      .returning();

    return NextResponse.json({ success: true, deletedCount: deleted.length }, { status: 200 });
  } catch (error) {
    console.error('[bookmark/collections] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
  }
}

