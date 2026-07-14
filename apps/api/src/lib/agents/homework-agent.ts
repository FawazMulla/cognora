import { aiGateway } from "../ai-gateway";

export interface StyleProfile {
  avgSentenceLength?: number;
  formalityLevel?: string;
  vocabularyRange?: string;
  paragraphStructure?: any;
}

export async function extractStyleProfile(sampleText: string): Promise<StyleProfile> {
  const result = await aiGateway.invoke("knowledge_extraction", { 
    type: "style_profile", 
    text: sampleText 
  });
  
  return {
    avgSentenceLength: result.avgSentenceLength || 15,
    formalityLevel: result.formalityLevel || 'neutral',
    vocabularyRange: result.vocabularyRange || 'intermediate',
    paragraphStructure: result.paragraphStructure || {}
  };
}

export async function homeworkGeneratorNode(
  question: string,
  instructions: string,
  wordLimit: number,
  styleProfile?: StyleProfile
) {
  let styleInstruction = "Use a neutral academic style calibrated to university-level undergraduate writing.";
  
  if (styleProfile) {
    styleInstruction = `Mimic this style: Formality: ${styleProfile.formalityLevel}, 
    Vocab: ${styleProfile.vocabularyRange}, 
    Avg sentence length: ${styleProfile.avgSentenceLength}. 
    Avoid overtly formulaic AI-generated phrasing.`;
  }

  const prompt = `Write a submission-ready homework answer.
  Question: "${question}"
  Instructions: "${instructions || 'None'}"
  Target Word Count: ${wordLimit} words.
  Style: ${styleInstruction}`;

  const generated = await aiGateway.invoke("homework_gen", { text: prompt });
  
  // FR-023: Grammar check
  const grammarChecked = await aiGateway.invoke("homework_gen", { type: "grammar_check", text: generated.answer });
  
  // Mock readability score
  const readabilityScore = 65; 

  return {
    answer: grammarChecked.answer || generated.answer,
    wordCount: generated.wordCount || generated.answer.split(/\s+/).length,
    readabilityScore,
    handwritingFriendlyVersion: (grammarChecked.answer || generated.answer).split('.').join('.\n\n')
  };
}
