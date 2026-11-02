import { NextResponse } from 'next/server';
import { AcademicEventBus, AcademicEventType } from '../../../lib/cic/cross-feature/event-bus';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id') || '00000000-0000-0000-0000-000000000101';
    const events = AcademicEventBus.getEvents(userId);
    const opportunities = AcademicEventBus.getOpportunities(userId);

    return NextResponse.json({
      success: true,
      events,
      opportunities,
      activeCount: opportunities.length,
    }, { status: 200 });
  } catch (error: any) {
    console.error('[API /events GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id') || '00000000-0000-0000-0000-000000000101';
    const body = await request.json();

    const { eventType, data = {} } = body;

    if (!eventType) {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 });
    }

    const result = await AcademicEventBus.emit({
      userId,
      eventType: eventType as AcademicEventType,
      data,
    });

    return NextResponse.json({
      success: true,
      processed: result.processed,
      opportunitiesGenerated: result.opportunitiesGenerated,
    }, { status: 200 });
  } catch (error: any) {
    console.error('[API /events POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process academic event' }, { status: 500 });
  }
}

