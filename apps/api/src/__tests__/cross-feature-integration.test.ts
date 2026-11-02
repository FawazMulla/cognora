import { describe, it, expect } from 'vitest';

const API_BASE = 'http://localhost:3001';
const AUTH_HEADER = {
  'Authorization': 'Bearer demo-token',
  'Content-Type': 'application/json',
};

describe('CROSS-FEATURE INTELLIGENCE & ACADEMIC ECOSYSTEM', { timeout: 15000 }, () => {
  // WORKFLOW 1: Document Upload -> Atlas Mapping & Smart Revision
  it('Workflow 1: Document processing automatically maps to syllabus and creates Smart Revision cards', async () => {
    // 1. Process document via API
    const uploadRes = await fetch(`${API_BASE}/api/intelligence/documents`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({
        filename: 'unit1_bayesian_networks_notes.txt',
        content: `Unit 1: Uncertainty and Probabilistic Reasoning.
Bayesian Networks are Directed Acyclic Graphs (DAGs) representing joint probability distributions.
Each node corresponds to a random variable with a conditional probability table (CPT).
Conditional independence simplifies the chain rule: P(X1...Xn) = Product P(Xi | Parents(Xi)).
Inference can be exact (Variable Elimination) or approximate (MCMC sampling).`,
        fileType: 'text/plain',
        subjectCode: 'ITC701',
      }),
    });

    expect(uploadRes.status).toBe(201);
    const uploadData = await uploadRes.json();
    expect(uploadData.success).toBe(true);

    // 2. Verify cross-feature opportunities were created
    const recRes = await fetch(`${API_BASE}/api/intelligence/recommendations`, {
      headers: AUTH_HEADER,
    });
    expect(recRes.status).toBe(200);
    const recData = await recRes.json();
    expect(recData.success).toBe(true);

    const mappedOp = recData.opportunities.find((o: any) => o.type === 'resource_mapped');
    expect(mappedOp).toBeDefined();
    expect(mappedOp.subjectCode).toBe('ITC701');

    const revOp = recData.opportunities.find((o: any) => o.type === 'smart_revision');
    expect(revOp).toBeDefined();
  });

  // WORKFLOW 2: Topic Quiz Completion -> Topic Learning Evidence -> Smart Revision Recommendation
  it('Workflow 2: Low topic quiz score updates learning evidence and queues Smart Revision cards', async () => {
    // 1. Student takes quiz on Bayesian Networks and scores 40% (low)
    const actRes = await fetch(`${API_BASE}/api/atlas/activity`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({
        topicId: 'itc701-t1',
        activityType: 'quiz',
        score: 40,
      }),
    });

    expect(actRes.status).toBe(200);
    const actData = await actRes.json();
    expect(actData.success).toBe(true);
    expect(actData.crossFeatureOpportunities.length).toBeGreaterThan(0);

    const weakOp = actData.crossFeatureOpportunities.find(
      (o: any) => o.type === 'smart_revision' && o.topicId === 'itc701-t1'
    );
    expect(weakOp).toBeDefined();
    expect(weakOp.badge).toBe('Priority Revision');
  });

  // WORKFLOW 3: Video Lecture Watch -> Unlocks PYQ Challenges & Next Steps
  it('Workflow 3: Completing a lecture unlocks connected PYQs and marks topic progress', async () => {
    // 1. Student finishes watching lecture for topic itc701-t4 (Fuzzy Logic)
    const actRes = await fetch(`${API_BASE}/api/atlas/activity`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({
        topicId: 'itc701-t4',
        activityType: 'video',
        videoWatched: true,
      }),
    });

    expect(actRes.status).toBe(200);
    const actData = await actRes.json();
    expect(actData.success).toBe(true);
    expect(actData.mastery).toBeGreaterThanOrEqual(25);

    const pyqOp = actData.crossFeatureOpportunities.find(
      (o: any) => o.type === 'pyq_recommendation' && o.topicId === 'itc701-t4'
    );
    expect(pyqOp).toBeDefined();
    expect(pyqOp.actionUrl).toBe('/pyq-intelligence');
  });

  // WORKFLOW 4: PYQ Attempt & Answer Evaluation -> Learning Gap Diagnostics
  it('Workflow 4: Evaluating an answer diagnoses missing concepts and emits cross-feature feedback', async () => {
    // 1. Student submits answer with incomplete technical depth
    const optRes = await fetch(`${API_BASE}/api/answers/optimize`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({
        question: 'Explain Mamdani Fuzzy Controller and Defuzzification methods with formula',
        studentAnswer: 'Fuzzy logic uses truth values between 0 and 1. Mamdani controller is used in control systems.',
        subjectId: '11111111-1111-1111-1111-111111111111',
        topic: 'itc701-t4',
      }),
    });

    expect(optRes.status).toBe(200);
    const optData = await optRes.json();
    expect(optData.missingConcepts).toBeDefined();
    expect(optData.crossFeatureOpportunities).toBeDefined();
    expect(optData.crossFeatureOpportunities.length).toBeGreaterThan(0);
  });

  // WORKFLOW 5: Repeated Concept Struggle -> Prerequisite & Visualizer Remediation
  it('Workflow 5: Repeated difficulty diagnoses struggle, providing prerequisites, visualizer, and Hinglish explanation', async () => {
    // 1. Query the topic via API and verify crossFeatureIntelligence attachment
    const topicRes = await fetch(`${API_BASE}/api/atlas/topic?id=itc701-t1`, {
      headers: AUTH_HEADER,
    });
    expect(topicRes.status).toBe(200);
    const topicData = await topicRes.json();
    expect(topicData.crossFeatureIntelligence).toBeDefined();
    expect(topicData.crossFeatureIntelligence.conceptVisualizer).toBe('bayesian-network');
    expect(topicData.crossFeatureIntelligence.prerequisites).toBeDefined();
    expect(topicData.crossFeatureIntelligence.alternativeExplanation).toBeDefined();

    // 2. Query intelligence recommendations for this specific topic
    const recRes = await fetch(`${API_BASE}/api/intelligence/recommendations?topicId=itc701-t1`, {
      headers: AUTH_HEADER,
    });
    expect(recRes.status).toBe(200);
    const recData = await recRes.json();
    expect(recData.struggleDiagnosis).toBeDefined();
    expect(recData.struggleDiagnosis.recommendedVisualizer).toBe('bayesian-network');
  });

  // WORKFLOW 6: Mock Exam Completion -> Updates 7-Day Adaptive Revision Roadmap
  it('Workflow 6: Completing mock exam recalibrates multi-day revision roadmap', async () => {
    // 1. Post mock exam completion event
    const eventRes = await fetch(`${API_BASE}/api/events`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({
        eventType: 'mock_exam.completed',
        data: {
          score: 58,
          weakModules: ['Module 1: Uncertainty', 'Module 3: Fuzzy Logic'],
        },
      }),
    });

    expect(eventRes.status).toBe(200);
    const eventData = await eventRes.json();
    expect(eventData.success).toBe(true);
    expect(eventData.opportunitiesGenerated.length).toBeGreaterThan(0);

    const mockOp = eventData.opportunitiesGenerated[0];
    expect(mockOp.sourceEvent).toBe('mock_exam.completed');
    expect(mockOp.badge).toBe('Roadmap Updated');

    // 2. Fetch student twin revision roadmap
    const planRes = await fetch(`${API_BASE}/api/student-twin/revision-plan`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({ subjectId: 'itc701', examDate: '2026-11-20' }),
    });
    expect(planRes.status).toBe(200);
    const planData = await planRes.json();
    expect(planData.plan.length).toBe(7);
  });
});
