import { NextResponse } from 'next/server';
import { getDb } from '../../../../../db';
import { resources, resourceChunks } from '../../../../../db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id') || '00000000-0000-0000-0000-000000000101';
    const documentId = params.id;
    const db = getDb();

    if (!db) {
      return NextResponse.json({ error: 'Database uninitialized' }, { status: 500 });
    }

    // Delete chunks first, then resource
    await db.delete(resourceChunks).where(eq(resourceChunks.resourceId, documentId));
    await db
      .delete(resources)
      .where(and(eq(resources.id, documentId), eq(resources.userId, userId)));

    return NextResponse.json({ success: true, deletedId: documentId }, { status: 200 });
  } catch (error: any) {
    console.error('[API /intelligence/documents/[id] DELETE] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete document' }, { status: 500 });
  }
}

