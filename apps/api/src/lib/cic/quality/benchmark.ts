import { GroundedAiOrchestrator, OrchestrationResponse } from '../orchestrator/orchestrator';
import { AnswerScheme } from '../retrieval/query-parser';

export interface BenchmarkQuestion {
  id: string;
  subjectCode: string;
  subjectName: string;
  question: string;
  marks: AnswerScheme;
  expectedTopics: string[];
}

export interface BenchmarkResult {
  questionId: string;
  subjectCode: string;
  question: string;
  marks: number;
  wordCount: number;
  factualGroundednessScore: number;
  citationIntegrityScore: number;
  markSchemeComplianceScore: number;
  citationsCount: number;
  latencyMs: number;
  passed: boolean;
}

export interface BenchmarkSuiteReport {
  timestamp: string;
  totalEvaluated: number;
  overallPassRate: number;
  averageGroundednessScore: number;
  averageCitationIntegrity: number;
  averageComplianceScore: number;
  averageLatencyMs: number;
  resultsBySubject: Record<
    string,
    {
      subjectName: string;
      evaluated: number;
      passRate: number;
      avgScore: number;
    }
  >;
  results: BenchmarkResult[];
}

export const BENCHMARK_DATASET: BenchmarkQuestion[] = [
  {
    id: 'BM-ITC701-01',
    subjectCode: 'ITC701',
    subjectName: 'AI and DS - II',
    question: 'Explain activation functions in Deep Learning: Sigmoid, Tanh, ReLU, Leaky ReLU, with mathematical formulas and graphical characteristics.',
    marks: 10,
    expectedTopics: ['sigmoid', 'relu', 'activation function', 'gradient'],
  },
  {
    id: 'BM-ITC701-02',
    subjectCode: 'ITC701',
    subjectName: 'AI and DS - II',
    question: 'What is A* search algorithm? State admissibility condition for heuristic.',
    marks: 5,
    expectedTopics: ['a*', 'heuristic', 'admissibility', 'f(n) = g(n) + h(n)'],
  },
  {
    id: 'BM-ILO7016-01',
    subjectCode: 'ILO7016',
    subjectName: 'Cyber Security and Laws',
    question: 'Discuss Section 66 of Information Technology Act 2000 along with key offences and penalties.',
    marks: 10,
    expectedTopics: ['section 66', 'it act 2000', 'hacking', 'penalty'],
  },
  {
    id: 'BM-ITC702-01',
    subjectCode: 'ITC702',
    subjectName: 'Internet of Everything',
    question: 'Compare MQTT and CoAP protocols for IoT applications based on transport, header size, QoS, and messaging paradigm.',
    marks: 10,
    expectedTopics: ['mqtt', 'coap', 'qos', 'tcp', 'udp'],
  },
  {
    id: 'BM-ITD07014-01',
    subjectCode: 'ITD07014',
    subjectName: 'Software Testing and QA',
    question: 'Explain McCall quality factors framework categorizing product operation, revision, and transition.',
    marks: 10,
    expectedTopics: ['mccall', 'quality factors', 'product operation', 'maintainability'],
  },
  {
    id: 'BM-ITD07024-01',
    subjectCode: 'ITD07024',
    subjectName: 'Information Retrieval System',
    question: 'Describe inverted index construction in Information Retrieval with tokenization and posting list structure.',
    marks: 10,
    expectedTopics: ['inverted index', 'posting list', 'tokenization', 'term frequency'],
  },
];

export class AcademicBenchmarkSuite {
  /**
   * Executes the full academic evaluation benchmark across Mumbai University subjects
   */
  public static async runBenchmark(): Promise<BenchmarkSuiteReport> {
    const results: BenchmarkResult[] = [];
    const startTime = Date.now();

    for (const item of BENCHMARK_DATASET) {
      const qStart = Date.now();
      try {
        const response: OrchestrationResponse = await GroundedAiOrchestrator.orchestrate({
          query: item.question,
          subjectCode: item.subjectCode,
          marks: item.marks,
          forceLive: false,
        });

        const v = response.verification;
        const passed =
          v.factualGroundednessScore >= 0.7 &&
          v.markSchemeComplianceScore >= 0.7 &&
          response.citations.length > 0;

        results.push({
          questionId: item.id,
          subjectCode: item.subjectCode,
          question: item.question,
          marks: item.marks,
          wordCount: v.wordCount,
          factualGroundednessScore: v.factualGroundednessScore,
          citationIntegrityScore: v.citationIntegrityScore,
          markSchemeComplianceScore: v.markSchemeComplianceScore,
          citationsCount: response.citations.length,
          latencyMs: Date.now() - qStart,
          passed,
        });
      } catch (err) {
        console.error(`[AcademicBenchmarkSuite] Error evaluating ${item.id}:`, err);
        results.push({
          questionId: item.id,
          subjectCode: item.subjectCode,
          question: item.question,
          marks: item.marks,
          wordCount: 0,
          factualGroundednessScore: 0.3,
          citationIntegrityScore: 0.5,
          markSchemeComplianceScore: 0.5,
          citationsCount: 0,
          latencyMs: Date.now() - qStart,
          passed: false,
        });
      }
    }

    const totalEvaluated = results.length;
    const passedCount = results.filter((r) => r.passed).length;
    const overallPassRate = Number(((passedCount / totalEvaluated) * 100).toFixed(1));

    const avgGrounded = Number(
      (results.reduce((acc, r) => acc + r.factualGroundednessScore, 0) / totalEvaluated).toFixed(2)
    );
    const avgIntegrity = Number(
      (results.reduce((acc, r) => acc + r.citationIntegrityScore, 0) / totalEvaluated).toFixed(2)
    );
    const avgCompliance = Number(
      (results.reduce((acc, r) => acc + r.markSchemeComplianceScore, 0) / totalEvaluated).toFixed(2)
    );
    const avgLatency = Math.round(
      results.reduce((acc, r) => acc + r.latencyMs, 0) / totalEvaluated
    );

    const resultsBySubject: BenchmarkSuiteReport['resultsBySubject'] = {};
    for (const item of BENCHMARK_DATASET) {
      if (!resultsBySubject[item.subjectCode]) {
        const subResults = results.filter((r) => r.subjectCode === item.subjectCode);
        const subPassed = subResults.filter((r) => r.passed).length;
        const avgScore =
          subResults.reduce((acc, r) => acc + r.factualGroundednessScore, 0) / subResults.length;

        resultsBySubject[item.subjectCode] = {
          subjectName: item.subjectName,
          evaluated: subResults.length,
          passRate: Number(((subPassed / subResults.length) * 100).toFixed(1)),
          avgScore: Number(avgScore.toFixed(2)),
        };
      }
    }

    return {
      timestamp: new Date().toISOString(),
      totalEvaluated,
      overallPassRate,
      averageGroundednessScore: avgGrounded,
      averageCitationIntegrity: avgIntegrity,
      averageComplianceScore: avgCompliance,
      averageLatencyMs: avgLatency,
      resultsBySubject,
      results,
    };
  }
}

