/**
 * Tool: syllabus_mapper
 * Maps questions and topics to syllabus units and expected mark distribution.
 * Helps the AI give unit-aware, mark-calibrated answers.
 */

export interface SyllabusMapperInput {
  topic: string;
  marks?: number;
  subject?: string;
}

export interface SyllabusMapping {
  unit: string;
  unitNumber: number;
  expectedMarks: number;
  syllabusTopics: string[];
  markScheme: string;
  examinationTips: string[];
}

export function syllabusMapperTool(input: SyllabusMapperInput): SyllabusMapping {
  const topic = input.topic.toLowerCase();
  const marks = input.marks || 5;

  const wordTargets: Record<number, string> = {
    2: 'Define only (30-50 words)',
    5: 'Short explanation + example (150-200 words)',
    10: 'Detailed explanation + diagram/algorithm + example (400-600 words)'
  };

  let unit = 'Unit 1';
  let unitNum = 1;
  let topics: string[] = [];

  if (topic.includes('search') || topic.includes('heuristic') || topic.includes('a*') || topic.includes('bfs') || topic.includes('dfs')) {
    unit = 'Unit 1: Problem Solving and Search';
    unitNum = 1;
    topics = ['State Space Representation', 'Uninformed Search (BFS, DFS)', 'Informed Search (A*, Greedy)', 'Heuristic Functions', 'Alpha-Beta Pruning'];
  } else if (topic.includes('neural') || topic.includes('learning') || topic.includes('backprop') || topic.includes('cnn')) {
    unit = 'Unit 3: Machine Learning';
    unitNum = 3;
    topics = ['Supervised/Unsupervised Learning', 'Neural Networks', 'Backpropagation', 'CNN Architectures', 'Overfitting and Regularization'];
  } else if (topic.includes('knowledge') || topic.includes('expert') || topic.includes('inference') || topic.includes('prolog')) {
    unit = 'Unit 2: Knowledge Representation';
    unitNum = 2;
    topics = ['Propositional Logic', 'Predicate Logic', 'Inference Rules', 'Expert Systems', 'Semantic Networks'];
  } else if (topic.includes('natural') || topic.includes('nlp') || topic.includes('language')) {
    unit = 'Unit 5: Natural Language Processing';
    unitNum = 5;
    topics = ['Tokenization', 'POS Tagging', 'Parsing Techniques', 'Language Models', 'Sentiment Analysis'];
  } else {
    unit = 'Unit 4: Advanced Topics';
    unitNum = 4;
    topics = ['Fuzzy Logic', 'Genetic Algorithms', 'Planning Algorithms', 'Robotics AI', 'Multi-Agent Systems'];
  }

  const markScheme = wordTargets[marks] || wordTargets[5] || 'Short explanation + example (150-200 words)';

  return {
    unit,
    unitNumber: unitNum,
    expectedMarks: marks,
    syllabusTopics: topics,
    markScheme,
    examinationTips: [
      `Always define key terms first before explaining.`,
      `Include at least one worked example for ${marks >= 10 ? 'long' : 'short'} answers.`,
      `Draw labeled diagrams if applicable — they earn marks independently.`,
      `Conclude with real-world application to score full marks.`
    ]
  };
}
