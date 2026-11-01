import { db, client } from "../../../../db";
import { and, eq, ilike, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import postgres from 'postgres';

import {
  bookmarks,
  flashcards,
  pyqQuestions,
  resources,
  subjects,
} from '../../../../db/schema';
import { env } from '../../../../lib/env';


export const dynamic = 'force-dynamic';

export interface SearchResultItem {
  id: string;
  type: 'navigation' | 'subject' | 'topic' | 'resource' | 'question' | 'action';
  title: string;
  subtitle?: string;
  url: string;
  badge?: string;
  metadata?: Record<string, unknown>;
}

const STATIC_NAVIGATION: SearchResultItem[] = [
  { id: 'nav-dash', type: 'navigation', title: 'Dashboard', subtitle: 'Overview, analytics & study status', url: '/', badge: 'Workspace' },
  { id: 'nav-syllabus', type: 'navigation', title: 'Syllabus & Units Manager', subtitle: 'Module breakdown & curriculum mapping', url: '/syllabus', badge: 'Curriculum' },
  { id: 'nav-notes', type: 'navigation', title: 'Exam & IAE Notes', subtitle: 'Comprehensive high-yield study notes', url: '/exam-notes', badge: 'Study' },
  { id: 'nav-qb', type: 'navigation', title: 'Question Bank (QB) Explorer', subtitle: 'Unit-wise questions with mark schemes', url: '/question-bank', badge: 'Exams' },
  { id: 'nav-ans', type: 'navigation', title: 'Structured Topper Answers', subtitle: 'Exam-ready model answers with diagrams', url: '/answers', badge: 'Engine' },
  { id: 'nav-ans-opt', type: 'navigation', title: 'Answer Optimizer', subtitle: 'Real-time rubric grading & feedback', url: '/answer-optimizer', badge: 'Evaluation' },
  { id: 'nav-pyq', type: 'navigation', title: 'PYQ Intelligence', subtitle: '5-year university paper frequency heatmap', url: '/pyq', badge: 'Analytics' },
  { id: 'nav-practicals', type: 'navigation', title: 'Practical Journal & Code Studio', subtitle: 'Executable code, ASCII traces & viva', url: '/practicals', badge: 'Labs' },
  { id: 'nav-viva', type: 'navigation', title: 'Viva Voice Evaluation Engine', subtitle: 'AI examiner interactive oral defense', url: '/viva', badge: 'Exam' },
  { id: 'nav-rev', type: 'navigation', title: 'Smart Revision & Flashcards', subtitle: 'Spaced repetition SM-2 retention engine', url: '/revision', badge: 'Memory' },
  { id: 'nav-twin', type: 'navigation', title: 'Digital Student Twin', subtitle: 'Cognitive learning health & exam forecast', url: '/twin', badge: 'AI Model' },
  { id: 'nav-bookmarks', type: 'navigation', title: 'Bookmarks & Saved Vault', subtitle: 'Centralized repository of saved materials', url: '/bookmarks', badge: 'Vault' },
  { id: 'nav-assignments', type: 'navigation', title: 'Assignments Engine', subtitle: 'Homework generation in student handwriting style', url: '/assignments', badge: 'Homework' },
  { id: 'nav-knowledge', type: 'navigation', title: 'Knowledge Graph', subtitle: 'Interactive concept graph & node dependencies', url: '/knowledge', badge: 'Graph' },
];

const STATIC_ACTIONS: SearchResultItem[] = [
  { id: 'act-solve-answer', type: 'action', title: 'Draft a 10-Mark Model Answer', subtitle: 'Generate topper response with diagrams', url: '/answers', badge: 'Action' },
  { id: 'act-generate-practical', type: 'action', title: 'Generate Lab Practical Journal', subtitle: 'Create complete experiment writeup & code', url: '/practicals', badge: 'Action' },
  { id: 'act-start-viva', type: 'action', title: 'Start a Mock Viva Exam', subtitle: 'Oral test with instant scoring', url: '/viva', badge: 'Action' },
  { id: 'act-view-bookmarks', type: 'action', title: 'View Saved Bookmarks & Annotations', subtitle: 'Open your personal vault', url: '/bookmarks', badge: 'Vault' },
  { id: 'act-run-pyq', type: 'action', title: 'Analyze Upcoming Paper Probability', subtitle: 'Run predictive frequency models', url: '/pyq', badge: 'Prediction' },
  { id: 'act-review-flashcards', type: 'action', title: 'Start Daily Spaced Repetition Flashcards', subtitle: 'Revise due cards with SM-2 algorithm', url: '/revision', badge: 'Memory' },
];

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim().toLowerCase();

    if (!query) {
      // Return default recent navigation and actions
      return NextResponse.json({
        results: {
          navigation: STATIC_NAVIGATION.slice(0, 6),
          subjects: [],
          topics: [],
          resources: [],
          questions: [],
          actions: STATIC_ACTIONS.slice(0, 4),
        },
      });
    }

    // 1. Filter Navigation items
    const matchedNavigation = STATIC_NAVIGATION.filter(
      item =>
        item.title.toLowerCase().includes(query) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(query)),
    );

    // 2. Filter Quick Actions
    const matchedActions = STATIC_ACTIONS.filter(
      item =>
        item.title.toLowerCase().includes(query) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(query)),
    );

    let userSubjects: SearchResultItem[] = [];
    let userResources: SearchResultItem[] = [];
    let userQuestions: SearchResultItem[] = [];
    let userBookmarks: SearchResultItem[] = [];

    // Query DB if authenticated
    if (userId) {
      try {
        const [subRows, resRows, pyqRows, bmRows] = await Promise.all([
          db
            .select({ id: subjects.id, name: subjects.name, code: subjects.code })
            .from(subjects)
            .where(
              and(
                eq(subjects.userId, userId),
                or(ilike(subjects.name, `%${query}%`), ilike(subjects.code, `%${query}%`)),
              ),
            )
            .limit(5),

          db
            .select({ id: resources.id, filename: resources.filename, fileType: resources.fileType, subjectId: resources.subjectId })
            .from(resources)
            .where(
              and(
                eq(resources.userId, userId),
                ilike(resources.filename, `%${query}%`),
              ),
            )
            .limit(5),

          db
            .select({ id: pyqQuestions.id, questionText: pyqQuestions.questionText, markValue: pyqQuestions.markValue, unitHeader: pyqQuestions.unitHeader })
            .from(pyqQuestions)
            .where(
              and(
                eq(pyqQuestions.userId, userId),
                or(ilike(pyqQuestions.questionText, `%${query}%`), ilike(pyqQuestions.unitHeader, `%${query}%`)),
              ),
            )
            .limit(5),

          db
            .select({ id: bookmarks.id, title: bookmarks.title, itemType: bookmarks.itemType, targetUrl: bookmarks.targetUrl, subjectName: bookmarks.subjectName })
            .from(bookmarks)
            .where(
              and(
                eq(bookmarks.userId, userId),
                or(ilike(bookmarks.title, `%${query}%`), ilike(bookmarks.topicTitle, `%${query}%`)),
              ),
            )
            .limit(5),
        ]);

        userSubjects = subRows.map(s => ({
          id: s.id,
          type: 'subject',
          title: s.name,
          subtitle: `Subject Code: ${s.code || 'CS-701'}`,
          url: `/subject/${s.id}`,
          badge: s.code || 'Subject',
        }));

        userResources = resRows.map(r => ({
          id: r.id,
          type: 'resource',
          title: r.filename,
          subtitle: `Format: ${r.fileType.toUpperCase()}`,
          url: `/exam-notes?resourceId=${r.id}`,
          badge: 'PDF Note',
        }));

        userQuestions = pyqRows.map(q => ({
          id: q.id,
          type: 'question',
          title: q.questionText,
          subtitle: `${q.unitHeader || 'Syllabus Unit'} • ${q.markValue || 10} Marks`,
          url: `/answers?q=${encodeURIComponent(q.questionText)}&marks=${q.markValue || 10}`,
          badge: 'PYQ',
        }));

        userBookmarks = bmRows.map(b => ({
          id: b.id,
          type: 'topic',
          title: b.title,
          subtitle: b.subjectName ? `In ${b.subjectName}` : 'Saved Bookmark',
          url: b.targetUrl,
          badge: 'Bookmark',
        }));
      } catch (dbErr) {
        console.warn('[search] DB search error, continuing with static & client results:', dbErr);
      }
    }

    return NextResponse.json({
      results: {
        navigation: matchedNavigation,
        subjects: userSubjects,
        topics: userBookmarks,
        resources: userResources,
        questions: userQuestions,
        actions: matchedActions,
      },
    });
  } catch (error) {
    console.error('[search/academic] Error:', error);
    return NextResponse.json({ error: 'Failed to execute search' }, { status: 500 });
  }
}

