import { NextResponse } from 'next/server';

import { aiGateway } from '../../../../lib/ai-gateway';
import { env } from '../../../../lib/env';
import { callOciCohereChat } from '../../../../lib/oci-client';

export const dynamic = 'force-dynamic';

// Curated high-frequency concept clarifications with exact technical keyword preservation
const PRE_MAPPED_HINGLISH: Record<string, string> = {
  'inverted index': `**Inverted Index (Simple Hinglish Samjhauta):**
Inverted index basically ek aisi specialized data structure hai jo search engines aur Information Retrieval Systems mein fast keyword lookup ke liye use hoti hai.

Normal database mein hum document dekhte hain aur uske andar words dhundte hain (*Forward Index*). Lekin Inverted Index mein hum *terms* (words) ko list karte hain, aur har term ke aage un documents ki list hoti hai jahan wo term appear hoti hai — is list ko **Posting List** kehte hain.

**Real-world Example:**
Jaise kisi textbook ke end mein ek *Subject Index* hota hai — aap 'Binary Search' dekhte ho aur seedha page 45, 82 pe chale jaate ho, poori book page-by-page nahi padhte. Bilkul wahi kaam Inverted Index search engine mein karta hai!`,

  'activation function': `**Activation Function (Simple Hinglish Samjhauta):**
Neural Network mein Activation Function ek mathematical gatekeeper ki tarah kaam karta hai jo decide karta hai ki ek particular neuron fire (activate) hoga ya nahi.

**Kyun zaroori hai?**
Agar activation function nahi lagayenge, toh chahe aap 100 layers ka deep neural network bana lo, wo mathematically ek single linear equation ban kar reh jaayega ($y = Wx + b$). Real world data complex aur non-linear hota hai (images, audio, language). Activation function network ke andar **Non-Linearity** introduce karta hai taaki model complex patterns learn kar sake.

Popular functions:
- **ReLU (Rectified Linear Unit):** Negative values ko 0 kar deta hai aur positive ko as-it-is pass karta hai ($f(x) = \\max(0, x)$). Computationally super fast hai!
- **Sigmoid:** Output ko 0 aur 1 ke beech squash karta hai, jo probability calculation ke liye perfect hai.`,

  'vector space model': `**Vector Space Model (Simple Hinglish Samjhauta):**
Vector Space Model (VSM) Information Retrieval ka ek algebraic model hai jahan hum textual documents aur user search queries dono ko multidimensional vectors ke form mein represent karte hain.

**Kaise kaam karta hai?**
1. Har unique word (term) ek dimension (axis) represent karta hai.
2. Har dimension ki value word ki **TF-IDF weight** hoti hai (jo bataati hai ki word document ke liye kitna important hai).
3. Jab user search query daalta hai, hum query vector aur document vector ke beech ka angle check karte hain using **Cosine Similarity**.
4. Jitna chhota angle ($\theta$) hoga, utna high cosine value ($cos \\theta \\approx 1$) hoga, matlab document query se utna zyada relevant hai!`,

  'confusion matrix': `**Confusion Matrix (Simple Hinglish Samjhauta):**
Confusion matrix machine learning classification models ki performance evaluate karne ka ek tabular summary chart hai. Yeh clearly dikhata hai ki model kahan sahi predictions kar raha hai aur kahan 'confuse' ho raha hai.

Iske 4 main pillars hote hain:
- **True Positive (TP):** Bimari thi aur model ne bhi kaha 'Haan bimari hai'. (Correct)
- **True Negative (TN):** Bimari nahi thi aur model ne bhi kaha 'Bimari nahi hai'. (Correct)
- **False Positive (FP - Type I Error):** Bimari nahi thi, lekin model ne galti se alarm baja diya 'Bimari hai'.
- **False Negative (FN - Type II Error):** Bimari thi, lekin model ne miss kar diya aur kaha 'Sab normal hai'. (Medical domain mein yeh sabse dangerous error hota hai!)`,

  'boundary value analysis': `**Boundary Value Analysis - BVA (Simple Hinglish Samjhauta):**
Software Testing mein dekha gaya hai ki maximum software bugs input range ke *boundaries* (edges) par aate hain, center mein nahi. BVA isi principle par based ek Black-Box test technique hai.

**Example se samjhein:**
Agar ek age input field allow karti hai 18 se 60 years:
BVA ke tests hamesha boundary ke aas-pass honge:
- Minimum boundary: $18$ (Boundary), $17$ (Just below - Invalid), $19$ (Just above - Valid)
- Maximum boundary: $60$ (Boundary), $59$ (Just below - Valid), $61$ (Just above - Invalid)
Center values (jaise 35) ko test karne se pehle boundaries verify karna software failure prevent karta hai.`,

  'basis path testing': `**Basis Path Testing (Simple Hinglish Samjhauta):**
Basis path testing ek White-Box testing methodology hai jo program ke source code ki control flow graph (CFG) banakar har possible execution path ko test karne ki guarantee deti hai.

**McCabe's Cyclomatic Complexity $V(G)$ ka role:**
Yeh calculate karta hai ki code mein kitne independent linearly path exist karte hain ($V(G) = E - N + 2P$).
Agar $V(G) = 4$ aaya, iska matlab tester ko minimum 4 test cases design karne padenge taaki code ka har ek statement aur branch kam se kam ek baar zaroor execute ho sake.`,
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      topic?: string;
      englishContent: string;
      mode?: 'hinglish' | 'english';
    };

    const { topic = '', englishContent = '', mode = 'hinglish' } = body;

    if (!englishContent.trim() && !topic.trim()) {
      return NextResponse.json(
        { error: 'englishContent or topic is required' },
        { status: 400 },
      );
    }

    if (mode === 'english') {
      return NextResponse.json({
        clarification: englishContent,
        mode: 'english',
        source: 'direct_passthrough',
      });
    }

    // Check pre-mapped cache for high frequency topics
    const cleanTopic = topic.toLowerCase().trim();
    for (const [key, value] of Object.entries(PRE_MAPPED_HINGLISH)) {
      if (cleanTopic.includes(key) || englishContent.toLowerCase().includes(key)) {
        return NextResponse.json({
          clarification: value,
          mode: 'hinglish',
          source: 'pre_mapped_cache',
          originalContent: englishContent,
        });
      }
    }

    // Dynamic synthesis via OCI Cohere or AI Gateway
    const prompt = `You are an expert bilingual university engineering professor teaching in India.
Explain the following technical concept in clear, natural, student-friendly Roman-script Hinglish (Hindi written using English alphabet).

STRICT RULES:
1. ALL technical terms, formulas, algorithm names, variables, and code MUST REMAIN IN ENGLISH (e.g. "Binary Search", "Time Complexity", "Inverted Index", "Matrix", "Pointer").
2. Write in conversational, warm Hinglish (like talking to a student: "Dekho, asaan shabdon mein...", "Iska main logic yeh hai ki...", "Real-world mein...").
3. DO NOT use Devanagari script.
4. Keep the explanation punchy, accurate, and structured with bullet points.

TOPIC: ${topic || 'Academic Concept'}
ORIGINAL ACADEMIC TEXT:
${englishContent.slice(0, 1500)}

Provide the Hinglish concept clarification now:`;

    // Try OCI first
    if (env.OCI_ENABLED && env.OCI_COMPARTMENT_ID) {
      try {
        const ociResult = await callOciCohereChat({
          message: prompt,
          temperature: 0.5,
          maxTokens: 800,
        });
        if (ociResult) {
          return NextResponse.json({
            clarification: ociResult,
            mode: 'hinglish',
            source: 'oci_genai_live',
            originalContent: englishContent,
          });
        }
      } catch (ociErr) {
        console.warn('[clarify] OCI call failed, falling back to gateway:', ociErr);
      }
    }

    // Fallback to AI Gateway
    const gatewayRes = await aiGateway.invoke('summary_gen', {
      text: prompt,
    });

    return NextResponse.json({
      clarification: gatewayRes.content || englishContent,
      mode: 'hinglish',
      source: 'gateway_synthesis',
      originalContent: englishContent,
    });
  } catch (error) {
    console.error('[clarify] Error:', error);
    return NextResponse.json(
      { error: 'Failed to synthesize concept clarification' },
      { status: 500 },
    );
  }
}

