import { NextResponse } from 'next/server';
import { getDb } from '../../../../db';
import { resources, resourceChunks } from '../../../../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { DocumentLifecycleManager } from '../../../../lib/cic/resource-intelligence/lifecycle';
import { AcademicSourceType } from '../../../../lib/cic/knowledge/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id') || '00000000-0000-0000-0000-000000000101';
    const db = getDb();

    if (!db) {
      return NextResponse.json({ documents: [] }, { status: 200 });
    }

    const docs = await db
      .select({
        id: resources.id,
        filename: resources.filename,
        fileType: resources.fileType,
        sizeBytes: resources.sizeBytes,
        status: resources.status,
        intelligenceData: resources.intelligenceData,
        createdAt: resources.createdAt,
      })
      .from(resources)
      .where(eq(resources.userId, userId))
      .orderBy(desc(resources.createdAt))
      .limit(50);

    return NextResponse.json({ documents: docs }, { status: 200 });
  } catch (error: any) {
    console.error('[API /intelligence/documents GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id') || '00000000-0000-0000-0000-000000000101';
    const body = await request.json();

    const { filename, content, fileType = 'text/plain', subjectCode, sourceType } = body;

    if (!filename || !content) {
      return NextResponse.json(
        { error: 'Filename and content are required' },
        { status: 400 }
      );
    }

    // Process through the 10-stage Academic Resource Intelligence pipeline
    const result = await DocumentLifecycleManager.processDocument(
      userId,
      filename,
      content,
      fileType,
      subjectCode
    );

    return NextResponse.json(
      {
        success: true,
        documentId: result.resourceId,
        status: result.status,
        classification: result.classification,
        chunkCount: result.chunksCount,
        requiresConfirmation: result.classification.requiresUserConfirmation,
        qualityScore: result.qualityScore,
        durationMs: result.durationMs,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API /intelligence/documents POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process academic document' },
      { status: 500 }
    );
  }
}
