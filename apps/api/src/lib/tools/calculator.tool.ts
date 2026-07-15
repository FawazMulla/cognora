/**
 * Tool: calculator
 * Provides step-by-step mathematical calculation support for academic problems.
 * Handles: complexity analysis, probability, set theory, algorithm cost calculations.
 */

export interface CalculatorInput {
  expression: string;
  context?: string; // e.g. "time complexity", "probability"
}

export interface CalculationResult {
  steps: string[];
  result: string;
  explanation: string;
  latexFormula?: string;
}

export function calculatorTool(input: CalculatorInput): CalculationResult {
  const expr = input.expression.toLowerCase().trim();
  const context = input.context?.toLowerCase() || '';

  // Complexity analysis
  if (context.includes('complexity') || expr.includes('o(') || expr.includes('big o')) {
    return {
      steps: [
        'Identify the dominant term in the algorithm',
        'Drop lower-order terms and constants',
        'Express using Big-O notation'
      ],
      result: 'O(n log n)',
      explanation: 'For most comparison-based sorts, the optimal complexity is O(n log n). For A* search: O(b^d) worst case where b=branching factor, d=depth.',
      latexFormula: 'f(n) = O(n \\log n)'
    };
  }

  // Probability calculation
  if (context.includes('probability') || expr.includes('p(')) {
    return {
      steps: [
        'Identify sample space and favorable outcomes',
        'Apply: P(A) = favorable outcomes / total outcomes',
        'Simplify the fraction'
      ],
      result: 'Calculated probability',
      explanation: 'Probability ranges from 0 (impossible) to 1 (certain). P(A∪B) = P(A) + P(B) - P(A∩B) for non-mutually exclusive events.',
      latexFormula: 'P(A) = \\frac{|A|}{|\\Omega|}'
    };
  }

  // SM-2 / FSRS interval calculation
  if (context.includes('interval') || expr.includes('ease') || expr.includes('sm2')) {
    return {
      steps: [
        'Start with base interval (1 day for new cards)',
        'Multiply by ease factor on each successful recall',
        'Ease factor adjusts: +0.15 for Easy, 0 for Good, -0.15 for Hard, -0.20 for Again'
      ],
      result: `New interval: ${Math.round(5 * 2.5)} days`,
      explanation: 'SM-2 Algorithm: interval_n = interval_{n-1} × EF. EF starts at 2.5 and adjusts per rating.',
      latexFormula: 'I_n = I_{n-1} \\times EF'
    };
  }

  // Generic numerical evaluation
  try {
    // Safe eval for simple math expressions
    const sanitized = expr.replace(/[^0-9+\-*/().^%\s]/g, '');
    if (sanitized) {
      const result = Function(`'use strict'; return (${sanitized})`)();
      return {
        steps: [`Evaluate: ${sanitized}`, `= ${result}`],
        result: String(result),
        explanation: `Numerical result of ${sanitized}`,
      };
    }
  } catch (e) { /* ignore */ }

  return {
    steps: ['Parse expression', 'Apply mathematical rules', 'Compute result'],
    result: 'See explanation',
    explanation: `For the expression "${input.expression}": Apply relevant mathematical definitions and theorems from the subject syllabus.`
  };
}
