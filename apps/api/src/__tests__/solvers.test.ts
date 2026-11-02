import { describe, it, expect } from 'vitest';

describe('Cognora Academic Core & Solvers', () => {
  describe('Asymptotic Complexity Classification', () => {
    function classifyComplexity(expr: string): string {
      const e = expr.toLowerCase().trim();
      if (e.includes('2^n')) return 'O(2^n)';
      if (e.includes('n^3')) return 'O(n^3)';
      if (e.includes('n^2')) return 'O(n^2)';
      if (e.includes('n log n') || (e.includes('n') && e.includes('log'))) return 'O(n log n)';
      if (e.includes('n')) return 'O(n)';
      if (e.includes('log')) return 'O(log n)';
      return 'O(1)';
    }

    it('correctly classifies quadratic polynomials', () => {
      expect(classifyComplexity('3n^2 + 5n + 12')).toBe('O(n^2)');
    });

    it('correctly classifies linearithmic expressions', () => {
      expect(classifyComplexity('n log n + 4n')).toBe('O(n log n)');
    });

    it('correctly classifies exponential bounds', () => {
      expect(classifyComplexity('2^n + n^3')).toBe('O(2^n)');
    });

    it('correctly classifies constant time', () => {
      expect(classifyComplexity('42')).toBe('O(1)');
    });
  });

  describe('Bayes Theorem Posterior Probability', () => {
    function computeBayesPosterior(prior: number, sensitivity: number, falseAlarm: number): number {
      return (sensitivity * prior) / (sensitivity * prior + falseAlarm * (1 - prior));
    }

    it('computes accurate posterior for rare disease / medical diagnostics', () => {
      // Prior: 1%, Sensitivity: 95%, False Alarm: 5%
      const posterior = computeBayesPosterior(0.01, 0.95, 0.05);
      expect(Number((posterior * 100).toFixed(2))).toBe(16.10);
    });

    it('computes accurate posterior for 50-50 prior', () => {
      const posterior = computeBayesPosterior(0.5, 0.9, 0.1);
      expect(posterior).toBeCloseTo(0.9, 2);
    });
  });

  describe('SM-2 Spaced Repetition Scheduling', () => {
    function computeNextInterval(prevInterval: number, ease: number, rating: number): { nextInterval: number; newEase: number } {
      let nextInterval = 1;
      let newEase = ease;

      if (rating >= 3) {
        if (prevInterval === 0) nextInterval = 1;
        else if (prevInterval === 1) nextInterval = 6;
        else nextInterval = Math.round(prevInterval * ease);
        newEase = Number((ease + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))).toFixed(2));
      } else {
        nextInterval = 1;
        newEase = Number(Math.max(1.3, ease - 0.2).toFixed(2));
      }

      return { nextInterval, newEase };
    }

    it('multiplies interval by ease factor on good recall (rating 4)', () => {
      const { nextInterval, newEase } = computeNextInterval(4, 2.5, 4);
      expect(nextInterval).toBe(10);
      expect(newEase).toBe(2.50);
    });

    it('resets interval to 1 day on failed recall (rating 1)', () => {
      const { nextInterval, newEase } = computeNextInterval(10, 2.5, 1);
      expect(nextInterval).toBe(1);
      expect(newEase).toBe(2.30);
    });
  });

  describe('Mark Weightage Target Calculation', () => {
    function getExpectedMarkWordBounds(marks: number): { minWords: number; maxWords: number } {
      if (marks <= 2) return { minWords: 40, maxWords: 100 };
      if (marks <= 5) return { minWords: 150, maxWords: 350 };
      if (marks <= 10) return { minWords: 500, maxWords: 1200 };
      return { minWords: 800, maxWords: 2000 };
    }

    it('allocates appropriate word budgets by marks', () => {
      expect(getExpectedMarkWordBounds(2).maxWords).toBe(100);
      expect(getExpectedMarkWordBounds(5).minWords).toBe(150);
      expect(getExpectedMarkWordBounds(10).minWords).toBe(500);
    });
  });
});
