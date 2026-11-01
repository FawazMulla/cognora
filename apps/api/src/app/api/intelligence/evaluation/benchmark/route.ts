import { NextResponse } from 'next/server';
import { AcademicBenchmarkSuite } from '../../../../../lib/cic/quality/benchmark';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const report = await AcademicBenchmarkSuite.runBenchmark();
    return NextResponse.json({ success: true, report }, { status: 200 });
  } catch (error: any) {
    console.error('[API /intelligence/evaluation/benchmark GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Benchmark evaluation failed' },
      { status: 500 }
    );
  }
}

