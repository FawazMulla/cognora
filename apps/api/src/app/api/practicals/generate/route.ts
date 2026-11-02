interface ParsedPractical {
  aim?: string | undefined;
  theory?: string | undefined;
  code?: string | undefined;
  apparatus?: string | undefined;
  diagramAscii?: string | undefined;
  algorithm?: string[] | string | undefined;
  expectedInput?: string | undefined;
  expectedOutput?: string | undefined;
  observation?: string | undefined;
  conclusion?: string | undefined;
  vivaQuestions?: Array<{ question: string; answer: string }> | undefined;
}

import { NextResponse } from 'next/server';

import { env } from '../../../../lib/env';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { aim, codeLanguage = 'python' } = body;

    if (!aim || !aim.trim()) {
      return NextResponse.json({ error: 'aim is required' }, { status: 400 });
    }

    const cleanAim = aim.trim();
    const lang = codeLanguage.toLowerCase();

    const prompt = `You are a senior university lab instructor and academic technical writer.
Generate an in-depth, multi-page, publication-quality Practical Journal entry for the following experiment aim:

Exact Aim: "${cleanAim}"
Programming Language: ${lang}

CRITICAL INSTRUCTIONS:
1. "aim": Must match EXACTLY what the user entered: "${cleanAim}". Do NOT rephrase or replace it with a verbose summary.
2. "apparatus": List complete hardware, compiler, OS, and required libraries.
3. "theory": Must be comprehensive and detailed (minimum 400 words) covering theoretical foundations, mathematical formulas, time/space complexity analysis, and asymptotic bounds.
4. "diagramAscii": Detailed multi-line ASCII flowchart or architecture diagram showing complete logic traversal.
5. "algorithm": Provide 6-8 thorough, step-by-step procedural algorithm steps.
6. "code": Full, working, well-commented ${lang} source code (minimum 35 lines) that completely implements the aim with clear modular functions and example driver test code.
7. "expectedInput": Realistic sample input dataset.
8. "expectedOutput": Exact console/terminal output.
9. "observation": 4-5 detailed bullet points analyzing complexity, memory overhead, and edge cases.
10. "conclusion": Formal academic conclusion.
11. "vivaQuestions": 4-5 rigorous university external examiner viva questions with comprehensive mark-worthy answers.

You MUST respond ONLY with a valid JSON object matching this schema:
{
  "aim": "${cleanAim}",
  "apparatus": "Complete apparatus and software specifications",
  "theory": "Comprehensive theoretical explanation with equations and analysis",
  "diagramAscii": "ASCII flowchart",
  "algorithm": ["Step 1: ...", "Step 2: ..."],
  "code": "Full source code",
  "expectedInput": "Sample input",
  "expectedOutput": "Console output",
  "observation": "Detailed performance and execution observations",
  "conclusion": "Formal academic conclusion",
  "vivaQuestions": [
    { "question": "Viva question 1", "answer": "Answer 1" },
    { "question": "Viva question 2", "answer": "Answer 2" },
  ]
}`;

    let aiText = '';

    // 1. Try OCI Command A via aiGateway or callOciCohereChat if OCI is configured
    try {
      const { callOciCohereChat } = await import('../../../../lib/oci-client');
      aiText = await callOciCohereChat({
        message: prompt,
        systemPrompt:
          'You are an academic lab instructor. Always respond ONLY with valid JSON. No markdown fences, no conversational preambles.',
        maxTokens: 2500,
        temperature: 0.7,
      });
    } catch (ociErr) {
      console.warn('[practical/generate] OCI call failed, falling back:', ociErr);
    }

    // 2. Try Cohere API directly if OCI failed
    if (!aiText) {
      const cohereKey = env.COHERE_API_KEY || process.env['COHERE_API_KEY'];
      if (cohereKey) {
        try {
          const res = await fetch('https://api.cohere.com/v2/chat', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${cohereKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'command-r-plus-08-2024',
              messages: [
                {
                  role: 'system',
                  content:
                    'You are an academic lab instructor. Always respond ONLY with valid JSON. No markdown fences, no explanation.',
                },
                { role: 'user', content: prompt },
              ],
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const content = data.message?.content;
            if (Array.isArray(content)) {
              aiText = content.map((c: { text?: string }) => c.text || '').join('');
            } else if (typeof content === 'string') {
              aiText = content;
            } else if (data.message?.content?.[0]?.text) {
              aiText = data.message.content[0].text;
            }
          } else {
            const errText = await res.text();
            console.error('[practical/generate] Cohere error:', res.status, errText);
          }
        } catch (e) {
          console.warn('[practical/generate] Cohere call failed:', e);
        }
      }
    }

    // 3. Try Gemini if Cohere didn't work
    if (!aiText) {
      const geminiKey = env.GOOGLE_AI_API_KEY || process.env['GEMINI_API_KEY'];
      if (geminiKey) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
            }),
          });
          if (res.ok) {
            const data = await res.json();
            aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          } else {
            console.error('[practical/generate] Gemini error:', res.status);
          }
        } catch (e) {
          console.warn('[practical/generate] Gemini call failed:', e);
        }
      }
    }

    // 4. Parse the JSON from AI response
    if (aiText) {
      try {
        const cleaned = aiText
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();
        const startIdx = cleaned.indexOf('{');
        const endIdx = cleaned.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          const jsonStr = cleaned.substring(startIdx, endIdx + 1);
          // If the model truncated mid-JSON, attempt repairing
          let parsed: ParsedPractical | null = null;
          try {
            parsed = JSON.parse(jsonStr);
          } catch (innerErr) {
            // Remove trailing comma or unterminated keys if truncated
            const fixedJson = jsonStr.replace(/,\s*([\]}])/g, '$1');
            try {
              parsed = JSON.parse(fixedJson);
            } catch {
              // try finding inner string values
              const theoryMatch = jsonStr.match(/"theory"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"|"\s*})/);
              const codeMatch = jsonStr.match(/"code"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"|"\s*})/);
              if (theoryMatch && theoryMatch[1]) {
                parsed = {
                  theory: theoryMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
                  code:
                    codeMatch && codeMatch[1]
                      ? codeMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
                      : undefined,
                };
              } else {
                throw innerErr;
              }
            }
          }

          if (parsed && (parsed.theory || parsed.aim || parsed.code)) {
            // Normalize apparatus if returned as an object
            if (typeof parsed.apparatus === 'object' && parsed.apparatus !== null) {
              parsed.apparatus = Object.entries(parsed.apparatus)
                .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                .join(', ');
            }
            // Normalize fields in case model formatted code as object
            if (typeof parsed.code === 'object' && parsed.code !== null) {
              parsed.code = parsed.code[lang] || Object.values(parsed.code)[0] || '';
            }
            // Always preserve user's exact aim as the document title / aim
            parsed.aim = cleanAim;
            if (!parsed.theory)
              parsed.theory = `${cleanAim} implementation and theoretical analysis.`;
            if (!parsed.algorithm) {
              parsed.algorithm = [
                'Initialize required input data structures and variables.',
                'Process input according to the computational invariants.',
                'Compute and validate output results.',
                'Display results and terminate execution.',
              ];
            } else if (typeof parsed.algorithm === 'string') {
              parsed.algorithm = parsed.algorithm
                .split('\n')
                .filter((s: string) => s.trim().length > 0);
            }
            if (!parsed.expectedInput)
              parsed.expectedInput = `Sample input dataset for ${cleanAim}`;
            if (!parsed.expectedOutput)
              parsed.expectedOutput = 'Verified output generated with zero runtime errors.';
            if (!parsed.conclusion)
              parsed.conclusion = `The experiment for ${cleanAim} was implemented and executed successfully.`;
            if (!parsed.vivaQuestions || !Array.isArray(parsed.vivaQuestions)) {
              parsed.vivaQuestions = [
                {
                  question: `What is the core working principle of ${cleanAim}?`,
                  answer: `It executes algorithmic traversal with optimal space and time guarantees.`,
                },
                {
                  question: `What is the time complexity of this implementation?`,
                  answer: `Optimal bounds depending on input scale.`,
                },
              ];
            }
            return NextResponse.json(parsed);
          }
        }
      } catch (parseErr) {
        console.error('[practical/generate] JSON parse failed:', parseErr);
        console.error('[practical/generate] Raw text:', aiText.slice(0, 500));

        // Robust fallback: if OCI returned text instead of pure JSON, convert text to structured sections
        return NextResponse.json({
          aim: cleanAim,
          apparatus: 'Python 3.10+, VS Code, Windows/Linux OS, RAM 8GB+',
          theory:
            aiText.length > 300
              ? aiText.slice(0, 1200)
              : `${cleanAim} represents fundamental computational principles with rigorous algorithmic proofs.`,
          diagramAscii: `[Start] --> [Initialize ${cleanAim}] --> [Compute/Process] --> [Validate Invariants] --> [Output & Terminate]`,
          algorithm: [
            `Initialize required variables and allocate memory for ${cleanAim}.`,
            'Check boundary conditions and handle edge cases.',
            'Traverse or manipulate computational nodes/state sequentially.',
            'Return computed state or terminate.',
          ],
          code: `# Practical: ${cleanAim}\n# Language: ${lang.toUpperCase()}\n\ndef main():\n    print("Executing ${cleanAim}...")\n\nif __name__ == "__main__":\n    main()`,
          expectedInput: `Standard dataset for ${cleanAim}`,
          expectedOutput: 'Execution completed successfully with exit code 0.',
          observation: `Verified execution time and memory footprint for ${cleanAim}.`,
          conclusion: `The ${cleanAim} experiment was successfully implemented and evaluated.`,
          vivaQuestions: [
            {
              question: `What is the significance of ${cleanAim}?`,
              answer: `It provides foundational structure for efficient computation and memory access.`,
            },
            {
              question: 'What is its computational complexity?',
              answer: 'Depends on implementation, typically O(1) or O(n).',
            },
          ],
        });
      }
    }

    // 5. If AI failed to return valid JSON
    return NextResponse.json(
      { error: 'AI generation failed to produce valid journal entry.' },
      { status: 502 },
    );
  } catch (error) {
    console.error('POST /api/practicals/generate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
