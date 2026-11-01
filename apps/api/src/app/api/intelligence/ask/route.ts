import { NextResponse } from 'next/server';
import { GroundedAiOrchestrator } from '../../../../lib/cic/orchestrator/orchestrator';
import { LearnerIntelligenceManager } from '../../../../lib/cic/learner/profile';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id') || '00000000-0000-0000-0000-000000000101';
    const body = await request.json();

    const { query, subjectCode, marks, language, sourceScope, forceLive } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Question / prompt query is required' }, { status: 400 });
    }

    const response = await GroundedAiOrchestrator.orchestrate({
      query,
      subjectCode,
      marks,
      language,
      sourceScope,
      forceLive: Boolean(forceLive),
      userId,
    });

    // Optionally update learner mastery record if subject was identified
    if (response.subjectCode) {
      LearnerIntelligenceManager.recordInteraction({
        userId,
        topicId: response.intent,
        topicName: query.slice(0, 50),
        confidenceDelta: 2, // Positive academic interaction
      }).catch((e) => console.warn('[Learner update non-fatal]', e));
    }

    return NextResponse.json(
      {
        success: true,
        data: response,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[API /intelligence/ask POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Academic intelligence request failed' },
      { status: 500 }
    );
  }
}

