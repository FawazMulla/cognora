import { NextResponse } from "next/server";
import { env } from "../../../../lib/env";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { aim, codeLanguage = "python" } = body;

    if (!aim || !aim.trim()) {
      return NextResponse.json({ error: "aim is required" }, { status: 400 });
    }

    const cleanAim = aim.trim();
    const lang = codeLanguage.toLowerCase();

    const prompt = `You are a senior university lab instructor and academic technical writer.
Generate a COMPLETE, DETAILED, PUBLICATION-QUALITY Practical Journal entry for the following experiment aim:

Aim: "${cleanAim}"
Programming Language: ${lang}

You MUST respond ONLY with a valid JSON object — no markdown, no explanation outside the JSON.

Use this exact schema:
{
  "aim": "Full, formal aim statement (2-3 sentences describing what the experiment achieves)",
  "apparatus": "Complete apparatus list: all software tools, libraries, IDE, OS, hardware specs used",
  "theory": "Minimum 200 words. Explain core concepts, data structures, algorithms, mathematical formulas, and theoretical background. Include relevant equations or pseudocode.",
  "diagramAscii": "A clear multi-line ASCII block diagram or flowchart showing the system pipeline or algorithm flow",
  "algorithm": [
    "Step 1: detailed description of initialization",
    "Step 2: detailed description of data loading or input processing",
    "Step 3: detailed description of core algorithm execution",
    "Step 4: detailed description of output computation or analysis",
    "Step 5: detailed description of result display or validation",
    "Step 6: detailed description of termination and cleanup"
  ],
  "code": "Full, working, well-commented ${lang} code — minimum 30 lines — that correctly implements the aim. Use proper indentation and comments.",
  "expectedInput": "Realistic sample input data that the program would accept",
  "expectedOutput": "The exact terminal/console output when the code is run with the above input",
  "observation": "3-5 bullet points: execution time, memory usage, performance metrics, correctness, edge cases observed",
  "conclusion": "3-4 sentences summarizing what was learned, what was proven, and why this experiment is relevant",
  "vivaQuestions": [
    { "question": "Conceptual viva question about theory", "answer": "Comprehensive, mark-worthy answer" },
    { "question": "Implementation viva question about code choices", "answer": "Comprehensive, mark-worthy answer" },
    { "question": "Comparative or complexity viva question", "answer": "Comprehensive, mark-worthy answer" }
  ]
}`;

    let aiText = '';

    // 1. Try Cohere (key is set in env)
    const cohereKey = env.COHERE_API_KEY || process.env['COHERE_API_KEY'];
    if (cohereKey) {
      try {
        const res = await fetch('https://api.cohere.com/v2/chat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cohereKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'command-r-plus',
            messages: [
              {
                role: 'system',
                content: 'You are an academic lab instructor. Always respond ONLY with valid JSON. No markdown fences, no explanation.'
              },
              { role: 'user', content: prompt }
            ]
          })
        });
        if (res.ok) {
          const data = await res.json();
          const content = data.message?.content;
          if (Array.isArray(content)) {
            aiText = content.map((c: any) => c.text || '').join('');
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

    // 2. Try Gemini if Cohere didn't work
    if (!aiText) {
      const geminiKey = env.GOOGLE_AI_API_KEY || process.env['GEMINI_API_KEY'];
      if (geminiKey) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
            })
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

    // 3. Parse the JSON from AI response
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
          const parsed = JSON.parse(jsonStr);
          if (parsed && parsed.theory) {
            return NextResponse.json(parsed);
          }
        }
      } catch (parseErr) {
        console.error('[practical/generate] JSON parse failed:', parseErr);
        console.error('[practical/generate] Raw text:', aiText.slice(0, 500));
      }
    }

    // 4. No AI key or parse failure — return error so frontend knows
    return NextResponse.json(
      { error: "AI generation unavailable. Please add a GOOGLE_AI_API_KEY or COHERE_API_KEY to the backend .env file." },
      { status: 503 }
    );

  } catch (error) {
    console.error("POST /api/practicals/generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
