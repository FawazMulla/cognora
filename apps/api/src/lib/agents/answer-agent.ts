import { aiGateway } from "../ai-gateway";

export interface AnswerGenerationParams {
  question: string;
  markValue: number;
  format: string; // 'Topper', 'University', 'Concise', 'Revision', 'Bullet', 'Definition-only'
  studentModelSnapshot?: any;
}

export async function answerGeneratorNode(params: AnswerGenerationParams) {
  // Enforce word ceilings based on mark value (FR-017)
  let maxWords = 80;
  if (params.markValue >= 10) maxWords = 600;
  else if (params.markValue >= 5) maxWords = 250;
  
  if (params.format === 'Concise') {
    maxWords = Math.floor(maxWords * 0.7);
  }

  // FR-026 Adaptive Logic
  let adaptiveInstructions = "";
  if (params.studentModelSnapshot) {
    const { confidence, preferredStyle } = params.studentModelSnapshot;
    if (confidence !== undefined) {
      if (confidence < 40) {
        adaptiveInstructions += " The student has low confidence in this topic. Include a foundational definition and a worked example. ";
      } else if (confidence > 75) {
        adaptiveInstructions += " The student has high confidence in this topic. Omit introductory definitions and use technical vocabulary without simplification. ";
      }
    }
    
    if (preferredStyle === 'Visual') {
      adaptiveInstructions += " Include diagram labels, structured tables, or ASCII-art representations where applicable. ";
    }
  }

  const prompt = `Generate a ${params.format} style answer for: "${params.question}". 
  It is worth ${params.markValue} marks. Maximum ${maxWords} words. ${adaptiveInstructions}`;

  const generation = await aiGateway.invoke("answer_gen", { text: prompt });
  return { ...generation, targetMaxWords: maxWords };
}

export async function qualityVerifierNode(answerText: string, targetMaxWords: number, format: string) {
  // Mock quality verification (FR-032)
  const wordCount = answerText.split(/\s+/).length;
  const isWithinLimit = wordCount <= targetMaxWords * 1.15; // +15% tolerance

  if (!isWithinLimit) {
    return { passed: false, reason: `Word count ${wordCount} exceeds target ${targetMaxWords}` };
  }

  if (format === 'Bullet' && !answerText.includes('•') && !answerText.includes('- ')) {
    return { passed: false, reason: "Missing bullet points for Bullet format" };
  }

  return { passed: true };
}

export async function answerOptimizerNode(studentAnswer: string, question: string) {
  // Score student answer (FR-019)
  const score = await aiGateway.invoke("answer_gen", { 
    mode: "optimizer", 
    question, 
    studentAnswer 
  });

  // Mock scoring output
  return {
    scores: {
      structure: 7,
      keywordCoverage: 6,
      conceptCompleteness: 8,
      clarity: 7,
      examples: 5,
      presentation: 6
    },
    overallScore: 6.5,
    missingConcepts: ["backpropagation calculus", "vanishing gradient"],
    improvedVersion: "This is a much better version of your answer...",
    diffView: [
      { type: 'add', text: "Consider adding backpropagation formulas." }
    ]
  };
}
