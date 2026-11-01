import { NextResponse } from 'next/server';
import { QueryUnderstandingParser } from '../../../../lib/cic/retrieval/query-parser';
import { HybridRetrievalEngine } from '../../../../lib/cic/retrieval/hybrid-engine';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id') || '00000000-0000-0000-0000-000000000101';
    const body = await request.json();

    const { query, subjectCode, sourceScope = 'ALL_ACADEMIC_RESOURCES', limit = 6 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const parsedQuery = QueryUnderstandingParser.parse(query);
    if (subjectCode) parsedQuery.subjectCode = subjectCode;
    parsedQuery.sourceScope = sourceScope;

    const result = await HybridRetrievalEngine.retrieve(parsedQuery, userId, Number(limit));

    return NextResponse.json(
      {
        success: true,
        query: result.query,
        parsed: {
          intent: parsedQuery.intent,
          subjectCode: parsedQuery.subjectCode,
          subjectName: parsedQuery.subjectName,
          topicId: parsedQuery.topicId,
          topicTitle: parsedQuery.topicTitle,
          marks: parsedQuery.marks,
          language: parsedQuery.language,
        },
        chunks: result.chunks,
        citations: result.citations,
        confidence: result.confidence,
        isGroundedInOfficialSyllabus: result.isGroundedInOfficialSyllabus,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[API /intelligence/search POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Hybrid search execution failed' },
      { status: 500 }
    );
  }
}

