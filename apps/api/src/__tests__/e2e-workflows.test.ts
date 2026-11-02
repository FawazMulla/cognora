import { describe, it, expect } from 'vitest';
import { ATLAS_SUBJECTS, getTopicById } from '../lib/atlasCatalogue';
import { calculateSM2, calculateFSRS, getForgettingCurve } from '../lib/sm2';
import { uploadInitSchema } from '../lib/validators/resource';
import { QueryUnderstandingParser } from '../lib/cic/retrieval/query-parser';
import { DeterministicAnswerCache } from '../lib/cic/cache/deterministic-cache';

const API_BASE = 'http://localhost:3001';
const AUTH_HEADER = {
  'Authorization': 'Bearer demo-token',
  'Content-Type': 'application/json',
};

describe('WORKFLOW 1: New Student Onboarding & Navigation', () => {
  it('WS1-1: Should retrieve all 5 Mumbai University Semester VII syllabi', async () => {
    const res = await fetch(`${API_BASE}/api/atlas/subjects`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.subjects).toHaveLength(5);

    const codes = data.subjects.map((s: any) => s.code);
    expect(codes).toContain('ITC701');
    expect(codes).toContain('ITC702');
    expect(codes).toContain('ITD07014');
    expect(codes).toContain('ITD07024');
    expect(codes).toContain('ILO7016');
  });

  it('WS1-2: Should fetch and persist student preferences (theme, reading density)', async () => {
    // 1. Fetch initial preferences
    const getRes = await fetch(`${API_BASE}/api/preferences`, { headers: AUTH_HEADER });
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.preferences).toBeDefined();

    // 2. Update preferences
    const postRes = await fetch(`${API_BASE}/api/preferences`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({
        theme: 'dark',
        readingDensity: 'compact',
        languagePreference: 'hinglish',
      }),
    });
    expect(postRes.status).toBe(200);
    const postData = await postRes.json();
    expect(postData.preferences.theme).toBe('dark');
    expect(postData.preferences.readingDensity).toBe('compact');
  });

  it('WS1-3: Should persist and resume student last navigation state', async () => {
    // 1. Post current page
    const postRes = await fetch(`${API_BASE}/api/navigation/last-state`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({
        lastPage: '/atlas',
        subjectId: 'itc701',
        subjectName: 'AI and DS - II',
        moduleNumber: '1',
        topic: 'Bayesian Networks',
        scrollPercentage: 45,
      }),
    });
    expect(postRes.status).toBe(200);

    // 2. Read state back
    const getRes = await fetch(`${API_BASE}/api/navigation/last-state`, { headers: AUTH_HEADER });
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.navigationState).toBeDefined();
    expect(getData.navigationState.lastPage).toBe('/atlas');
  });
});

describe('WORKFLOW 2: Document Learning & Grounded Retrieval', () => {
  it('WS2-1: Validates document uploads strictly via uploadInitSchema', () => {
    // Valid PDF
    const valid = uploadInitSchema.safeParse({
      filename: 'unit1_uncertainty.pdf',
      fileType: 'application/pdf',
      sizeBytes: 1024 * 500,
      sha256Hash: 'a'.repeat(64),
      subjectId: '11111111-1111-1111-1111-111111111111',
    });
    expect(valid.success).toBe(true);

    // Disallowed extension/type (.exe)
    const invalidType = uploadInitSchema.safeParse({
      filename: 'malicious.exe',
      fileType: 'application/x-msdownload',
      sizeBytes: 1024,
      sha256Hash: 'a'.repeat(64),
      subjectId: '11111111-1111-1111-1111-111111111111',
    });
    expect(invalidType.success).toBe(false);

    // Oversized (>50MB)
    const oversized = uploadInitSchema.safeParse({
      filename: 'massive_book.pdf',
      fileType: 'application/pdf',
      sizeBytes: 55 * 1024 * 1024,
      sha256Hash: 'a'.repeat(64),
      subjectId: '11111111-1111-1111-1111-111111111111',
    });
    expect(oversized.success).toBe(false);
  });

  it('WS2-2: Parses academic queries and maps to correct syllabus unit', () => {
    const parsed = QueryUnderstandingParser.parse('Explain Bayesian Networks conditional probability 5 marks');
    expect(parsed.intent).toBe('ANSWER_GENERATION');
    expect(parsed.marks).toBe(5);
    expect(parsed.subjectCode).toBe('ITC701');
  });

  it('WS2-3: Performs hybrid search with verified citations and grounding', async () => {
    const res = await fetch(`${API_BASE}/api/intelligence/search`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({
        query: 'Bayesian Networks Probabilistic Inference',
        subjectCode: 'ITC701',
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.isGroundedInOfficialSyllabus).toBe(true);
    expect(data.chunks.length).toBeGreaterThan(0);
    expect(data.citations.length).toBeGreaterThan(0);
  });

  it('WS2-4: Asks an academic question and receives grounded response', async () => {
    const res = await fetch(`${API_BASE}/api/intelligence/ask`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({
        query: 'What is Mamdani fuzzy inference system and defuzzification?',
        subjectCode: 'ITC701',
        marks: 5,
        language: 'english',
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.answer).toBeDefined();
    expect(typeof data.data.answer).toBe('string');
  });

  it('WS2-5: Successfully bookmarks an academic finding', async () => {
    const res = await fetch(`${API_BASE}/api/bookmarks`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({
        itemType: 'topic',
        title: 'Mamdani Fuzzy Inference Note',
        targetUrl: '/atlas?topic=itc701-t2',
        subjectName: 'AI and DS – II',
        topicTitle: 'Fuzzy Inference Systems',
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.status).toBeDefined();
  });
});

describe('WORKFLOW 3: Visual Learning Atlas & Concept Visualizers', () => {
  it('WS3-1: Retrieves topic details with verified video lecture catalogue', async () => {
    const res = await fetch(`${API_BASE}/api/atlas/topic?id=itc701-t1`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.subject.code).toBe('ITC701');
    expect(data.topic.title).toContain('Bayesian Networks');
    expect(data.topic.videos.length).toBeGreaterThan(0);

    const video = data.topic.videos[0];
    expect(video.youtubeId).toMatch(/^[a-zA-Z0-9_-]{11}$/);
    expect(video.embedUrl).toContain('youtube.com/embed/');
  });

  it('WS3-2: Verifies interactive concept visualizers mapping across topics', () => {
    const t1 = getTopicById('itc701-t1');
    expect(t1?.topic.visualizerType).toBe('bayesian-network');

    const t4 = getTopicById('itc701-t4');
    expect(t4?.topic.visualizerType).toBe('fuzzy-mamdani');
  });

  it('WS3-3: Records student timestamped video annotation', async () => {
    const res = await fetch(`${API_BASE}/api/annotations`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({
        targetType: 'video',
        targetId: 'itc701-t1-v1',
        contentReference: '03:42',
        userNote: 'Key point: Joint probability distribution factorizes over DAG parents.',
        tags: ['exam-tip', 'mumbai-university'],
        color: 'emerald',
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.annotation).toBeDefined();
  });

  it('WS3-4: Evaluates quiz MCQ attempt and persists topic mastery', async () => {
    const res = await fetch(`${API_BASE}/api/atlas/activity`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({
        topicId: 'itc701-t1',
        activityType: 'quiz',
        score: 100,
        videoWatched: true,
        readingDone: true,
        pyqExplored: true,
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.mastery).toBe(100);
    expect(data.status).toBe('MASTERED');
  });
});

describe('WORKFLOW 4: Exam Preparation & Answer Optimization', () => {
  it('WS4-1: Generates structured academic answer tailored to marks weightage', async () => {
    // 2 marks question
    const res2M = await fetch(`${API_BASE}/api/answers/generate`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({
        question: 'Define Conditional Independence in Bayesian Networks',
        markValue: 2,
        format: 'concise',
      }),
    });
    expect(res2M.status).toBe(200);
    const data2M = await res2M.json();
    expect(data2M.answer).toBeDefined();

    // 10 marks question
    const res10M = await fetch(`${API_BASE}/api/answers/generate`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({
        question: 'Explain Mamdani Fuzzy Inference System architecture with fuzzification, rule evaluation, and defuzzification methods',
        markValue: 10,
        format: 'structured',
      }),
    });
    expect(res10M.status).toBe(200);
    const data10M = await res10M.json();
    expect(data10M.answer).toBeDefined();
  });

  it('WS4-2: Predicts student exam score based on topic mastery signals', async () => {
    const res = await fetch(`${API_BASE}/api/student-twin/predict-score`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({ subjectId: 'itc701' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.predictedScore).toBeGreaterThanOrEqual(0);
    expect(data.predictedScore).toBeLessThanOrEqual(100);
    expect(data.grade).toMatch(/^[O|A\+|A|B|C|F]$/);
  });
});

describe('WORKFLOW 5: Smart Revision & Spaced Repetition', () => {
  it('WS5-1: Computes SM-2 spaced repetition interval growth correctly', () => {
    // Rating 3 (Easy): Rapid recall increases interval
    const rEasy = calculateSM2(3, 1, 2.5);
    expect(rEasy.intervalDays).toBeGreaterThan(1);
    expect(rEasy.easeFactor).toBeGreaterThan(2.5);

    // Rating 0 (Again): Blackout resets interval to 1 day
    const rAgain = calculateSM2(0, 6, 2.5);
    expect(rAgain.intervalDays).toBe(1);
    expect(rAgain.easeFactor).toBeLessThan(2.0);
  });

  it('WS5-2: Computes FSRS-4.5 forgetting curves and retrievability', () => {
    const curve = getForgettingCurve(5.0, 14);
    expect(curve).toHaveLength(15); // Day 0 to 14
    expect(curve[0]?.retrievability).toBe(1.0);
    expect(curve[14]?.retrievability).toBeLessThan(1.0);
    expect(curve[14]?.retrievability).toBeGreaterThan(0.0);
  });

  it('WS5-3: Generates multi-day adaptive revision roadmap', async () => {
    const res = await fetch(`${API_BASE}/api/student-twin/revision-plan`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify({ subjectId: 'itc701', examDate: '2026-11-20' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.totalDays).toBeGreaterThan(0);
    expect(data.plan.length).toBeGreaterThan(0);
    expect(data.plan[0].tasks.length).toBeGreaterThan(0);
  });
});
