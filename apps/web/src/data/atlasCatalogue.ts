// Authoritative Mumbai University Visual Learning Atlas Catalogue
// Sources: Mumbai University Syllabus Documents (ITC701, ILO7016, ITC702, ITD07014, ITD07024)
// and semester_learning_video_catalog.json (58 verified lectures)

export type TopicStatus = 'NOT_STARTED' | 'LEARNING' | 'PRACTICED' | 'MASTERED' | 'REVISION_REQUIRED';

export type VisualizerType = 
  | 'bayesian-network' 
  | 'fuzzy-mamdani' 
  | 'inverted-index' 
  | 'stlc-lifecycle' 
  | 'mqtt-flow' 
  | 'cyber-killchain'
  | 'boundary-value'
  | 'none';

export interface VideoResource {
  title: string;
  channel: string;
  topic: string;
  url: string;
  youtubeId: string;
  embedUrl: string;
  duration?: string;
  language?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface PYQQuestion {
  id: string;
  exam: string;
  marks: number;
  question: string;
  recurrence: string;
  blueprintAdvice: string;
}

export interface Topic {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  objectives: string[];
  estimatedDuration: string;
  difficulty: 'Foundational' | 'Intermediate' | 'Advanced';
  examWeightage: 'Critical (10M)' | 'High (5M-10M)' | 'Standard (5M)';
  prerequisites: string[]; // Topic IDs or names
  coMapping: string;
  visualizerType: VisualizerType;
  videos: VideoResource[];
  keyPoints: string[];
  hinglishSummary: string;
  textbookRef: string;
  pyqs: PYQQuestion[];
  quiz: QuizQuestion[];
}

export interface Module {
  id: string;
  moduleNumber: number;
  title: string;
  lectureHours: number;
  coMapping: string;
  description: string;
  topics: Topic[];
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  shortName: string;
  semester: string;
  university: string;
  scheme: string;
  description: string;
  totalLectureHours: number;
  prerequisites: string[];
  courseOutcomes: { code: string; outcome: string; bloomsLevel: string }[];
  textbooks: string[];
  references: string[];
  syllabusPdfUrl: string;
  accentColor: string;
  gradient: string;
  modules: Module[];
}

export const ATLAS_SUBJECTS: Subject[] = [
  // 1. AI and DS - II (ITC701)
  {
    id: "itc701",
    code: "ITC701",
    name: "AI and DS – II",
    shortName: "AI & DS-II",
    semester: "Semester VII",
    university: "University of Mumbai",
    scheme: "Choice Based Credit System (CBCS)",
    description: "Advanced artificial intelligence and data science focusing on uncertainty modeling, cognitive architectures, fuzzy inference controllers, deep learning pipelines, and ensemble classification.",
    totalLectureHours: 39,
    prerequisites: ["AI and DS - I (ITC604)", "Data Mining & Business Intelligence (ITC601)", "Intelligent Agents & Search Algorithms"],
    syllabusPdfUrl: "/syllabi/AIDS-II_Syllabus.pdf",
    accentColor: "#6366f1",
    gradient: "from-indigo-600 to-violet-600",
    courseOutcomes: [
      { code: "CO1", outcome: "Design models for reasoning with uncertainty as well as the use of unreliable information.", bloomsLevel: "L1, L2, L3" },
      { code: "CO2", outcome: "Analyze the process of building a Cognitive application.", bloomsLevel: "L1, L2, L3, L4" },
      { code: "CO3", outcome: "Design fuzzy controller system.", bloomsLevel: "L1, L2, L3" },
      { code: "CO4", outcome: "Apply learning concepts to develop real life deep learning applications.", bloomsLevel: "L1, L2, L3" },
      { code: "CO5", outcome: "Evaluate performance of learning algorithms.", bloomsLevel: "L1, L2, L3, L4, L5" },
      { code: "CO6", outcome: "Analyze current trends and multimodal data science applications.", bloomsLevel: "L1, L2, L3, L4" },
    ],
    textbooks: [
      "Stuart Russell and Peter Norvig, 'Artificial Intelligence: A Modern Approach', 3rd Ed., Pearson.",
      "Judith S. Hurwitz, Marcia Kaufman, Adrian Bowles, 'Cognitive Computing and Big Data Analytics', Wiley.",
      "S.N. Sivanandam, S.N. Deepa, 'Principles of Soft Computing', Wiley.",
      "François Chollet, 'Deep Learning with Python', Manning Publications."
    ],
    references: [
      "Deepak Khemani, 'A First Course in Artificial Intelligence', McGraw Hill.",
      "Ethem Alpaydin, 'Introduction to Machine Learning', PHI Learning.",
      "Jon Krohn, Grant Beyleveld, Aglae Bassens, 'Deep Learning Illustrated', Pearson."
    ],
    modules: [
      {
        id: "itc701-m1",
        moduleNumber: 1,
        title: "Uncertainty",
        lectureHours: 4,
        coMapping: "CO1",
        description: "Uncertainty in AI, inference using full joint distributions, Bayes theorem, Bayesian networks semantics, Markov Decision Processes, and probabilistic graphical models.",
        topics: [
          {
            id: "itc701-t1",
            title: "Bayesian Networks & Probabilistic Inference",
            shortTitle: "Bayesian Networks",
            description: "Master Directed Acyclic Graph (DAG) representations of joint probability distributions, conditional independence properties (d-separation), and exact inference using enumeration.",
            objectives: [
              "Formulate joint probability distributions using conditional probability tables (CPTs).",
              "Understand d-separation criteria in Bayesian Networks.",
              "Calculate marginal and conditional probabilities given partial evidence."
            ],
            estimatedDuration: "45 mins",
            difficulty: "Intermediate",
            examWeightage: "Critical (10M)",
            prerequisites: ["Conditional Probability", "Intelligent Agents"],
            coMapping: "CO1",
            visualizerType: "bayesian-network",
            videos: [
              {
                title: "AI Course | Lecture 6: Uncertainty: Bayesian Networks & Markov Models for AI",
                channel: "PMRF, IISc Bangalore",
                topic: "Module I – Uncertainty; Bayesian networks and Markov models",
                url: "https://www.youtube.com/watch?v=HQUqifo556Q",
                youtubeId: "HQUqifo556Q",
                embedUrl: "https://www.youtube.com/embed/HQUqifo556Q",
                duration: "52 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "Bayesian Networks represent joint distribution P(X1,...,Xn) = ∏ P(Xi | Parents(Xi)).",
              "A node is conditionally independent of its non-descendants given its parents.",
              "Inference by enumeration sums over all hidden variables, which is exponential O(2^n) in the worst case but polynomial in polytrees.",
              "Markov Blanket consists of parents, children, and spouses (other parents of children)."
            ],
            hinglishSummary: "Bayesian Network ek Directed Graph hota hai jisme nodes random variables ko represent karte hain aur directed edges direct probabilistic dependencies dikhate hain. Parents ke diye hone par node apne baaki non-descendants se independent ho jata hai.",
            textbookRef: "Russell & Norvig, Chapter 13 & 14 (Probabilistic Reasoning)",
            pyqs: [
              {
                id: "pyq-itc701-1",
                exam: "MU Sem VII Dec 2023",
                marks: 10,
                question: "Explain the semantics of Bayesian Networks with an example of Alarm domain. Show how conditional independence simplifies the joint probability computation.",
                recurrence: "Repeated 4x in Sem VII Papers",
                blueprintAdvice: "Draw the 5-node Burglary-Earthquake-Alarm-JohnCalls-MaryCalls network, write out the CPT for Alarm, and contrast the 10 parameters needed vs 31 parameters for the full joint distribution."
              }
            ],
            quiz: [
              {
                id: "q-itc701-1",
                question: "In a Bayesian Network with N Boolean variables where each node has at most k parents, what is the maximum total number of parameters required in the CPTs?",
                options: ["O(2^N)", "O(N * 2^k)", "O(N^k)", "O(k * 2^N)"],
                correctAnswer: 1,
                explanation: "Each node with k parents has a CPT of size 2^k. For N nodes, the total parameters is at most N * 2^k, which is linear in N when k is bounded."
              },
              {
                id: "q-itc701-2",
                question: "What constitutes the Markov Blanket of a variable X in a Bayesian Network?",
                options: [
                  "Only the direct parents of X",
                  "Parents, children, and children's other parents (spouses)",
                  "All ancestor nodes of X",
                  "Direct parents and direct children only"
                ],
                correctAnswer: 1,
                explanation: "Conditioned on its Markov Blanket (parents, children, and spouses), variable X is completely independent of all other nodes in the network."
              }
            ]
          },
          {
            id: "itc701-t2",
            title: "Gaussian Mixture Models & Markov Decision Processes",
            shortTitle: "GMM & MDP",
            description: "Explore probabilistic clustering via Gaussian Mixture Models (GMM) with Expectation-Maximization (EM), and sequential decision making under uncertainty via MDPs.",
            objectives: [
              "Derive the E-step and M-step for Gaussian Mixture Models.",
              "Formulate Bellman Equations for value iteration and policy iteration in MDPs.",
              "Compare GMM soft-clustering against deterministic K-Means clustering."
            ],
            estimatedDuration: "50 mins",
            difficulty: "Advanced",
            examWeightage: "High (5M-10M)",
            prerequisites: ["Bayesian Networks", "Linear Algebra"],
            coMapping: "CO1",
            visualizerType: "none",
            videos: [
              {
                title: "W12_L3: Gaussian Mixture Models & Expectation Maximization",
                channel: "IIT Madras BS Degree Programme",
                topic: "Module I – Uncertainty; Gaussian mixture models",
                url: "https://www.youtube.com/watch?v=6Zk77RKcI2Q",
                youtubeId: "6Zk77RKcI2Q",
                embedUrl: "https://www.youtube.com/embed/6Zk77RKcI2Q",
                duration: "38 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "GMM models data as a mixture of K Gaussian distributions with mixing coefficients π_k, means μ_k, and covariances Σ_k.",
              "EM Algorithm iteratively updates responsibilities γ(z_nk) in the E-step and parameters in the M-step.",
              "MDP is defined by 5-tuple (S, A, P, R, γ). Bellman Optimality Equation: V*(s) = max_a ∑ P(s'|s,a)[R(s,a,s') + γ V*(s')]."
            ],
            hinglishSummary: "GMM data points ko multiple bell curves (Gaussians) ka combination maanta hai. K-means jaisa hard cluster karne ke bajaye, EM algorithm se har point ko har cluster ki probability (soft assignment) deta hai.",
            textbookRef: "Russell & Norvig, Chapter 17 (Making Complex Decisions)",
            pyqs: [
              {
                id: "pyq-itc701-2",
                exam: "MU Sem VII May 2023",
                marks: 10,
                question: "Define Markov Decision Process. Explain Value Iteration algorithm with mathematical formulation and convergence criteria.",
                recurrence: "Repeated 3x in Sem VII Papers",
                blueprintAdvice: "Write the 5-tuple (S, A, P, R, γ), state the Bellman update rule V_{k+1}(s), explain discount factor γ < 1 ensures contraction mapping, and provide an illustrative grid-world example."
              }
            ],
            quiz: [
              {
                id: "q-itc701-3",
                question: "In Gaussian Mixture Models, the E-step calculates which of the following?",
                options: [
                  "New cluster centroids μ_k",
                  "Posterior probability (responsibility) that Gaussian k generated sample x_n",
                  "Inverted covariance matrix",
                  "Log-likelihood gradient"
                ],
                correctAnswer: 1,
                explanation: "The Expectation (E) step computes responsibilities γ(z_nk) = P(z_k=1 | x_n) using the current parameter estimates."
              }
            ]
          }
        ]
      },
      {
        id: "itc701-m2",
        moduleNumber: 2,
        title: "Cognitive Computing",
        lectureHours: 6,
        coMapping: "CO2",
        description: "Foundations of cognitive computing, design principles, natural language understanding in cognitive agents, taxonomies, ontologies, and enterprise case study: IBM Watson.",
        topics: [
          {
            id: "itc701-t3",
            title: "Cognitive Computing Architectures & IBM Watson",
            shortTitle: "IBM Watson & Cognitive Arch",
            description: "Understand the shift from programmable systems to cognitive systems that learn at scale, reason with purpose, and interact naturally with humans.",
            objectives: [
              "Identify the 4 core pillars of Cognitive Computing (Adaptive, Interactive, Iterative, Contextual).",
              "Examine IBM Watson DeepQA architecture: question analysis, hypothesis generation, evidence scoring, and confidence synthesis.",
              "Construct domain taxonomies and ontologies using RDF and OWL."
            ],
            estimatedDuration: "40 mins",
            difficulty: "Intermediate",
            examWeightage: "Critical (10M)",
            prerequisites: ["NLP Foundations", "Knowledge Representation"],
            coMapping: "CO2",
            visualizerType: "none",
            videos: [
              {
                title: "Tutorial on IBM Watson – A Cognitive Computing System",
                channel: "HackerEarth",
                topic: "Module II – Cognitive computing; IBM Watson",
                url: "https://www.youtube.com/watch?v=bg8YodBhFt4",
                youtubeId: "bg8YodBhFt4",
                embedUrl: "https://www.youtube.com/embed/bg8YodBhFt4",
                duration: "45 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "Cognitive systems handle unstructured big data (80% of enterprise information).",
              "DeepQA pipeline executes parallel hypothesis generation across millions of candidate answers.",
              "Evidence retrieval computes scores across lexical, syntactic, geospatial, and temporal dimensions.",
              "Ontology defines formal naming and definition of entities, types, and relations in a specific domain."
            ],
            hinglishSummary: "Cognitive Computing standard IF-ELSE programming se alag hai; ye insaan ki tarah natural language padh sakta hai, alag-alag hypotheses generate karta hai aur sabse high-confidence answer synthesize karta hai jaise IBM Watson ne Jeopardy jeeta tha.",
            textbookRef: "Judith S. Hurwitz, Cognitive Computing and Big Data Analytics, Chapters 1-4",
            pyqs: [
              {
                id: "pyq-itc701-3",
                exam: "MU Sem VII Dec 2022",
                marks: 10,
                question: "Explain the architecture and working of IBM Watson DeepQA pipeline with a neat block diagram.",
                recurrence: "Repeated 5x in University Exams",
                blueprintAdvice: "Draw the DeepQA pipeline: Question Parsing -> Question Classification -> Candidate Answer Generation -> Soft Filtering -> Hypothesis & Evidence Scoring -> Final Confidence Merging."
              }
            ],
            quiz: [
              {
                id: "q-itc701-4",
                question: "Which of the following is NOT one of the 4 design pillars defined by the Cognitive Computing Consortium?",
                options: ["Adaptive", "Interactive", "Contextual", "Deterministic"],
                correctAnswer: 3,
                explanation: "Cognitive systems are probabilistic and non-deterministic, not deterministic."
              }
            ]
          }
        ]
      },
      {
        id: "itc701-m3",
        moduleNumber: 3,
        title: "Fuzzy Logic & Applications",
        lectureHours: 7,
        coMapping: "CO3",
        description: "Fuzzy sets, membership functions, alpha-cuts, fuzzy relations, Max-Min and Max-Product composition, defuzzification methods, and Mamdani fuzzy controller design.",
        topics: [
          {
            id: "itc701-t4",
            title: "Fuzzy Sets, Membership Functions & Defuzzification",
            shortTitle: "Fuzzy Sets & Defuzzification",
            description: "Understand continuous degree of truth [0,1], triangular/trapezoidal/Gaussian membership functions, and defuzzification techniques including Centroid, Bisector, and MOM.",
            objectives: [
              "Differentiate crisp sets (characteristic function {0,1}) from fuzzy sets (membership function μ(x) ∈ [0,1]).",
              "Compute fuzzy set operations: Union (Max), Intersection (Min), and Complement (1 - μ).",
              "Apply Centroid Method (Center of Gravity) to calculate crisp outputs from aggregated fuzzy sets."
            ],
            estimatedDuration: "50 mins",
            difficulty: "Foundational",
            examWeightage: "High (5M-10M)",
            prerequisites: ["Set Theory", "Calculus"],
            coMapping: "CO3",
            visualizerType: "fuzzy-mamdani",
            videos: [
              {
                title: "Lec 53: Fuzzy Sets and Systems",
                channel: "NPTEL / IISc Bengaluru",
                topic: "Module III – Fuzzy sets and their properties",
                url: "https://www.youtube.com/watch?v=qH0YeoUxbqc",
                youtubeId: "qH0YeoUxbqc",
                embedUrl: "https://www.youtube.com/embed/qH0YeoUxbqc",
                duration: "48 mins",
                language: "English"
              },
              {
                title: "Lec 54: Fuzzification and Defuzzification Methods",
                channel: "NPTEL / IISc Bengaluru",
                topic: "Module III – Fuzzification and defuzzification",
                url: "https://www.youtube.com/watch?v=DlLV45GZ3KE",
                youtubeId: "DlLV45GZ3KE",
                embedUrl: "https://www.youtube.com/embed/DlLV45GZ3KE",
                duration: "42 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "Fuzzy membership assigns values between 0 and 1 representing partial membership.",
              "Centroid Defuzzification formula: z* = (∫ z · μ(z) dz) / (∫ μ(z) dz). For discrete sets: (∑ z · μ(z)) / (∑ μ(z)).",
              "Height method and Center of Largest Area are computationally lighter alternatives.",
              "Alpha-cut A_α = {x ∈ X | μ_A(x) ≥ α} produces crisp subsets."
            ],
            hinglishSummary: "Crisp set me ek element ya toh set ka part hota hai (1) ya nahi (0). Fuzzy logic me partial membership hoti hai jaise 'Speed is Medium' (0.7 true). Fuzzified rules ke baad Centroid method se ek single crisp value (e.g. 45 km/h) nikalte hain.",
            textbookRef: "S.N. Sivanandam, Principles of Soft Computing, Chapters 2 & 3",
            pyqs: [
              {
                id: "pyq-itc701-4",
                exam: "MU Sem VII May 2023",
                marks: 10,
                question: "Design a Mamdani Fuzzy Inference System for a Domestic Washing Machine controller. Define inputs (Dirtiness, Type of Fabric), output (Wash Time), linguistic variables, rule base, and show defuzzification using Centroid method.",
                recurrence: "Repeated 4x in Sem VII Papers",
                blueprintAdvice: "Define triangular membership functions for Dirt (Low, Med, High), Fabric (Delicate, Normal, Heavy), formulate at least 9 IF-THEN rules, show Min-Max aggregation for sample inputs, and compute Center of Gravity."
              }
            ],
            quiz: [
              {
                id: "q-itc701-5",
                question: "In fuzzy set theory, if A and B have membership values μ_A(x) = 0.8 and μ_B(x) = 0.4, what is the membership of x in the Intersection (A ∩ B) under standard Zadeh operators?",
                options: ["0.8", "0.4", "0.32", "0.6"],
                correctAnswer: 1,
                explanation: "Under standard Zadeh logic, the intersection operator is the MIN function: min(0.8, 0.4) = 0.4."
              }
            ]
          }
        ]
      },
      {
        id: "itc701-m4",
        moduleNumber: 4,
        title: "Introduction to Deep Learning",
        lectureHours: 8,
        coMapping: "CO4",
        description: "Foundations of neural networks, backpropagation, CNN architectures (LeNet, AlexNet, VGG), recurrent models (RNN, LSTM), and autoencoder variants.",
        topics: [
          {
            id: "itc701-t5",
            title: "CNN Architectures & Computer Vision",
            shortTitle: "Convolutional Neural Networks",
            description: "Master 2D convolution operations, kernel filters, pooling (Max, Average), feature maps, parameter sharing, and classical architectures.",
            objectives: [
              "Calculate output dimensions of conv layers: O = ⌊(W - K + 2P)/S⌋ + 1.",
              "Explain translation invariance achieved by pooling operations.",
              "Compare parameter efficiency of CNNs against Fully Connected Multi-Layer Perceptrons."
            ],
            estimatedDuration: "55 mins",
            difficulty: "Intermediate",
            examWeightage: "Critical (10M)",
            prerequisites: ["Linear Algebra", "ANN Backpropagation"],
            coMapping: "CO4",
            visualizerType: "none",
            videos: [
              {
                title: "Introduction to Deep Learning",
                channel: "NPTEL-NOC / IIT Madras",
                topic: "Module IV – Deep learning foundations and neural networks",
                url: "https://www.youtube.com/watch?v=-E1tiQbP_Kw",
                youtubeId: "-E1tiQbP_Kw",
                embedUrl: "https://www.youtube.com/embed/-E1tiQbP_Kw",
                duration: "50 mins",
                language: "English"
              },
              {
                title: "Lec 14: Convolutional Neural Network – I",
                channel: "NPTEL / IIT Guwahati",
                topic: "Module IV – CNN introduction and architecture",
                url: "https://www.youtube.com/watch?v=Pu2LaEH8oi8",
                youtubeId: "Pu2LaEH8oi8",
                embedUrl: "https://www.youtube.com/embed/Pu2LaEH8oi8",
                duration: "45 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "Convolution captures local spatial correlations through learnable kernels (filters).",
              "Parameter sharing means the same filter weights slide across the entire image tensor.",
              "Feature hierarchy: low layers capture edges and gradients, middle layers textures and shapes, high layers complete semantic objects."
            ],
            hinglishSummary: "CNN me har pixel ko fully-connected layer se jodane ke bajaye small sliding filters (kernels) use hote hain. Isse parameters dramatically kam ho jate hain aur spatial patterns (jaise horizontal edges, eyes, wheels) asani se detect hote hain.",
            textbookRef: "François Chollet, Deep Learning with Python, Chapter 5",
            pyqs: [
              {
                id: "pyq-itc701-5",
                exam: "MU Sem VII Dec 2023",
                marks: 10,
                question: "Explain the architecture of CNN with various layers: Convolution, Activation (ReLU), Pooling, and Fully Connected layers. Calculate output volume for an input of size 32x32x3 with 10 filters of size 5x5, stride 1, and padding 2.",
                recurrence: "Repeated 6x in University Exams",
                blueprintAdvice: "Apply O = (32 - 5 + 2*2)/1 + 1 = 32. Output volume is 32x32x10. Explain parameter sharing and spatial downsampling."
              }
            ],
            quiz: [
              {
                id: "q-itc701-6",
                question: "Given an input image of dimensions 28x28 with 1 channel, a 5x5 convolution filter with stride 1 and padding 0 will produce a feature map of what dimension?",
                options: ["24x24", "28x28", "23x23", "20x20"],
                correctAnswer: 0,
                explanation: "O = (28 - 5 + 2*0)/1 + 1 = 23 + 1 = 24. Hence the output is 24x24."
              }
            ]
          },
          {
            id: "itc701-t6",
            title: "Recurrent Neural Networks & Long Short-Term Memory (LSTM)",
            shortTitle: "RNN & LSTM Networks",
            description: "Understand sequential modeling, vanishing/exploding gradients in vanilla RNNs, and the LSTM gating mechanism (Forget, Input, Output gates).",
            objectives: [
              "Trace hidden state transitions in unrolled Recurrent Neural Networks.",
              "Formulate equations for LSTM Forget gate f_t, Input gate i_t, Candidate state c̃_t, and Output gate o_t.",
              "Explain how the constant error carousel (cell state C_t) eliminates the vanishing gradient problem."
            ],
            estimatedDuration: "50 mins",
            difficulty: "Advanced",
            examWeightage: "Critical (10M)",
            prerequisites: ["CNN Foundations", "Backpropagation through time (BPTT)"],
            coMapping: "CO4",
            visualizerType: "none",
            videos: [
              {
                title: "Lec 48: RNN & LSTMs",
                channel: "NPTEL / IISc Bengaluru",
                topic: "Module IV – Recurrent neural networks and LSTM",
                url: "https://www.youtube.com/watch?v=KBRPd5zaeII",
                youtubeId: "KBRPd5zaeII",
                embedUrl: "https://www.youtube.com/embed/KBRPd5zaeII",
                duration: "54 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "Vanilla RNN uses h_t = tanh(W_hh · h_{t-1} + W_xh · x_t + b_h).",
              "BPTT suffers from vanishing gradients when multiplying long chains of weight matrices |W| < 1.",
              "LSTM introduces a linear cell state highway C_t = f_t * C_{t-1} + i_t * c̃_t, allowing gradients to flow back with minimal attenuation.",
              "Forget gate f_t = σ(W_f · [h_{t-1}, x_t] + b_f) decides what information to discard."
            ],
            hinglishSummary: "Standard RNN lambe sentences me pehle ke words bhool jata hai (vanishing gradient). LSTM me 3 gates hote hain: Forget Gate (kya bhoolna hai), Input Gate (kya naya save karna hai), aur Output Gate (agla hidden state kya hoga). Cell state ek highway ki tarah information ko unmodified aage pass karta hai.",
            textbookRef: "François Chollet, Deep Learning with Python, Chapter 6",
            pyqs: [
              {
                id: "pyq-itc701-6",
                exam: "MU Sem VII May 2023",
                marks: 10,
                question: "Explain the vanishing gradient problem in standard RNNs. How does the LSTM architecture solve this problem? Illustrate with internal gate equations and block diagram.",
                recurrence: "Repeated 5x in University Exams",
                blueprintAdvice: "Draw the LSTM cell showing Forget Gate (f_t), Input Gate (i_t), Candidate state (c̃_t), Cell State update (C_t), and Output Gate (o_t). Show the linear gradient path along C_t."
              }
            ],
            quiz: [
              {
                id: "q-itc701-7",
                question: "Which gate in an LSTM cell is responsible for deciding how much of the previous cell state C_{t-1} should be preserved?",
                options: ["Input gate", "Forget gate", "Output gate", "Reset gate"],
                correctAnswer: 1,
                explanation: "The Forget gate f_t outputs numbers between 0 and 1 via sigmoid; 0 means completely discard, 1 means completely keep."
              }
            ]
          }
        ]
      },
      {
        id: "itc701-m5",
        moduleNumber: 5,
        title: "Advanced ML Classification Techniques",
        lectureHours: 6,
        coMapping: "CO5",
        description: "Ensemble learning paradigms, Bagging, Boosting (AdaBoost, Gradient Boosting), Random Forests, handling class-imbalanced data, and classifier evaluation via ROC-AUC.",
        topics: [
          {
            id: "itc701-t7",
            title: "Ensemble Learning: Bagging, Boosting & Random Forests",
            shortTitle: "Ensemble Classifiers & ROC",
            description: "Explore variance reduction through Bootstrap Aggregation (Bagging), bias reduction through sequential Boosting, feature randomization in Random Forests, and ROC curves.",
            objectives: [
              "Compare Bagging (parallel base learners) vs Boosting (sequential error-weighted learners).",
              "Explain Random Forests out-of-bag (OOB) error estimation and feature subsampling.",
              "Plot and interpret Receiver Operating Characteristic (ROC) curve: True Positive Rate vs False Positive Rate."
            ],
            estimatedDuration: "45 mins",
            difficulty: "Intermediate",
            examWeightage: "Critical (10M)",
            prerequisites: ["Decision Trees", "Hypothesis Testing"],
            coMapping: "CO5",
            visualizerType: "none",
            videos: [
              {
                title: "Ensemble Learning",
                channel: "NPTEL-NOC / IIT Madras",
                topic: "Module V – Ensemble classifiers",
                url: "https://www.youtube.com/watch?v=l-TTMwqzNMQ",
                youtubeId: "l-TTMwqzNMQ",
                embedUrl: "https://www.youtube.com/embed/l-TTMwqzNMQ",
                duration: "40 mins",
                language: "English"
              },
              {
                title: "Tutorial: Random Forests",
                channel: "NPTEL-NOC / IIT Madras",
                topic: "Module V – Random forests and classification",
                url: "https://www.youtube.com/watch?v=cs8NPsRDx4w",
                youtubeId: "cs8NPsRDx4w",
                embedUrl: "https://www.youtube.com/embed/cs8NPsRDx4w",
                duration: "35 mins",
                language: "English"
              },
              {
                title: "ROC Curve and ROC-AUC Explained",
                channel: "CampusX",
                topic: "Module V – Classifier evaluation and ROC curves",
                url: "https://www.youtube.com/watch?v=gdW6hj9IXaA",
                youtubeId: "gdW6hj9IXaA",
                embedUrl: "https://www.youtube.com/embed/gdW6hj9IXaA",
                duration: "32 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "Bagging reduces variance by training multiple high-variance models (e.g. deep decision trees) on bootstrap samples.",
              "Boosting trains weak learners sequentially; each round increases weights on misclassified instances.",
              "Random Forest adds random feature subset selection m = √p at every split, decorrelating the trees.",
              "ROC curve plots TPR (Sensitivity) against FPR (1 - Specificity) across all discrimination thresholds; AUC = 1.0 represents a perfect classifier."
            ],
            hinglishSummary: "Bagging (jaise Random Forest) alag alag trees ko parallel train karta hai aur unka average nikaal kar variance ghatata hai. Boosting sequential hota hai—jo sample pehle model se galat classify hua, uspar agle model ka focus zyada hota hai taaki bias kam ho sake.",
            textbookRef: "Ethem Alpaydin, Introduction to Machine Learning, Chapter 17",
            pyqs: [
              {
                id: "pyq-itc701-7",
                exam: "MU Sem VII Dec 2023",
                marks: 10,
                question: "Compare Bagging and Boosting ensemble techniques. Explain AdaBoost algorithm step-by-step with mathematical formulation.",
                recurrence: "Repeated 4x in Sem VII Papers",
                blueprintAdvice: "Create a side-by-side table comparing Base learners, Parallelism, Weight adjustments, and Goal (Variance vs Bias reduction). Then write AdaBoost weight update rule w_i * exp(α_t * y_i * h_t(x_i))."
              }
            ],
            quiz: [
              {
                id: "q-itc701-8",
                question: "In Random Forest classification with p total features, what is the standard recommended number of features considered at each split?",
                options: ["p / 2", "√p", "log2(p)", "p - 1"],
                correctAnswer: 1,
                explanation: "The standard default for classification in Random Forests is √p random features per split, which maximizes tree diversity."
              }
            ]
          }
        ]
      },
      {
        id: "itc701-m6",
        moduleNumber: 6,
        title: "Trends and Applications in Data Science",
        lectureHours: 6,
        coMapping: "CO6",
        description: "Multimodal data science across text, images, video, and audio, along with benchmark vision challenges including ImageNet Large Scale Visual Recognition Challenge (ILSVRC).",
        topics: [
          {
            id: "itc701-t8",
            title: "Multimodal Data Science & ImageNet Benchmark",
            shortTitle: "Multimodal AI & ImageNet",
            description: "Explore multimodal feature fusion (early, late, intermediate), cross-modal attention mechanisms, and the impact of the ILSVRC challenge on deep learning architectures.",
            objectives: [
              "Understand Early Fusion vs Late Fusion in multimodal AI systems.",
              "Examine the progression of winning architectures on ImageNet (AlexNet -> VGG -> ResNet).",
              "Identify challenges in cross-modal alignment (e.g., Vision-Language models)."
            ],
            estimatedDuration: "40 mins",
            difficulty: "Intermediate",
            examWeightage: "Standard (5M)",
            prerequisites: ["CNN Foundations", "Ensemble Classifiers"],
            coMapping: "CO6",
            visualizerType: "none",
            videos: [],
            keyPoints: [
              "Multimodal learning integrates diverse modalities (text, audio, vision) to achieve superior semantic grounding.",
              "Early fusion concatenates raw features; late fusion aggregates predictions of modality-specific networks.",
              "ILSVRC benchmark (1.2M images across 1,000 categories) sparked the 2012 deep learning revolution with AlexNet achieving 15.3% top-5 error."
            ],
            hinglishSummary: "Multimodal Data Science me ek se zyada data types (jaise video aur audio ek saath) ko analyze kiya jata hai. Early fusion me shuru me features combine karte hain, jabki Late fusion me dono models apne output dekar aakhri me merge hote hain.",
            textbookRef: "François Chollet, Deep Learning with Python, Chapter 9",
            pyqs: [
              {
                id: "pyq-itc701-8",
                exam: "MU Sem VII May 2023",
                marks: 5,
                question: "Write short notes on Multimodal Data Science and discuss its real-world applications in healthcare diagnosis.",
                recurrence: "Repeated 2x in Sem VII Papers",
                blueprintAdvice: "Define multimodal fusion, give an example of combining patient X-rays (vision) with EHR text notes (NLP) and vital signs (time-series), and explain Early vs Late fusion."
              }
            ],
            quiz: [
              {
                id: "q-itc701-9",
                question: "Which breakthrough deep learning architecture won the ImageNet Large Scale Visual Recognition Challenge (ILSVRC) in 2012?",
                options: ["LeNet-5", "AlexNet", "ResNet-50", "Transformers"],
                correctAnswer: 1,
                explanation: "AlexNet (by Alex Krizhevsky, Ilya Sutskever, and Geoffrey Hinton) won ILSVRC 2012, catalyzing the deep learning boom."
              }
            ]
          }
        ]
      }
    ]
  },

  // 2. Information Retrieval System (ITD07024)
  {
    id: "itd07024",
    code: "ITD07024",
    name: "Information Retrieval System",
    shortName: "IRS",
    semester: "Semester VII",
    university: "University of Mumbai",
    scheme: "Choice Based Credit System (CBCS)",
    description: "Theoretical and algorithmic principles of modern search engines: classic IR models, inverted index construction, text tokenization, ranked scoring, and evaluation metrics.",
    totalLectureHours: 39,
    prerequisites: ["Data Structures and Algorithms", "Indexing & Searching Techniques", "Probability & Statistics"],
    syllabusPdfUrl: "/syllabi/IRS_Syllabus.pdf",
    accentColor: "#0ea5e9",
    gradient: "from-sky-500 to-blue-600",
    courseOutcomes: [
      { code: "CO1", outcome: "Define and describe the objectives of basic concepts of the Information retrieval system.", bloomsLevel: "L1, L2" },
      { code: "CO2", outcome: "Evaluate the taxonomy of different information retrieval models.", bloomsLevel: "L1, L2, L3, L4" },
      { code: "CO3", outcome: "Try to solve and process text and multimedia retrieval queries and their operations.", bloomsLevel: "L1, L2" },
      { code: "CO4", outcome: "Evaluate text processing techniques and operations in the information retrieval system.", bloomsLevel: "L1, L2, L3, L4" },
      { code: "CO5", outcome: "Demonstrate and evaluate various indexing and searching techniques.", bloomsLevel: "L1, L2, L3, L4" },
      { code: "CO6", outcome: "Design the user interface for an information retrieval system.", bloomsLevel: "L1, L2, L3, L4" },
    ],
    textbooks: [
      "Ricardo Baeza-Yates, Berthier Ribeiro-Neto, 'Modern Information Retrieval', ACM Press - Addison Wesley.",
      "Gerald Kowaski, 'Information Retrieval Systems: Theory and Implementation', Kluwer Academic.",
      "Dr. Vaishali Khairnar, Nilima Dongre, 'Storage Network Management and Retrieval', Wiley India."
    ],
    references: [
      "Christopher D. Manning, Prabhakar Raghavan, Hinrich Schütze, 'Introduction to Information Retrieval', Cambridge University Press.",
      "Robert Korfhage, 'Information Storage & Retrieval', John Wiley & Sons."
    ],
    modules: [
      {
        id: "itd07024-m1",
        moduleNumber: 1,
        title: "Introduction",
        lectureHours: 6,
        coMapping: "CO1",
        description: "Motivation, basic concepts, information retrieval process, IR system components, Information vs Data retrieval differences, and search engine architecture.",
        topics: [
          {
            id: "itd07024-t1",
            title: "Information Retrieval Pipeline & Process",
            shortTitle: "IR Pipeline & Data vs Info",
            description: "Study the end-to-end IR lifecycle: crawling, document normalization, index building, query parsing, scoring, and ranked result delivery.",
            objectives: [
              "Distinguish Data Retrieval (exact match, structured tables, SQL) from Information Retrieval (relevance ranking, unstructured text, vagueness).",
              "Trace the user information-need lifecycle from query formulation to relevance feedback.",
              "Identify core components of web search engine architectures."
            ],
            estimatedDuration: "45 mins",
            difficulty: "Foundational",
            examWeightage: "Critical (10M)",
            prerequisites: ["Data Structures"],
            coMapping: "CO1",
            visualizerType: "none",
            videos: [
              {
                title: "Week 1.1: Introduction to Information Retrieval",
                channel: "Deakin University SIT330/770",
                topic: "Module I – Introduction and retrieval process",
                url: "https://youtu.be/KoLngplzDcM",
                youtubeId: "KoLngplzDcM",
                embedUrl: "https://www.youtube.com/embed/KoLngplzDcM",
                duration: "34 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "Data Retrieval focuses on finding records that satisfy exact boolean predicates (0 error tolerance).",
              "Information Retrieval retrieves documents relevant to a user's vague information need (ranked by relevance probability).",
              "The classic IR process includes Document Corpus -> Tokenization -> Inverted Index -> Query Parsing -> Similarity Scoring -> Ranked Document List."
            ],
            hinglishSummary: "Data Retrieval (jaise database SQL query) me exact match chahiye hota hai (SELECT * WHERE id=5). Information Retrieval (jaise Google search) me user apni zaroorat natural language me likhta hai aur system hazaron documents me se sabse relevant document rank karke upar dikhata hai.",
            textbookRef: "Baeza-Yates & Ribeiro-Neto, Chapter 1",
            pyqs: [
              {
                id: "pyq-itd07024-1",
                exam: "MU Sem VII Dec 2023",
                marks: 10,
                question: "Differentiate between Data Retrieval and Information Retrieval in terms of matching, query language, error tolerance, and data model. Explain the complete Information Retrieval Process with a neat block diagram.",
                recurrence: "Repeated 6x in University Exams",
                blueprintAdvice: "Make a comparative table with at least 6 points (Structure, Query, Matching, Model, Error response, Speed). Draw the IR process flowchart showing Document Ingestion -> Preprocessing -> Indexing and Query -> Matching -> Ranking."
              }
            ],
            quiz: [
              {
                id: "q-itd07024-1",
                question: "Which of the following is a key characteristic of Information Retrieval (IR) compared to Database Data Retrieval (DR)?",
                options: [
                  "Deterministic query matching with no ambiguity",
                  "Unambiguous query languages like SQL",
                  "Relevance is subjective and probabilistic",
                  "Zero tolerance for false positives"
                ],
                correctAnswer: 2,
                explanation: "In IR, relevance is subjective to the user's specific context and information need, requiring probabilistic or ranked retrieval."
              }
            ]
          }
        ]
      },
      {
        id: "itd07024-m2",
        moduleNumber: 2,
        title: "IR Models",
        lectureHours: 6,
        coMapping: "CO2",
        description: "Taxonomy of IR models: Classic IR (Boolean, Vector Space, Probabilistic), Non-classical models, structured models, and browsing paradigms.",
        topics: [
          {
            id: "itd07024-t2",
            title: "Classic IR Models: Boolean, Vector Space & Probabilistic",
            shortTitle: "Classic IR Models (VSM & BM25)",
            description: "Deep dive into the 3 classical IR models: Exact Boolean matching, Vector Space Model (VSM) with TF-IDF cosine similarity, and Probabilistic BM25 / BIM.",
            objectives: [
              "Compute TF-IDF weights: tf_idf = (1 + log(tf)) * log(N / df).",
              "Calculate Cosine Similarity between document vectors and query vectors in t-dimensional term space.",
              "Explain the Probability Ranking Principle (PRP) and Binary Independence Model (BIM)."
            ],
            estimatedDuration: "50 mins",
            difficulty: "Intermediate",
            examWeightage: "Critical (10M)",
            prerequisites: ["Vector Algebra", "Information Retrieval Pipeline"],
            coMapping: "CO2",
            visualizerType: "none",
            videos: [
              {
                title: "Modeling in Information Retrieval",
                channel: "Deakin University SIT330/770",
                topic: "Module II – Taxonomy and modeling of IR systems",
                url: "https://youtu.be/pXQAF8_ilaI",
                youtubeId: "pXQAF8_ilaI",
                embedUrl: "https://www.youtube.com/embed/pXQAF8_ilaI",
                duration: "38 mins",
                language: "English"
              },
              {
                title: "Boolean Model",
                channel: "Deakin University SIT330/770",
                topic: "Module II and V – Boolean retrieval model and queries",
                url: "https://youtu.be/JUDbOhZd9Uc",
                youtubeId: "JUDbOhZd9Uc",
                embedUrl: "https://www.youtube.com/embed/JUDbOhZd9Uc",
                duration: "28 mins",
                language: "English"
              },
              {
                title: "Vector Model",
                channel: "Deakin University SIT330/770",
                topic: "Module II – Vector-space retrieval model",
                url: "https://youtu.be/VQU_8XrKToQ",
                youtubeId: "VQU_8XrKToQ",
                embedUrl: "https://www.youtube.com/embed/VQU_8XrKToQ",
                duration: "35 mins",
                language: "English"
              },
              {
                title: "Probabilistic Retrieval Model",
                channel: "Deakin University SIT330/770",
                topic: "Module II – Probabilistic retrieval models",
                url: "https://youtu.be/W4zvif4mOC4",
                youtubeId: "W4zvif4mOC4",
                embedUrl: "https://www.youtube.com/embed/W4zvif4mOC4",
                duration: "32 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "Boolean Model uses binary weights and boolean logic (AND, OR, NOT); suffers from feast-or-famine results and lacks partial matching.",
              "Vector Space Model (VSM) treats documents and queries as high-dimensional vectors in vocabulary space; ranks documents by Cosine Similarity cos(θ) = (d · q) / (||d|| * ||q||).",
              "TF (Term Frequency) measures local importance in document; IDF (Inverse Document Frequency) measures term specificity across the whole collection.",
              "Probabilistic models estimate P(R=1 | d, q), ranking documents in decreasing order of probability of relevance."
            ],
            hinglishSummary: "Boolean Model me ya toh document poora match hota hai ya bilkul nahi. Vector Space Model me document aur query ko math vectors maante hain, aur unke beech ka angle (Cosine Similarity) nikaalte hain. Jo document angle me sabse nazdeek hoga, wo rank #1 par aayega.",
            textbookRef: "Baeza-Yates & Ribeiro-Neto, Chapter 2",
            pyqs: [
              {
                id: "pyq-itd07024-2",
                exam: "MU Sem VII May 2023",
                marks: 10,
                question: "Explain the Vector Space Model of Information Retrieval with TF-IDF weighting and Cosine Similarity. Compute cosine similarity for 3 sample documents and a query.",
                recurrence: "Repeated 5x in University Exams",
                blueprintAdvice: "Write the formulas: TF = f_{t,d}, IDF = log(N/df_t), w_{t,d} = tf * idf. Show vector dot product divided by Euclidean norms. Highlight why length normalization prevents long documents from dominating."
              }
            ],
            quiz: [
              {
                id: "q-itd07024-2",
                question: "If a term appears in every single document in a corpus of N documents, what is its Inverse Document Frequency (IDF)?",
                options: ["N", "1.0", "0", "Infinity"],
                correctAnswer: 2,
                explanation: "IDF = log(N / df). When df = N, IDF = log(N/N) = log(1) = 0. Common terms carry zero discriminative weight."
              }
            ]
          }
        ]
      },
      {
        id: "itd07024-m3",
        moduleNumber: 3,
        title: "Query Processing and Operations",
        lectureHours: 6,
        coMapping: "CO3",
        description: "Query languages (keyword-based, structural, pattern matching), user relevance feedback (Rocchio algorithm), and multimedia IR data modeling.",
        topics: [
          {
            id: "itd07024-t3",
            title: "Relevance Feedback & Rocchio Algorithm",
            shortTitle: "Relevance Feedback & Rocchio",
            description: "Understand user relevance feedback loops, query reformulation, and vector shifts via the Rocchio algorithm: q_m = α·q_0 + β/|D_r| ∑ d_r - γ/|D_nr| ∑ d_nr.",
            objectives: [
              "Formulate Rocchio query expansion with positive and negative document feedback.",
              "Distinguish Explicit, Implicit, and Pseudo-Relevance Feedback (PRF).",
              "Analyze convergence of query vector towards user's ideal cluster of documents."
            ],
            estimatedDuration: "40 mins",
            difficulty: "Intermediate",
            examWeightage: "High (5M-10M)",
            prerequisites: ["Vector Space Model"],
            coMapping: "CO3",
            visualizerType: "none",
            videos: [
              {
                title: "Relevance Feedback and Query Expansion in Information Retrieval System",
                channel: "Parul's E-Diary",
                topic: "Module III and VI – Relevance feedback and query improvement",
                url: "https://www.youtube.com/watch?v=aVjjghFnSBw",
                youtubeId: "aVjjghFnSBw",
                embedUrl: "https://www.youtube.com/embed/aVjjghFnSBw",
                duration: "30 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "Rocchio algorithm shifts the initial query vector q_0 closer to relevant document centroids and pushes it away from non-relevant centroids.",
              "Typical tuning weights: α = 8 (original query emphasis), β = 16 (positive feedback emphasis), γ = 4 (negative feedback penalty).",
              "Pseudo-Relevance Feedback assumes top K ranked documents are relevant without asking the user, automatically expanding the query with top co-occurring terms."
            ],
            hinglishSummary: "User jab search result ke kisi document par click karke 'Yeh mere kaam ka hai' mark karta hai, toh Rocchio algorithm us document ke achhe words ko query vector me jodkar query ko improve kar deta hai taaki agli baar aur behtar results aayein.",
            textbookRef: "Baeza-Yates & Ribeiro-Neto, Chapter 5",
            pyqs: [
              {
                id: "pyq-itd07024-3",
                exam: "MU Sem VII Dec 2022",
                marks: 10,
                question: "Explain Relevance Feedback in Information Retrieval. Formulate and explain the Rocchio algorithm for query modification with a geometric diagram.",
                recurrence: "Repeated 4x in Sem VII Papers",
                blueprintAdvice: "Draw 2D vector space with original query q_0, vector addition of centroid of D_R, vector subtraction of D_NR, and the new modified query vector q_m."
              }
            ],
            quiz: [
              {
                id: "q-itd07024-3",
                question: "In the Rocchio algorithm q_m = α·q_0 + β·Centroid(D_r) - γ·Centroid(D_nr), why is γ typically set to a lower value than β?",
                options: [
                  "Because non-relevant documents have zero IDF",
                  "Because non-relevant documents are heterogeneous and do not form a tight coherent cluster",
                  "Because negative feedback requires more computation",
                  "To prevent negative numbers in document term frequency"
                ],
                correctAnswer: 1,
                explanation: "All relevant documents usually share a focused topic, whereas non-relevant documents come from wildly different topics, so penalizing their centroid too strongly distorts the query."
              }
            ]
          }
        ]
      },
      {
        id: "itd07024-m4",
        moduleNumber: 4,
        title: "Text Processing",
        lectureHours: 6,
        coMapping: "CO4",
        description: "Text and multimedia languages, metadata, markup languages, text preprocessing operations (tokenization, stop-word removal, Porter stemmer), and document clustering.",
        topics: [
          {
            id: "itd07024-t4",
            title: "Text Preprocessing: Tokenization, Stopwords & Stemming",
            shortTitle: "Text Preprocessing Pipeline",
            description: "Master the 4 fundamental stages of text normalization: character case folding, tokenization, stop-word elimination, and morphological stemming (Porter algorithm).",
            objectives: [
              "Implement Porter Stemmer rules for suffix stripping.",
              "Analyze Zipf's Law and Heaps' Law for vocabulary growth.",
              "Explain tradeoffs between stemming (rule-based) and lemmatization (vocabulary-based)."
            ],
            estimatedDuration: "40 mins",
            difficulty: "Foundational",
            examWeightage: "High (5M-10M)",
            prerequisites: ["Natural Language Basics"],
            coMapping: "CO4",
            visualizerType: "none",
            videos: [],
            keyPoints: [
              "Tokenization breaks stream of text into tokens, handling punctuation, hyphens, and contractions.",
              "Stop words (a, the, in, of) comprise ~30% of text tokens but have near-zero discriminative retrieval value.",
              "Porter Stemmer applies successive suffix replacement rules (e.g., 'sses' -> 'ss', 'ing' -> empty) using vowel-consonant measure m.",
              "Zipf's Law states term frequency f is inversely proportional to its frequency rank r: f ∝ 1/r."
            ],
            hinglishSummary: "Text Preprocessing me raw text ko saaf kiya jata hai: pehle words ko alag karte hain (Tokenization), fir bematlab ke words jaise 'is', 'the', 'at' hatate hain (Stop words), aur fir words ko unke root form me laate hain (Stemming, jaise 'playing' se 'play').",
            textbookRef: "Manning, Raghavan, Schütze, Chapter 2",
            pyqs: [
              {
                id: "pyq-itd07024-4",
                exam: "MU Sem VII May 2023",
                marks: 5,
                question: "Explain the text preprocessing steps in Information Retrieval: Tokenization, Stopword removal, and Stemming. Contrast Stemming with Lemmatization.",
                recurrence: "Repeated 5x in University Exams",
                blueprintAdvice: "Explain Porter stemmer uses algorithmic suffix stripping (e.g. 'studies' -> 'studi'), whereas Lemmatization uses morphological dictionary to return valid dictionary lemma (e.g. 'studies' -> 'study')."
              }
            ],
            quiz: [
              {
                id: "q-itd07024-4",
                question: "According to Zipf's law, if the most frequent word in a corpus occurs 10,000 times, approximately how many times would the 10th most frequent word occur?",
                options: ["10,000", "5,000", "1,000", "100"],
                correctAnswer: 2,
                explanation: "f_r = C / r. For r=1, C = 10,000. For r=10, f_10 = 10,000 / 10 = 1,000 occurrences."
              }
            ]
          }
        ]
      },
      {
        id: "itd07024-m5",
        moduleNumber: 5,
        title: "Indexing and Searching",
        lectureHours: 7,
        coMapping: "CO5",
        description: "Inverted files structure, posting lists, Boolean query processing, compression techniques, web crawling, indexing, and search engine ranking.",
        topics: [
          {
            id: "itd07024-t5",
            title: "Inverted Index Construction & Boolean Query Search",
            shortTitle: "Inverted Index Architecture",
            description: "Build an inverted index from scratch: vocabulary lexicon, document frequency, posting lists with document IDs and term offsets, and boolean merge algorithms.",
            objectives: [
              "Construct an inverted index from a raw set of documents.",
              "Execute Boolean queries (AND, OR, NOT) using linear posting list intersection algorithms.",
              "Analyze posting list compression (Variable Byte, Gamma encoding) to optimize memory storage."
            ],
            estimatedDuration: "50 mins",
            difficulty: "Intermediate",
            examWeightage: "Critical (10M)",
            prerequisites: ["Data Structures: Linked Lists & Hash Maps"],
            coMapping: "CO5",
            visualizerType: "inverted-index",
            videos: [
              {
                title: "Week 1.3: Inverted Index",
                channel: "Deakin University SIT330/770",
                topic: "Module V – Inverted files and indexing",
                url: "https://youtu.be/1_uVCZO8s5U",
                youtubeId: "1_uVCZO8s5U",
                embedUrl: "https://www.youtube.com/embed/1_uVCZO8s5U",
                duration: "30 mins",
                language: "English"
              },
              {
                title: "Query Processing with an Inverted Index",
                channel: "Deakin University SIT330/770",
                topic: "Modules III and V – Query processing and inverted-index search",
                url: "https://youtu.be/Xob9OxphH8g",
                youtubeId: "Xob9OxphH8g",
                embedUrl: "https://www.youtube.com/embed/Xob9OxphH8g",
                duration: "25 mins",
                language: "English"
              },
              {
                title: "Ranked Retrieval",
                channel: "Deakin University SIT330/770",
                topic: "Modules II and V – Ranked retrieval and scoring",
                url: "https://youtu.be/10ScKbkzOHQ",
                youtubeId: "10ScKbkzOHQ",
                embedUrl: "https://www.youtube.com/embed/10ScKbkzOHQ",
                duration: "35 mins",
                language: "English"
              },
              {
                title: "Ranked Evaluation Metrics",
                channel: "Deakin University SIT330/770",
                topic: "Module V – Evaluation of ranked search results",
                url: "https://youtu.be/5Dshev4cKuQ",
                youtubeId: "5Dshev4cKuQ",
                embedUrl: "https://www.youtube.com/embed/5Dshev4cKuQ",
                duration: "30 mins",
                language: "English"
              },
              {
                title: "How Search Engine Works: Crawling, Indexing, and Ranking",
                channel: "WsCube Tech",
                topic: "Module V – Web search, crawling, indexing and ranking",
                url: "https://www.youtube.com/watch?v=9n4l491nuOI",
                youtubeId: "9n4l491nuOI",
                embedUrl: "https://www.youtube.com/embed/9n4l491nuOI",
                duration: "32 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "An Inverted Index maps each vocabulary term to a posting list of document IDs where it appears.",
              "Posting list structure: Term -> [docFreq] -> [docID_1: tf, positions] -> [docID_2: tf, positions]...",
              "Intersecting two sorted posting lists takes O(x + y) time using two-pointer merge.",
              "Skip pointers allow jumping over irrelevant document IDs, speeding up boolean conjunctions."
            ],
            hinglishSummary: "Inverted Index book ke aakhri page ke index jaisa hota hai. Normal index me Doc -> Words hota hai, jabki Inverted Index me Word -> Documents hota hai. Jab aap search karte ho 'Machine AND Learning', toh system dono words ki posting lists ko intersect karke common Doc IDs de deta hai.",
            textbookRef: "Baeza-Yates & Ribeiro-Neto, Chapter 3",
            pyqs: [
              {
                id: "pyq-itd07024-5",
                exam: "MU Sem VII Dec 2023",
                marks: 10,
                question: "Construct an Inverted Index for the following documents: Doc 1: 'new home sales top forecasts', Doc 2: 'home sales rise in july', Doc 3: 'rise in home sales forecasts'. Show how the query 'home AND sales AND forecasts' is processed.",
                recurrence: "Repeated 6x in University Exams",
                blueprintAdvice: "List dictionary terms alphabetically with Document Frequency (df), write out postings lists [docID], and show the step-by-step two-pointer intersection of the 3 lists to yield Doc 1 and Doc 3."
              }
            ],
            quiz: [
              {
                id: "q-itd07024-5",
                question: "What is the time complexity to intersect two sorted posting lists of lengths x and y using standard two-pointer comparison?",
                options: ["O(x * y)", "O(x + y)", "O(log(x + y))", "O(x^2)"],
                correctAnswer: 1,
                explanation: "Because both posting lists are pre-sorted by document ID, a single linear scan advancing the pointer with smaller ID intersects them in O(x + y) time."
              }
            ]
          }
        ]
      },
      {
        id: "itd07024-m6",
        moduleNumber: 6,
        title: "User Interface and Visualization",
        lectureHours: 6,
        coMapping: "CO6",
        description: "HCI considerations in search engines, query specification interfaces, visualization of search results, and SeeSoft visual representations.",
        topics: [
          {
            id: "itd07024-t6",
            title: "Search UI Design, Query Specification & SeeSoft",
            shortTitle: "Search UI & Result Visualization",
            description: "Examine interaction design in search engines: auto-suggest, snippet generation, faceted filters, clustering interfaces, and SeeSoft software visualization.",
            objectives: [
              "Design search result snippet generation with query-term bolding.",
              "Evaluate faceted search navigation (hierarchical breadcrumbs, categorical filters).",
              "Understand SeeSoft code and text visualization concepts."
            ],
            estimatedDuration: "35 mins",
            difficulty: "Foundational",
            examWeightage: "Standard (5M)",
            prerequisites: ["Information Retrieval Pipeline"],
            coMapping: "CO6",
            visualizerType: "none",
            videos: [],
            keyPoints: [
              "Dynamic snippets extract 1-2 sentences containing highest density of query keywords.",
              "Faceted search allows multidimensional filtering across price, date, author, category.",
              "SeeSoft visualizes large text or code files as compact columns of colored lines representing statistics."
            ],
            hinglishSummary: "Search UI me results ke saath unka chhota summary (snippet) dikhaya jata hai jisme search terms bold hote hain. Facets (filters) se user date, author, ya topic ke hisaab se bina naya search kiye results narrow-down kar sakta hai.",
            textbookRef: "Baeza-Yates & Ribeiro-Neto, Chapter 10",
            pyqs: [
              {
                id: "pyq-itd07024-6",
                exam: "MU Sem VII May 2023",
                marks: 5,
                question: "Write short notes on result visualization in search engines and describe the working of SeeSoft visualization.",
                recurrence: "Repeated 3x in Sem VII Papers",
                blueprintAdvice: "Explain how SeeSoft maps text lines to pixel lines with colors indicating age, author, or search match frequency, enabling visual scanning of thousands of lines at once."
              }
            ],
            quiz: [
              {
                id: "q-itd07024-6",
                question: "In search engine interfaces, what is the primary purpose of dynamic snippet generation?",
                options: [
                  "To display the first 200 characters of the document",
                  "To provide contextual proof of relevance containing user query terms",
                  "To compress the inverted index",
                  "To calculate document pagerank"
                ],
                correctAnswer: 1,
                explanation: "Snippets present the user with surrounding text around query matches so they can immediately verify whether the document is truly relevant."
              }
            ]
          }
        ]
      }
    ]
  },

  // 3. Cyber Security and Laws (ILO7016)
  {
    id: "ilo7016",
    code: "ILO7016",
    name: "Cyber Security and Laws",
    shortName: "CSL",
    semester: "Semester VII",
    university: "University of Mumbai",
    scheme: "Choice Based Credit System (CBCS)",
    description: "Holistic study of cybercrime classifications, cyber offensive mechanisms, tools & methods, intellectual property, Indian IT Act 2000/2008, and international compliance standards (ISO 27001, HIPAA, SOX).",
    totalLectureHours: 39,
    prerequisites: ["Computer Networks", "Operating Systems", "Information Security Basics"],
    syllabusPdfUrl: "/syllabi/CSL_Syllabus.pdf",
    accentColor: "#ef4444",
    gradient: "from-red-500 to-rose-600",
    courseOutcomes: [
      { code: "CO1", outcome: "Understand the concept of cybercrime and its effect on outside world.", bloomsLevel: "L1, L2" },
      { code: "CO2", outcome: "Interpret and apply IT law in various legal issues.", bloomsLevel: "L1, L2, L3" },
      { code: "CO3", outcome: "Distinguish different aspects of cyber law.", bloomsLevel: "L1, L2, L3" },
      { code: "CO4", outcome: "Apply Information Security Standards compliance during software design and development.", bloomsLevel: "L1, L2, L3, L4" },
    ],
    textbooks: [
      "Nina Godbole, Sunit Belapure, 'Cyber Security', Wiley India, New Delhi.",
      "Suresh T. Vishwanathan, 'The Indian Cyber Law', Bharat Law House New Delhi.",
      "Bare Act, 'The Information Technology Act, 2000; Professional Book Publishers."
    ],
    references: [
      "Advocate Prashant Mali, 'Cyber Law & Cyber Crimes', Snow White Publications.",
      "Kennetch J. Knapp, 'Cyber Security & Global Information Assurance', Information Science Publishing.",
      "William Stallings, 'Cryptography and Network Security', Pearson."
    ],
    modules: [
      {
        id: "ilo7016-m1",
        moduleNumber: 1,
        title: "Introduction to Cybercrime",
        lectureHours: 4,
        coMapping: "CO1",
        description: "Cybercrime definition and origins, cybercrime and information security, classifications of cybercrimes, and global perspectives on cyber threats.",
        topics: [
          {
            id: "ilo7016-t1",
            title: "Cybercrime Classifications & Global Perspective",
            shortTitle: "Cybercrime Classifications",
            description: "Categorize cybercrimes by target: against individuals (cyber stalking, harassment), against property (intellectual property theft, credit card fraud), and against society (cyber terrorism, financial subversion).",
            objectives: [
              "Classify cybercrime based on target entities.",
              "Examine the distinction between computer as a tool vs computer as a target.",
              "Identify jurisdictional challenges in investigating cross-border cybercrimes."
            ],
            estimatedDuration: "40 mins",
            difficulty: "Foundational",
            examWeightage: "High (5M-10M)",
            prerequisites: ["Computer Networks"],
            coMapping: "CO1",
            visualizerType: "cyber-killchain",
            videos: [
              {
                title: "Day 1: Concept of Cyber Crime and Recent Trends",
                channel: "NCERT Official",
                topic: "Module 1 – Introduction to cybercrime",
                url: "https://www.youtube.com/watch?v=-sIBz9dLeqQ",
                youtubeId: "-sIBz9dLeqQ",
                embedUrl: "https://www.youtube.com/embed/-sIBz9dLeqQ",
                duration: "42 mins",
                language: "English"
              },
              {
                title: "Day 2: Types of Cyber Crime",
                channel: "NCERT Official",
                topic: "Module 1–2 – Cybercrime classifications and offences",
                url: "https://www.youtube.com/watch?v=klwbiYsULT8",
                youtubeId: "klwbiYsULT8",
                embedUrl: "https://www.youtube.com/embed/klwbiYsULT8",
                duration: "38 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "Computer as a Target: DoS attacks, ransomware, unauthorized access, malware propagation.",
              "Computer as a Tool: Identity theft, phishing scams, cyber extortion, online fraud.",
              "Convention on Cybercrime (Budapest Convention) was the first international treaty addressing cyber violations."
            ],
            hinglishSummary: "Cybercrime ko teen categories me baanta jata hai: Insaan ke khilaaf (harassment, stalking), Property ke khilaaf (theft, piracy), aur Society/Government ke khilaaf (cyber terrorism, hacking national grids).",
            textbookRef: "Godbole & Belapure, Chapter 1",
            pyqs: [
              {
                id: "pyq-ilo7016-1",
                exam: "MU Sem VII Dec 2023",
                marks: 10,
                question: "Define Cybercrime. How are cybercrimes classified? Explain cybercrime against individuals, property, and society with relevant examples.",
                recurrence: "Repeated 5x in University Exams",
                blueprintAdvice: "Give formal legal definition. Provide a structured 3-way table with categories, specific offense names, modus operandi, and real-world examples."
              }
            ],
            quiz: [
              {
                id: "q-ilo7016-1",
                question: "Which of the following cyber offenses is considered a crime against Property?",
                options: ["Cyber stalking", "Cyber terrorism", "Software piracy & patent infringement", "Defamation on social media"],
                correctAnswer: 2,
                explanation: "Software piracy and unauthorized duplication of copyrighted assets constitute cyber offenses against intellectual and commercial property."
              }
            ]
          }
        ]
      },
      {
        id: "ilo7016-m2",
        moduleNumber: 2,
        title: "Cyber Offenses",
        lectureHours: 9,
        coMapping: "CO1",
        description: "Criminal attack planning, social engineering, cyber stalking, botnets, attack vectors, mobile & wireless device security vulnerabilities, and organizational policies.",
        topics: [
          {
            id: "ilo7016-t2",
            title: "Cyber Attack Planning, Botnets & Social Engineering",
            shortTitle: "Attack Vectors & Botnets",
            description: "Understand the Cyber Attack Lifecycle (Reconnaissance, Scanning, Gaining Access, Maintaining Access, Clearing Tracks), botnet command-and-control (C2), and human psychology exploitation.",
            objectives: [
              "Map the stages of the Cyber Kill Chain.",
              "Examine Botnet architecture: centralized IRC/HTTP vs decentralized P2P command-and-control.",
              "Identify Social Engineering techniques: pretexting, baiting, tailgating, and spear phishing."
            ],
            estimatedDuration: "50 mins",
            difficulty: "Intermediate",
            examWeightage: "Critical (10M)",
            prerequisites: ["Cybercrime Classifications"],
            coMapping: "CO1",
            visualizerType: "cyber-killchain",
            videos: [
              {
                title: "Types of Cyber Attacks",
                channel: "MITS Gwalior",
                topic: "Module 2–3 – Common attack categories and vectors",
                url: "https://www.youtube.com/watch?v=BT3dyUG3XRY",
                youtubeId: "BT3dyUG3XRY",
                embedUrl: "https://www.youtube.com/embed/BT3dyUG3XRY",
                duration: "30 mins",
                language: "English"
              },
              {
                title: "Cyber Vandalism, Cyber Stalking, Internet Frauds and Software Piracy",
                channel: "MITS Gwalior",
                topic: "Module 2 – Cyber offences and online fraud",
                url: "https://www.youtube.com/watch?v=osFAYrcJavs",
                youtubeId: "osFAYrcJavs",
                embedUrl: "https://www.youtube.com/embed/osFAYrcJavs",
                duration: "35 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "Reconnaissance (Passive & Active) gathers target IP blocks, DNS records, and organizational employee structures.",
              "A Botnet consists of compromised internet-connected devices (zombies) controlled remotely via Command & Control (C2) servers.",
              "Social engineering bypasses technological firewalls by exploiting human trust and authority biases."
            ],
            hinglishSummary: "Cyber attack ekdum se nahi hota; pehle attacker target ki jaankari nikaalta hai (Recon), fir access leta hai, aur fir hazaron hacked computers (Botnet) ka use karke DDoS ya data theft execute karta hai.",
            textbookRef: "Godbole & Belapure, Chapter 2",
            pyqs: [
              {
                id: "pyq-ilo7016-2",
                exam: "MU Sem VII May 2023",
                marks: 10,
                question: "How do criminals plan cyber attacks? Explain the stages: Reconnaissance, Passive attacks, Active attacks, and Scanning in detail.",
                recurrence: "Repeated 4x in Sem VII Papers",
                blueprintAdvice: "Diagram the attack planning sequence from open-source intelligence gathering to port scanning, vulnerability exploitation, and privilege escalation."
              }
            ],
            quiz: [
              {
                id: "q-ilo7016-2",
                question: "What is a compromised computer under remote control of an attacker in a Botnet called?",
                options: ["Rootkit", "Zombie", "Sniffer", "Trojan Beacon"],
                correctAnswer: 1,
                explanation: "An infected host executing remote attacker commands as part of a coordinated botnet is commonly termed a zombie or bot."
              }
            ]
          }
        ]
      },
      {
        id: "ilo7016-m3",
        moduleNumber: 3,
        title: "Tools and Methods in Cyber line",
        lectureHours: 6,
        coMapping: "CO1",
        description: "Phishing, password cracking, keyloggers, steganography, DoS & DDoS attacks, SQL injection, buffer overflows, and attacks on wireless networks.",
        topics: [
          {
            id: "ilo7016-t3",
            title: "Cyber Attack Vectors: SQLi, DoS/DDoS & Phishing",
            shortTitle: "SQL Injection, DoS & Phishing",
            description: "Deep dive into web application vulnerabilities (SQL Injection exploitation & mitigation via parameterized queries), volumetric/application DoS, and email spoofing.",
            objectives: [
              "Demonstrate In-band, Inferential (Blind), and Out-of-band SQL Injection attacks.",
              "Differentiate SYN Flood, UDP Flood, and HTTP Slowloris attacks.",
              "Implement counter-measures including WAF, parameterized statements, and rate limiting."
            ],
            estimatedDuration: "50 mins",
            difficulty: "Intermediate",
            examWeightage: "Critical (10M)",
            prerequisites: ["SQL Basics", "Web Architecture"],
            coMapping: "CO1",
            visualizerType: "cyber-killchain",
            videos: [
              {
                title: "Phishing Attacks Explained",
                channel: "Simplilearn",
                topic: "Module 3 – Phishing and social engineering",
                url: "https://www.youtube.com/watch?v=BhGWnSeNXq0",
                youtubeId: "BhGWnSeNXq0",
                embedUrl: "https://www.youtube.com/embed/BhGWnSeNXq0",
                duration: "18 mins",
                language: "English"
              },
              {
                title: "SQL Injection Explained | SQL Injection Attack in Cyber Security",
                channel: "Great Learning",
                topic: "Module 3 – SQL injection",
                url: "https://www.youtube.com/watch?v=pTzgfDw_BDg",
                youtubeId: "pTzgfDw_BDg",
                embedUrl: "https://www.youtube.com/embed/pTzgfDw_BDg",
                duration: "25 mins",
                language: "English"
              },
              {
                title: "Denial of Service Attacks Explained",
                channel: "Hussein Nasser",
                topic: "Module 3 – DoS and DDoS attacks",
                url: "https://www.youtube.com/watch?v=4I7tPW8of2g",
                youtubeId: "4I7tPW8of2g",
                embedUrl: "https://www.youtube.com/embed/4I7tPW8of2g",
                duration: "22 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "SQL Injection occurs when untrusted user input is directly concatenated into SQL queries without escaping.",
              "Mitigation: Prepared Statements / Parameterized Queries completely separate SQL command code from user data.",
              "SYN Flood exploits the TCP 3-way handshake by leaving half-open connections to exhaust kernel backlog queues.",
              "Steganography hides secret communication payloads inside carrier media (images, audio) without altering visual appearance."
            ],
            hinglishSummary: "SQL Injection me attacker login box me ' OR '1'='1 daalkar bina password ke database bypass kar leta hai. Iska sabse solid solution Prepared Statements (Parameterized queries) use karna hai taaki database input ko sirf string data maane, SQL command nahi.",
            textbookRef: "Godbole & Belapure, Chapter 3",
            pyqs: [
              {
                id: "pyq-ilo7016-3",
                exam: "MU Sem VII Dec 2023",
                marks: 10,
                question: "Explain SQL Injection attack with vulnerable code snippets. How does SQL Injection work, what are its types, and how can it be prevented using Parameterized queries?",
                recurrence: "Repeated 6x in University Exams",
                blueprintAdvice: "Provide vulnerable snippet: 'SELECT * FROM users WHERE user=''' + input + '''' Show bypass payload 'admin' --. Then provide safe parameterized snippet and explain input sanitization and WAF."
              }
            ],
            quiz: [
              {
                id: "q-ilo7016-3",
                question: "Which of the following is the most robust and secure defense against SQL Injection vulnerabilities?",
                options: [
                  "Client-side JavaScript form validation",
                  "Parameterized queries (Prepared Statements)",
                  "Blacklisting single quotes only",
                  "Base64 encoding all user inputs"
                ],
                correctAnswer: 1,
                explanation: "Prepared Statements treat all incoming user parameters strictly as data literals, rendering SQL code injection impossible regardless of input characters."
              }
            ]
          }
        ]
      },
      {
        id: "ilo7016-m4",
        moduleNumber: 4,
        title: "The Concept of Cyberspace",
        lectureHours: 8,
        coMapping: "CO2",
        description: "E-Commerce legalities, contract aspects in cyber law, security aspects of cyber law, intellectual property in cyberspace, and electronic banking regulations.",
        topics: [
          {
            id: "ilo7016-t4",
            title: "E-Contracts, IPR in Cyberspace & Electronic Banking",
            shortTitle: "E-Contracts & Cyberspace IPR",
            description: "Study enforceability of Shrink-wrap, Click-wrap, and Browse-wrap contracts, digital signatures legal validity, and digital copyright infringements.",
            objectives: [
              "Compare Click-wrap, Shrink-wrap, and Browse-wrap electronic agreements.",
              "Understand legal requirements for valid electronic contracts under Indian Contract Act 1872 & IT Act 2000.",
              "Analyze domain name disputes (Cybersquatting) under ICANN UDRP policy."
            ],
            estimatedDuration: "40 mins",
            difficulty: "Intermediate",
            examWeightage: "High (5M-10M)",
            prerequisites: ["Cybercrime Basics"],
            coMapping: "CO2",
            visualizerType: "none",
            videos: [
              {
                title: "Day 3: Cyber Crime and the Law",
                channel: "NCERT Official",
                topic: "Module 4–5 – Cyber law and legal response",
                url: "https://www.youtube.com/watch?v=S97lwBexlo4",
                youtubeId: "S97lwBexlo4",
                embedUrl: "https://www.youtube.com/embed/S97lwBexlo4",
                duration: "35 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "Click-wrap contracts require affirmative action ('I Agree' checkbox) before service usage, carrying high legal enforceability.",
              "Browse-wrap contracts place terms at website footer without mandatory consent; often contested in court.",
              "Section 10A of Indian IT Act gives explicit legal validity to contracts formed through electronic means."
            ],
            hinglishSummary: "E-Contracts teen tarah ke hote hain: Shrink-wrap (software package kholne par), Click-wrap ('I Accept' par click karke), aur Browse-wrap (website use karne par implicit consent). Indian IT Act 2000 ke Section 10A ke tahat electronic contracts poori tarah legally valid hain.",
            textbookRef: "Suresh T. Vishwanathan, The Indian Cyber Law, Chapters 3 & 4",
            pyqs: [
              {
                id: "pyq-ilo7016-4",
                exam: "MU Sem VII May 2023",
                marks: 10,
                question: "Explain the types of electronic contracts: Click-wrap, Shrink-wrap, and Browse-wrap with examples. Discuss the legal enforceability of electronic records and digital signatures.",
                recurrence: "Repeated 4x in Sem VII Papers",
                blueprintAdvice: "Define all 3 contracts with user interaction flow, state relevant Section 10A and Section 3 of IT Act 2000 regarding authentication via asymmetric cryptosystem."
              }
            ],
            quiz: [
              {
                id: "q-ilo7016-4",
                question: "Which type of online contract requires the user to explicitly click an 'I Agree' or 'Accept' button before accessing a software or service?",
                options: ["Browse-wrap", "Click-wrap", "Shrink-wrap", "Implied-wrap"],
                correctAnswer: 1,
                explanation: "Click-wrap agreements mandate an explicit positive affirmation by clicking a checkbox or button, establishing undeniable proof of assent."
              }
            ]
          }
        ]
      },
      {
        id: "ilo7016-m5",
        moduleNumber: 5,
        title: "Indian IT Act",
        lectureHours: 6,
        coMapping: "CO3",
        description: "Cybercrime and Criminal Justice under IT Act 2000: penalties, adjudication, Cyber Appellate Tribunal, and the 2008 amendments (Sections 43, 65, 66, 66A, 66C, 66D, 66E, 66F, 67).",
        topics: [
          {
            id: "ilo7016-t5",
            title: "Indian Information Technology Act 2000 & 2008 Amendments",
            shortTitle: "Indian IT Act & Key Penalties",
            description: "Comprehensive breakdown of statutory sections under IT Act 2000/2008: hacking penalties, identity theft, cyber terrorism, tampering with source code, and data privacy compensation.",
            objectives: [
              "Master Section 43 (Civil penalty up to ₹1 Crore for unauthorized system access) and Section 43A (Corporate compensation for sensitive data leakage).",
              "Examine criminal penalties: Section 65 (Source code tampering), Section 66C (Identity theft), Section 66D (Cheating by personation), and Section 66F (Cyber terrorism).",
              "Understand the role of the Adjudicating Officer, CERT-In, and Cyber Appellate Tribunal (CAT)."
            ],
            estimatedDuration: "50 mins",
            difficulty: "Intermediate",
            examWeightage: "Critical (10M)",
            prerequisites: ["Concept of Cyberspace"],
            coMapping: "CO3",
            visualizerType: "none",
            videos: [
              {
                title: "The Indian Information Technology Act, 2000",
                channel: "Audit Control Governance Risk and Compliance",
                topic: "Module 5 – Indian IT Act 2000",
                url: "https://www.youtube.com/watch?v=zzsGHXS8HfA",
                youtubeId: "zzsGHXS8HfA",
                embedUrl: "https://www.youtube.com/embed/zzsGHXS8HfA",
                duration: "32 mins",
                language: "English"
              },
              {
                title: "Day 4: Reporting Mechanism and Response",
                channel: "NCERT Official",
                topic: "Module 2–5 – Reporting cybercrime and response",
                url: "https://www.youtube.com/watch?v=qFOBQjIHxtE",
                youtubeId: "qFOBQjIHxtE",
                embedUrl: "https://www.youtube.com/embed/qFOBQjIHxtE",
                duration: "30 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "Section 43: Damage to computer systems (downloading, virus introduction, denial of access) involves civil damages paid to the victim.",
              "Section 43A: Corporates failing to protect Sensitive Personal Data or Information (SPDI) are liable for uncapped compensation.",
              "Section 66: Computer-related offenses punishable with imprisonment up to 3 years or fine up to ₹5 Lakhs.",
              "Section 66F: Cyber Terrorism carries life imprisonment for acts threatening sovereignty, integrity, or critical infrastructure."
            ],
            hinglishSummary: "Indian IT Act 2000 me main sections hain: Section 43 (bina permission computer touch ya virus daalna - fine), Section 65 (source code chhedna), Section 66C (identity theft / password churana), Section 66D (nakli identity banakar fraud karna), aur Section 66F (cyber terrorism - life imprisonment).",
            textbookRef: "Bare Act: Information Technology Act 2000 & 2008 Amendments",
            pyqs: [
              {
                id: "pyq-ilo7016-5",
                exam: "MU Sem VII Dec 2023",
                marks: 10,
                question: "Explain the salient features of the Indian IT Act 2000. Discuss the following sections: Section 43, Section 65, Section 66, Section 66C, and Section 66F.",
                recurrence: "Repeated 6x in University Exams",
                blueprintAdvice: "List objectives of IT Act (legal recognition of e-commerce, digital signatures, cyber regulation). Create a detailed summary table mapping each Section number, Nature of offense, Penalty (jail term/fine), and Bail status."
              }
            ],
            quiz: [
              {
                id: "q-ilo7016-5",
                question: "Under the Indian IT Act (Amendment) 2008, what is the maximum punishment for committing Cyber Terrorism under Section 66F?",
                options: ["3 years imprisonment", "7 years imprisonment", "Imprisonment for life", "₹10 Lakh fine only"],
                correctAnswer: 2,
                explanation: "Section 66F prescribes life imprisonment for cyber terrorism acts endangering national security or critical information infrastructure."
              }
            ]
          }
        ]
      },
      {
        id: "ilo7016-m6",
        moduleNumber: 6,
        title: "Information Security Standard Compliances",
        lectureHours: 6,
        coMapping: "CO4",
        description: "Global compliance and regulatory frameworks: Sarbanes-Oxley (SOX), GLBA, HIPAA, ISO/IEC 27001, FISMA, NERC, and PCI-DSS.",
        topics: [
          {
            id: "ilo7016-t6",
            title: "ISO 27001, HIPAA, SOX & PCI-DSS Compliances",
            shortTitle: "Security Compliances & ISO 27001",
            description: "Understand regulatory standards protecting health records (HIPAA), financial auditing (SOX Section 404), cardholder data (PCI-DSS), and ISMS management (ISO 27001).",
            objectives: [
              "Examine ISO/IEC 27001 Information Security Management System (ISMS) PDCA cycle (Plan-Do-Check-Act).",
              "Understand HIPAA Security Rule (Administrative, Physical, and Technical safeguards for ePHI).",
              "Identify the 12 core requirements of PCI-DSS for card payment processing."
            ],
            estimatedDuration: "40 mins",
            difficulty: "Intermediate",
            examWeightage: "High (5M-10M)",
            prerequisites: ["Indian IT Act"],
            coMapping: "CO4",
            visualizerType: "none",
            videos: [
              {
                title: "What is ISO/IEC 27001? Guide to Information Security Management Systems",
                channel: "International Organization for Standardization (ISO)",
                topic: "Module 6 – Information security standards and compliance",
                url: "https://www.youtube.com/watch?v=jPA6gbsT2IQ",
                youtubeId: "jPA6gbsT2IQ",
                embedUrl: "https://www.youtube.com/embed/jPA6gbsT2IQ",
                duration: "20 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "ISO 27001 defines requirements for establishing, implementing, maintaining, and continually improving an ISMS.",
              "HIPAA (Health Insurance Portability and Accountability Act) mandates encryption and access audit logs for protected health information.",
              "PCI-DSS (Payment Card Industry Data Security Standard) requires strict segmentation and tokenization of primary account numbers (PAN).",
              "SOX Section 404 mandates annual auditing of internal IT controls over financial reporting systems."
            ],
            hinglishSummary: "Security Standards companies ko follow karne padte hain: ISO 27001 security management ka international benchmark hai, HIPAA hospitals me patient data bachane ke liye hai, aur PCI-DSS banks/e-commerce me credit/debit card numbers ko secure rakhne ke liye mandatory hai.",
            textbookRef: "Nina Godbole, Information Systems Security, Chapter 12",
            pyqs: [
              {
                id: "pyq-ilo7016-6",
                exam: "MU Sem VII May 2023",
                marks: 10,
                question: "Explain the importance of Information Security Compliance standards. Discuss ISO 27001, HIPAA, and PCI-DSS in detail.",
                recurrence: "Repeated 4x in Sem VII Papers",
                blueprintAdvice: "Define compliance vs security. Detail ISO 27001 Annex A controls, HIPAA Security Rule 3 safeguards, and PCI-DSS 6 control objectives / 12 requirements."
              }
            ],
            quiz: [
              {
                id: "q-ilo7016-6",
                question: "Which compliance standard is specifically mandatory for organizations that store, process, or transmit credit cardholder data?",
                options: ["HIPAA", "SOX", "PCI-DSS", "NERC CIP"],
                correctAnswer: 2,
                explanation: "PCI-DSS (Payment Card Industry Data Security Standard) is the global benchmark mandated by major payment card brands."
              }
            ]
          }
        ]
      }
    ]
  },

  // 4. Internet of Everything (ITC702)
  {
    id: "itc702",
    code: "ITC702",
    name: "Internet of Everything",
    shortName: "IOE",
    semester: "Semester VII",
    university: "University of Mumbai",
    scheme: "Choice Based Credit System (CBCS)",
    description: "End-to-end connected systems: IoT vs IoE paradigms, IoT World Forum 7-layer architecture, sensor access technologies (RFID, BLE, Zigbee, LoRaWAN), edge-to-cloud protocols (MQTT, CoAP), and cloud analytics.",
    totalLectureHours: 39,
    prerequisites: ["Computer Networks", "Python Programming", "Microcontrollers & Embedded Systems"],
    syllabusPdfUrl: "/syllabi/IOE_Syllabus.pdf",
    accentColor: "#10b981",
    gradient: "from-emerald-500 to-teal-600",
    courseOutcomes: [
      { code: "CO1", outcome: "Describe the Characteristics and Conceptual Framework of IoT.", bloomsLevel: "L1, L2" },
      { code: "CO2", outcome: "Differentiate between the levels of the IoT architectures.", bloomsLevel: "L1, L2, L3, L4" },
      { code: "CO3", outcome: "Analyze the IoT access technologies.", bloomsLevel: "L1, L2, L3, L4" },
      { code: "CO4", outcome: "Illustrate various edge to cloud protocol for IoT.", bloomsLevel: "L1, L2, L3" },
      { code: "CO5", outcome: "Apply IoT analytics and data visualization.", bloomsLevel: "L1, L2, L3" },
      { code: "CO6", outcome: "Analyze and evaluate IoT applications.", bloomsLevel: "L1, L2, L3, L4" },
    ],
    textbooks: [
      "Arshdeep Bahga, Vijay Madisetti, 'Internet Of Things: A Hands-On Approach', Universities Press.",
      "David Hanes, Gonzalo Salgueiro, 'IoT Fundamentals: Networking Technologies, Protocols, and Use Cases for IoT', CISCO Press.",
      "Andrew Minteer, 'Analytics for the Internet of Things (IoT)', Packet Publishing."
    ],
    references: [
      "Pethuru Raj, Anupama C. Raman, 'The Internet of Things: Enabling Technologies, Platforms, and Use Cases', CRC Press.",
      "Raj Kamal, 'Internet of Things, Architecture and Design Principles', McGraw Hill."
    ],
    modules: [
      {
        id: "itc702-m1",
        moduleNumber: 1,
        title: "Introduction to IoT",
        lectureHours: 4,
        coMapping: "CO1",
        description: "Defining IoT, characteristics of IoT, conceptual framework, physical and logical design, functional blocks, and IoT vs IoE (People, Process, Data, Things).",
        topics: [
          {
            id: "itc702-t1",
            title: "IoT Conceptual Framework & Characteristics",
            shortTitle: "IoT Basics & Physical/Logical Design",
            description: "Study core IoT characteristics (dynamic global network, self-adapting, self-configuring, interoperable communication), physical design (things, protocols), and functional blocks.",
            objectives: [
              "Differentiate Internet of Things (IoT) from Internet of Everything (IoE).",
              "Explain the 5 core functional blocks: Device, Communication, Services, Management, and Application.",
              "Contrast IoT communication models: Request-Response, Publish-Subscribe, Push-Pull, and Exclusive Pair."
            ],
            estimatedDuration: "40 mins",
            difficulty: "Foundational",
            examWeightage: "Critical (10M)",
            prerequisites: ["Computer Networks"],
            coMapping: "CO1",
            visualizerType: "mqtt-flow",
            videos: [
              {
                title: "LIVE: IoT Introduction and Architecture",
                channel: "NPTEL Special Lecture Series Live",
                topic: "Modules I–II – IoT foundations and architecture",
                url: "https://www.youtube.com/watch?v=-RHYCpsn8TA",
                youtubeId: "-RHYCpsn8TA",
                embedUrl: "https://www.youtube.com/embed/-RHYCpsn8TA",
                duration: "50 mins",
                language: "English"
              },
              {
                title: "IoT Tutorial for Beginners | Internet of Things Applications",
                channel: "Intellipaat",
                topic: "Modules I–II – IoT components, architecture, devices and applications",
                url: "https://www.youtube.com/watch?v=UOnBnngjiNM",
                youtubeId: "UOnBnngjiNM",
                embedUrl: "https://www.youtube.com/embed/UOnBnngjiNM",
                duration: "45 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "IoE expands IoT by bringing together 4 pillars: People (connecting humans more value-add), Process (right info to right person/thing), Data (converting telemetry into actionable insights), and Things (physical sensors/actuators).",
              "Physical design specifies sensors, actuators, compute hardware (ESP32, Raspberry Pi), and physical link layer protocols.",
              "Logical design defines functional blocks, communication APIs (REST vs WebSocket), and data serialization (JSON, Protocol Buffers)."
            ],
            hinglishSummary: "IoT sirf physical devices ko internet se connect karta hai, jabki IoE (Internet of Everything) chaar cheezon ko jodta hai: People, Process, Data, aur Things. Isme data ko real-time analyze karke processes ko automate kiya jata hai.",
            textbookRef: "Bahga & Madisetti, Chapter 1",
            pyqs: [
              {
                id: "pyq-itc702-1",
                exam: "MU Sem VII Dec 2023",
                marks: 10,
                question: "Define IoT and IoE. Explain the 4 pillars of Internet of Everything (People, Process, Data, Things) and compare IoT Communication Models with neat diagrams.",
                recurrence: "Repeated 5x in University Exams",
                blueprintAdvice: "Draw the Cisco 4-pillars diagram for IoE. Provide side-by-side diagrams of Request-Response, Publish-Subscribe, Push-Pull, and Exclusive-Pair communication models."
              }
            ],
            quiz: [
              {
                id: "q-itc702-1",
                question: "Which communication model in IoT uses an intermediate Broker to decouple senders and receivers in both time and space?",
                options: ["Request-Response", "Publish-Subscribe", "Push-Pull", "Exclusive Pair"],
                correctAnswer: 1,
                explanation: "The Publish-Subscribe model decouples publishers and subscribers via a broker, allowing asynchronous one-to-many event distribution."
              }
            ]
          }
        ]
      },
      {
        id: "itc702-m2",
        moduleNumber: 2,
        title: "IoT Architecture",
        lectureHours: 6,
        coMapping: "CO2",
        description: "IoT World Forum (IoTWF) 7-layer standardized architecture, IT/OT convergence, fog & edge computing hierarchy, and data management stacks.",
        topics: [
          {
            id: "itc702-t2",
            title: "IoTWF 7-Layer Architecture & Fog/Edge Computing",
            shortTitle: "IoTWF 7 Layers & Fog Computing",
            description: "Understand the IoT World Forum reference model from Layer 1 (Physical Devices) up to Layer 7 (Collaboration & Processes), and the role of Fog computing in latency reduction.",
            objectives: [
              "Analyze all 7 layers of the standardized IoTWF architectural model.",
              "Differentiate Edge Computing, Fog Computing, and Cloud Computing in latency, bandwidth, and compute.",
              "Explain IT (Information Technology) and OT (Operational Technology) convergence challenges."
            ],
            estimatedDuration: "50 mins",
            difficulty: "Intermediate",
            examWeightage: "Critical (10M)",
            prerequisites: ["IoT Conceptual Framework"],
            coMapping: "CO2",
            visualizerType: "none",
            videos: [
              {
                title: "IoT Architecture",
                channel: "Engineering Funda",
                topic: "Module II – IoT architecture",
                url: "https://www.youtube.com/watch?v=nw8F-oPgFaY",
                youtubeId: "nw8F-oPgFaY",
                embedUrl: "https://www.youtube.com/embed/nw8F-oPgFaY",
                duration: "25 mins",
                language: "English"
              },
              {
                title: "Edge Computing | Fog Computing | Cloud Computing",
                channel: "Perfect Computer Engineer",
                topic: "Module II and V – Edge, fog and cloud computing",
                url: "https://www.youtube.com/watch?v=iE1GxmD2csw",
                youtubeId: "iE1GxmD2csw",
                embedUrl: "https://www.youtube.com/embed/iE1GxmD2csw",
                duration: "20 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "Layer 1: Physical Devices & Controllers (Sensors/Actuators).",
              "Layer 2: Connectivity (Cellular, WiFi, BLE, LoRa, 802.15.4).",
              "Layer 3: Edge Computing (Data element analysis and packet inspection).",
              "Layer 4: Data Accumulation (Storage in transit, databases).",
              "Layer 5: Data Abstraction (Schema reconciliation, formatting).",
              "Layer 6: Application (Analytics, reporting, alerts).",
              "Layer 7: Collaboration & Processes (Business logic, human decision loop).",
              "Fog computing pushes computation from remote central clouds to local network gateways, minimizing round-trip latency to sub-millisecond ranges."
            ],
            hinglishSummary: "Cisco IoTWF architecture me 7 layers hote hain: L1 physical sensor se shuru hokar L7 business applications tak. Fog Computing cloud aur device ke beech me local gateways par processing karta hai taaki emergency decisions (jaise automatic brakes) bina internet delay ke turant ho sakein.",
            textbookRef: "David Hanes, IoT Fundamentals, Chapter 2",
            pyqs: [
              {
                id: "pyq-itc702-2",
                exam: "MU Sem VII May 2023",
                marks: 10,
                question: "Explain the IoT World Forum (IoTWF) Standardized 7-Layer Reference Model with a neat labeled diagram. Explain the function of each layer.",
                recurrence: "Repeated 6x in University Exams",
                blueprintAdvice: "Draw the 7 horizontal layers clearly. For each layer write: Primary function, input/output data representation, and example technologies (e.g. L2: Zigbee/LoRa, L3: Edge filters, L4: Time-series DB)."
              }
            ],
            quiz: [
              {
                id: "q-itc702-2",
                question: "In the IoTWF 7-Layer Reference Model, which layer is responsible for converting data in motion into data at rest?",
                options: ["Layer 2: Connectivity", "Layer 3: Edge Computing", "Layer 4: Data Accumulation", "Layer 6: Application"],
                correctAnswer: 2,
                explanation: "Layer 4 (Data Accumulation) receives real-time packet streams from Layer 3 and stores them in persistent databases or file stores as data at rest."
              }
            ]
          }
        ]
      },
      {
        id: "itc702-m3",
        moduleNumber: 3,
        title: "Principles of Connected Devices and Protocols in IoT",
        lectureHours: 8,
        coMapping: "CO3",
        description: "Wireless sensor access technologies: RFID, NFC, BLE, Zigbee (IEEE 802.15.4), 6LoWPAN, LoRaWAN, and Cellular NB-IoT.",
        topics: [
          {
            id: "itc702-t3",
            title: "IoT Access Technologies: Zigbee, LoRaWAN, BLE & 6LoWPAN",
            shortTitle: "Zigbee, LoRaWAN & Wireless Protocols",
            description: "Compare low-power short-range protocols (Zigbee, BLE, NFC) against Low Power Wide Area Networks (LoRaWAN, NB-IoT) in frequency, range, throughput, and power.",
            objectives: [
              "Analyze IEEE 802.15.4 physical and MAC layer standard.",
              "Explain LoRa modulation (Chirp Spread Spectrum) and LoRaWAN star-of-stars network topology.",
              "Understand 6LoWPAN header compression (RFC 6282) enabling IPv6 over constrained 802.15.4 links."
            ],
            estimatedDuration: "50 mins",
            difficulty: "Intermediate",
            examWeightage: "Critical (10M)",
            prerequisites: ["Computer Networks: Link Layer"],
            coMapping: "CO3",
            visualizerType: "none",
            videos: [
              {
                title: "ZigBee Explained",
                channel: "Engineering Funda",
                topic: "Module III – ZigBee and connected-device protocols",
                url: "https://www.youtube.com/watch?v=lVr88JS-2rM",
                youtubeId: "lVr88JS-2rM",
                embedUrl: "https://www.youtube.com/embed/lVr88JS-2rM",
                duration: "22 mins",
                language: "English"
              },
              {
                title: "NFC – Near Field Communication",
                channel: "Engineering Funda",
                topic: "Module III – NFC and connected-device access technologies",
                url: "https://www.youtube.com/watch?v=jVAGyyoN4MY",
                youtubeId: "jVAGyyoN4MY",
                embedUrl: "https://www.youtube.com/embed/jVAGyyoN4MY",
                duration: "18 mins",
                language: "English"
              },
              {
                title: "NB-IoT Explained: Basics, Working, Architecture and Applications",
                channel: "Engineering Funda",
                topic: "Module III – Cellular IoT / NB-IoT",
                url: "https://www.youtube.com/watch?v=OTjWSUw8h0o",
                youtubeId: "OTjWSUw8h0o",
                embedUrl: "https://www.youtube.com/embed/OTjWSUw8h0o",
                duration: "24 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "Zigbee (IEEE 802.15.4) operates at 2.4 GHz; supports mesh topology with coordinator, router, and end devices; range ~10-100m.",
              "LoRaWAN operates on sub-GHz ISM bands (868 MHz EU / 865 MHz IN / 915 MHz US); achieves 5-15 km range with battery lifetime up to 10 years.",
              "6LoWPAN compresses 40-byte IPv6 headers down to 2 bytes, allowing 128-bit IPv6 packets to fit inside 127-byte 802.15.4 MTU."
            ],
            hinglishSummary: "Smart Home me Zigbee aur BLE best hote hain kyunki range kam (room tak) aur mesh network hota hai. Smart Agriculture ya City me LoRaWAN aur NB-IoT use hote hain kyunki ye 10-15 kilometer door tak battery par saalon saal data bhej sakte hain.",
            textbookRef: "David Hanes, IoT Fundamentals, Chapters 3 & 4",
            pyqs: [
              {
                id: "pyq-itc702-3",
                exam: "MU Sem VII Dec 2023",
                marks: 10,
                question: "Compare Zigbee and LoRaWAN in terms of frequency band, range, data rate, network topology, battery life, and typical application scenarios.",
                recurrence: "Repeated 5x in University Exams",
                blueprintAdvice: "Draw a side-by-side comparison matrix with 6 technical parameters. Diagram Zigbee mesh topology vs LoRaWAN star-of-stars gateway architecture."
              }
            ],
            quiz: [
              {
                id: "q-itc702-3",
                question: "What is the primary role of the 6LoWPAN protocol adaptation layer in the IoT stack?",
                options: [
                  "To encrypt Zigbee mesh traffic with AES-256",
                  "To compress 40-byte IPv6 headers to fit within 127-byte IEEE 802.15.4 frames",
                  "To translate MQTT packets into HTTP REST requests",
                  "To boost WiFi signal amplification"
                ],
                correctAnswer: 1,
                explanation: "Standard IPv6 headers are 40 bytes; 6LoWPAN applies stateless and stateful header compression so packets fit cleanly within the tiny 127-byte MTU of 802.15.4."
              }
            ]
          }
        ]
      },
      {
        id: "itc702-m4",
        moduleNumber: 4,
        title: "Edge to Cloud Protocol",
        lectureHours: 8,
        coMapping: "CO4",
        description: "Application protocols for constrained environments: MQTT (Message Queuing Telemetry Transport), CoAP (Constrained Application Protocol), AMQP, WebSocket, and HTTP comparison.",
        topics: [
          {
            id: "itc702-t4",
            title: "Edge to Cloud Messaging: MQTT vs CoAP",
            shortTitle: "MQTT & CoAP Protocols",
            description: "Deep dive into MQTT packet architecture (CONNECT, PUBLISH, SUBSCRIBE), QoS levels (0, 1, 2), and CoAP RESTful UDP messaging with Observe option.",
            objectives: [
              "Differentiate MQTT (TCP-based pub/sub) from CoAP (UDP-based request/response).",
              "Trace MQTT Quality of Service handshakes: QoS 0 (At most once), QoS 1 (At least once), QoS 2 (Exactly once).",
              "Analyze binary packet overhead: MQTT 2-byte fixed header vs HTTP text headers (800+ bytes)."
            ],
            estimatedDuration: "50 mins",
            difficulty: "Intermediate",
            examWeightage: "Critical (10M)",
            prerequisites: ["Computer Networks: Transport Layer (TCP vs UDP)"],
            coMapping: "CO4",
            visualizerType: "mqtt-flow",
            videos: [
              {
                title: "MQTT Essentials – Part 1: Introduction to MQTT",
                channel: "HiveMQ",
                topic: "Module IV – MQTT messaging protocol",
                url: "https://www.youtube.com/watch?v=jTeJxQFD8Ak",
                youtubeId: "jTeJxQFD8Ak",
                embedUrl: "https://www.youtube.com/embed/jTeJxQFD8Ak",
                duration: "25 mins",
                language: "English"
              },
              {
                title: "CoAP – Constrained Application Protocol Explained",
                channel: "Engineering Funda",
                topic: "Module IV – CoAP protocol",
                url: "https://www.youtube.com/watch?v=zpKJuJs_zfg",
                youtubeId: "zpKJuJs_zfg",
                embedUrl: "https://www.youtube.com/embed/zpKJuJs_zfg",
                duration: "20 mins",
                language: "English"
              },
              {
                title: "Comparison of CoAP and MQTT",
                channel: "Engineering Funda",
                topic: "Module IV – Comparison of IoT application protocols",
                url: "https://www.youtube.com/watch?v=GwrWi9uYjww",
                youtubeId: "GwrWi9uYjww",
                embedUrl: "https://www.youtube.com/embed/GwrWi9uYjww",
                duration: "18 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "MQTT runs over TCP (port 1883/8883); uses 2-byte fixed header; requires persistent connection.",
              "MQTT QoS 0 = Fire & forget; QoS 1 = PUBACK ensures arrival with possible duplicate; QoS 2 = 4-way handshake (PUBLISH -> PUBREC -> PUBREL -> PUBCOMP) guarantees exactly once.",
              "CoAP runs over UDP (port 5683); uses 4-byte header; supports REST methods (GET, POST, PUT, DELETE) for extremely constrained 8-bit microcontrollers.",
              "CoAP Observe option turns request/response into lightweight pub/sub."
            ],
            hinglishSummary: "MQTT TCP par chalta hai aur iska 2-byte header bohot halka hota hai. Isme 3 QoS levels hote hain: QoS 0 (mil gaya toh theek, nahi toh koi baat nahi), QoS 1 (kam se kam ek baar milega), aur QoS 2 (exactly ek baar milega, na kam na zyada). CoAP UDP par chalta hai aur battery bachane ke liye chhota REST protocol hai.",
            textbookRef: "David Hanes, IoT Fundamentals, Chapter 5",
            pyqs: [
              {
                id: "pyq-itc702-4",
                exam: "MU Sem VII Dec 2023",
                marks: 10,
                question: "Explain the architecture of MQTT protocol. Describe MQTT packet format and explain the three Quality of Service (QoS) levels with message exchange diagrams.",
                recurrence: "Repeated 6x in University Exams",
                blueprintAdvice: "Diagram the Publisher -> Broker -> Subscriber architecture. Draw the 3 message sequence charts: QoS 0 (one-way PUBLISH), QoS 1 (PUBLISH + PUBACK), and QoS 2 (PUBLISH -> PUBREC -> PUBREL -> PUBCOMP)."
              }
            ],
            quiz: [
              {
                id: "q-itc702-4",
                question: "In MQTT, which Quality of Service (QoS) level performs a 4-step handshake (PUBLISH, PUBREC, PUBREL, PUBCOMP) to guarantee that the message is delivered exactly once?",
                options: ["QoS 0", "QoS 1", "QoS 2", "QoS 3"],
                correctAnswer: 2,
                explanation: "MQTT QoS 2 implements the four-way handshake protocol to guarantee exactly-once delivery with zero duplicate messages."
              }
            ]
          }
        ]
      },
      {
        id: "itc702-m5",
        moduleNumber: 5,
        title: "IoT and Data Analytics",
        lectureHours: 6,
        coMapping: "CO5",
        description: "Cloud analytics for IoT, challenges in streaming telemetry, data lakes, time-series retention strategies, and real-time dashboard visualization.",
        topics: [
          {
            id: "itc702-t5",
            title: "IoT Data Analytics, Time-Series & Data Lakes",
            shortTitle: "IoT Analytics & Time-Series",
            description: "Examine high-velocity sensor ingestion pipelines, time-series storage engines, stream processing (windowing), and anomaly detection.",
            objectives: [
              "Differentiate Stream Analytics (real-time tumbling/sliding windows) from Batch Analytics (data lakes).",
              "Understand Time-Series Database (TSDB) indexing by timestamp and sensor tags.",
              "Formulate data retention and downsampling strategies for cold telemetry."
            ],
            estimatedDuration: "40 mins",
            difficulty: "Intermediate",
            examWeightage: "High (5M-10M)",
            prerequisites: ["Edge to Cloud Protocol"],
            coMapping: "CO5",
            visualizerType: "none",
            videos: [],
            keyPoints: [
              "IoT generates time-stamped sequential data streams characterized by high volume and uniform frequency.",
              "Tumbling windows slice data into non-overlapping contiguous time intervals (e.g., average temperature every 5 mins).",
              "Hot storage handles real-time alerts; Warm storage feeds analytical dashboards; Cold storage (object stores) archives data for ML training."
            ],
            hinglishSummary: "Sensors har second data bhejte hain jise Time-Series data bolte hain. Is data ko process karne ke liye Stream Analytics use hoti hai jo sliding time windows me average ya anomalies detect karti hai.",
            textbookRef: "Andrew Minteer, Analytics for the Internet of Things, Chapters 3 & 4",
            pyqs: [
              {
                id: "pyq-itc702-5",
                exam: "MU Sem VII May 2023",
                marks: 5,
                question: "Explain the challenges in IoT Data Analytics and describe the role of Time-Series databases in IoT applications.",
                recurrence: "Repeated 3x in Sem VII Papers",
                blueprintAdvice: "List 5 challenges: Velocity, Out-of-order packets, Missing sensor readings, High cardinality tags, and Storage costs. Explain TSDB compression."
              }
            ],
            quiz: [
              {
                id: "q-itc702-5",
                question: "Which type of time window in stream processing evaluates events in fixed, non-overlapping contiguous blocks of time?",
                options: ["Sliding Window", "Tumbling Window", "Session Window", "Moving Average Window"],
                correctAnswer: 1,
                explanation: "Tumbling windows are contiguous, non-overlapping time intervals (e.g. 0-5m, 5-10m) where each event belongs to exactly one window."
              }
            ]
          }
        ]
      },
      {
        id: "itc702-m6",
        moduleNumber: 6,
        title: "IoT Application Design",
        lectureHours: 4,
        coMapping: "CO6",
        description: "Prototyping IoT and M2M solutions, case studies: Smart Home, Smart Cities (Parking, Lighting), Smart Agriculture, IIoT, and Internet of Behavior (IoB).",
        topics: [
          {
            id: "itc702-t6",
            title: "IoT Case Studies: Smart Home, Agriculture & Smart City",
            shortTitle: "Smart Home & Smart City Design",
            description: "Synthesize full-stack design for real-world deployments: Smart Irrigation (soil moisture sensors, weather API, solenoid valves) and Smart City Street Lighting.",
            objectives: [
              "Design an end-to-end Smart Agriculture telemetry and automated actuation system.",
              "Analyze IIoT (Industrial IoT) predictive maintenance architectures.",
              "Understand Internet of Behavior (IoB) principles and ethical implications."
            ],
            estimatedDuration: "40 mins",
            difficulty: "Foundational",
            examWeightage: "Critical (10M)",
            prerequisites: ["IoT Architecture", "Edge to Cloud Protocol"],
            coMapping: "CO6",
            visualizerType: "none",
            videos: [
              {
                title: "IoT Applications",
                channel: "Engineering Funda",
                topic: "Module VI – IoT application areas and use cases",
                url: "https://www.youtube.com/watch?v=QClt177QsYk",
                youtubeId: "QClt177QsYk",
                embedUrl: "https://www.youtube.com/embed/QClt177QsYk",
                duration: "26 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "Smart Agriculture architecture: Soil moisture + humidity sensors -> NodeMCU -> MQTT Broker -> Cloud Decision Engine -> Solenoid Water Valve Relay.",
              "Smart Street Lighting adjusts LED lux levels based on ambient LDR sensor and PIR motion detection, saving up to 60% municipal energy.",
              "Industrial IoT (IIoT) requires ruggedized sensors, deterministic latency (TSN), and vibration analysis to predict motor bearing failures before breakdown."
            ],
            hinglishSummary: "Smart Agriculture case study me field me soil moisture sensor lagate hain. Jab mitti ka moisture 30% se niche jata hai, microcontroller MQTT ke zariye cloud ko alert bhejta hai aur relay switch on karke pani ka pump start kar deta hai.",
            textbookRef: "Bahga & Madisetti, Chapters 9 & 10",
            pyqs: [
              {
                id: "pyq-itc702-6",
                exam: "MU Sem VII Dec 2023",
                marks: 10,
                question: "Design an end-to-end IoT system for Smart Agriculture / Irrigation. Specify sensors, microcontroller, communication protocol, cloud platform, and actuation mechanism with a neat architectural diagram.",
                recurrence: "Repeated 6x in University Exams",
                blueprintAdvice: "Draw 4-tier diagram: Sensing (Soil Moisture, Temp/Humidity), Gateway (ESP32), Communication (MQTT/WiFi or LoRaWAN), Cloud/Actuation (AWS IoT Core, Dashboard, Water Pump Relay)."
              }
            ],
            quiz: [
              {
                id: "q-itc702-6",
                question: "In designing an autonomous smart irrigation system, which sensor is directly utilized to monitor soil water content for trigger actuation?",
                options: ["PIR Motion Sensor", "Capacitive / Resistive Soil Moisture Sensor", "LDR Photoresistor", "Ultrasonic Distance Sensor"],
                correctAnswer: 1,
                explanation: "Soil moisture sensors measure dielectric permittivity or electrical resistance of soil, providing calibrated moisture percentages."
              }
            ]
          }
        ]
      }
    ]
  },

  // 5. Software Testing and QA (ITD07014)
  {
    id: "itd07014",
    code: "ITD07014",
    name: "Software Testing and QA",
    shortName: "STQA",
    semester: "Semester VII",
    university: "University of Mumbai",
    scheme: "Choice Based Credit System (CBCS)",
    description: "Engineering methodologies for software quality: STLC lifecycle, black-box testing (BVA, Equivalence Partitioning), white-box testing (Cyclomatic Complexity, Basis Path), test automation (Selenium), and quality frameworks (McCall, ISO 9000, Six Sigma).",
    totalLectureHours: 39,
    prerequisites: ["Software Engineering", "Programming Fundamentals (Java/Python)", "Object-Oriented Design"],
    syllabusPdfUrl: "/syllabi/STQA_Syllabus.pdf",
    accentColor: "#f59e0b",
    gradient: "from-amber-500 to-orange-600",
    courseOutcomes: [
      { code: "CO1", outcome: "Investigate the reason for bugs and analyze the principles in software testing to prevent and remove bugs.", bloomsLevel: "L1, L2, L3" },
      { code: "CO2", outcome: "Understand various software testing methods and strategies.", bloomsLevel: "L1, L2" },
      { code: "CO3", outcome: "Manage the testing process and testing metrics.", bloomsLevel: "L1, L2, L3" },
      { code: "CO4", outcome: "Understand fundamental concepts of software automation and use automation tools.", bloomsLevel: "L1, L2" },
      { code: "CO5", outcome: "Apply the software testing techniques in real time environment.", bloomsLevel: "L1, L2, L3" },
      { code: "CO6", outcome: "Use practical knowledge of a variety of ways to test software and quality attributes.", bloomsLevel: "L1, L2" },
    ],
    textbooks: [
      "Naresh Chauhan, 'Software Testing Principles and Practices', Oxford Higher Education.",
      "Kshirasagar Naik, Priyadarshi Tripathy, 'Software Testing and Quality Assurance: Theory and Practice', Wiley Publication."
    ],
    references: [
      "William E. Perry, 'Effective Methods for Software Testing', 3rd Ed., Wiley.",
      "Nageswara Rao Pusuluri, 'Software Testing Concepts and Tools', Dreamtech Press."
    ],
    modules: [
      {
        id: "itd07014-m1",
        moduleNumber: 1,
        title: "Testing Methodology",
        lectureHours: 7,
        coMapping: "CO1",
        description: "Goals of software testing, verification vs validation, error/fault/failure definitions, software testing life cycle (STLC), and V-model.",
        topics: [
          {
            id: "itd07014-t1",
            title: "Software Testing Life Cycle (STLC) & Verification vs Validation",
            shortTitle: "STLC & V-Model",
            description: "Understand the phased STLC methodology (Requirement Analysis, Test Planning, Test Case Design, Environment Setup, Test Execution, Closure) and V-Model mapping.",
            objectives: [
              "Differentiate Error (human mistake), Bug/Defect (code flaw), and Failure (runtime deviation).",
              "Contrast Verification ('Are we building the product right?') with Validation ('Are we building the right product?').",
              "Trace the V-Model pairing between development levels and testing phases."
            ],
            estimatedDuration: "45 mins",
            difficulty: "Foundational",
            examWeightage: "Critical (10M)",
            prerequisites: ["Software Engineering Concepts"],
            coMapping: "CO1",
            visualizerType: "stlc-lifecycle",
            videos: [
              {
                title: "Software Testing Life Cycle (STLC)",
                channel: "Software Testing Mentor",
                topic: "Module I – Testing methodology and STLC",
                url: "https://www.youtube.com/watch?v=Kf-XaEkvPLw",
                youtubeId: "Kf-XaEkvPLw",
                embedUrl: "https://www.youtube.com/embed/Kf-XaEkvPLw",
                duration: "30 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "Verification is static testing without executing code (reviews, walkthroughs, inspections).",
              "Validation is dynamic testing executing code against requirements (Unit, Integration, System, UAT).",
              "STLC Entry & Exit criteria ensure objective phase gate reviews.",
              "V-Model links: Requirements -> UAT, System Specs -> System Testing, Architecture -> Integration Testing, Module Design -> Unit Testing."
            ],
            hinglishSummary: "Verification me bina code run kiye documents aur code review karte hain ('Kya hum product sahi bana rahe hain?'). Validation me actual code chala kar check karte hain ('Kya hum sahi product bana rahe hain?'). STLC me Requirement se shuru hokar Test Closure tak 6 stages hote hain.",
            textbookRef: "Naresh Chauhan, Software Testing, Chapter 1 & 2",
            pyqs: [
              {
                id: "pyq-itd07014-1",
                exam: "MU Sem VII Dec 2023",
                marks: 10,
                question: "Explain the Software Testing Life Cycle (STLC) with all its phases, entry and exit criteria, and deliverables. Contrast Verification and Validation.",
                recurrence: "Repeated 6x in University Exams",
                blueprintAdvice: "Draw the STLC chevron diagram: Requirements Analysis -> Test Planning -> Test Case Design -> Environment Setup -> Test Execution -> Test Closure. List concrete deliverables for each stage."
              }
            ],
            quiz: [
              {
                id: "q-itd07014-1",
                question: "Which of the following activities is categorized under Software Verification?",
                options: [
                  "Running automated regression test suites",
                  "Formal code inspection and architectural walkthroughs",
                  "Load testing under simulated peak traffic",
                  "User Acceptance Testing (UAT)"
                ],
                correctAnswer: 1,
                explanation: "Verification evaluates artifacts statically without executing code, such as walkthroughs, inspections, and design reviews."
              }
            ]
          }
        ]
      },
      {
        id: "itd07014-m2",
        moduleNumber: 2,
        title: "Testing Techniques",
        lectureHours: 9,
        coMapping: "CO2",
        description: "Black-box testing: Boundary Value Analysis (BVA), Equivalence Class Partitioning (ECP), State Transition, Cause-Effect graphing; White-box testing: Basis Path testing, Cyclomatic Complexity, Mutation testing.",
        topics: [
          {
            id: "itd07014-t2",
            title: "Black-Box Techniques: Boundary Value Analysis & ECP",
            shortTitle: "BVA & Equivalence Partitioning",
            description: "Master input domain partitioning into valid/invalid equivalence classes, and test edge boundary values: min, min+, nom, max-, max, and robust boundaries (min-, max+).",
            objectives: [
              "Identify valid and invalid equivalence classes for input fields.",
              "Apply Single-Fault Assumption for Boundary Value Analysis.",
              "Design optimal test suites minimizing test case redundancy while maintaining 100% defect detection at boundaries."
            ],
            estimatedDuration: "50 mins",
            difficulty: "Intermediate",
            examWeightage: "Critical (10M)",
            prerequisites: ["Testing Methodology"],
            coMapping: "CO2",
            visualizerType: "boundary-value",
            videos: [
              {
                title: "Boundary Value Analysis and Equivalence Partitioning",
                channel: "Guru99",
                topic: "Module II – Black-box test design techniques",
                url: "https://www.youtube.com/watch?v=P1Hv2sUPKeM",
                youtubeId: "P1Hv2sUPKeM",
                embedUrl: "https://www.youtube.com/embed/P1Hv2sUPKeM",
                duration: "25 mins",
                language: "English"
              },
              {
                title: "What is Black Box Testing?",
                channel: "Guru99",
                topic: "Module II – Black-box testing",
                url: "https://www.youtube.com/watch?v=Wi75S5TTfQ0",
                youtubeId: "Wi75S5TTfQ0",
                embedUrl: "https://www.youtube.com/embed/Wi75S5TTfQ0",
                duration: "20 mins",
                language: "English"
              },
              {
                title: "Black Box Testing vs White Box Testing",
                channel: "Software Testing Mentor",
                topic: "Module II – Black-box and white-box testing",
                url: "https://www.youtube.com/watch?v=sfsrH2wZ9qY",
                youtubeId: "sfsrH2wZ9qY",
                embedUrl: "https://www.youtube.com/embed/sfsrH2wZ9qY",
                duration: "22 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "Equivalence Class Partitioning assumes every value inside a partition behaves identically; test only 1 value per partition.",
              "Boundary Value Analysis focuses on borders: programmers frequently make off-by-one errors (e.g. `<` instead of `<=`).",
              "Standard BVA for n variables generates 4n + 1 test cases (min, min+, nom, max-, max).",
              "Robustness testing adds min- and max+ yielding 6n + 1 test cases."
            ],
            hinglishSummary: "BVA me hum boundaries test karte hain kyunki sabse zyada bugs '<' aur '<=' ke chakkar me boundary par hi aate hain. Agar input 1 se 100 hai, toh test cases honge: 1 (min), 2 (min+), 50 (nom), 99 (max-), 100 (max), aur robust testing me 0 aur 101 bhi test karenge.",
            textbookRef: "Naresh Chauhan, Software Testing, Chapter 4",
            pyqs: [
              {
                id: "pyq-itd07014-2",
                exam: "MU Sem VII May 2023",
                marks: 10,
                question: "Design test cases using Equivalence Class Partitioning and Boundary Value Analysis for a software program that accepts a student age between 18 and 60 years. Tabulate all test cases.",
                recurrence: "Repeated 6x in University Exams",
                blueprintAdvice: "Define valid class [18, 60], invalid classes (<18 and >60). Tabulate test cases with Test ID, Input Value, Class type, and Expected Result for 17, 18, 19, 39, 59, 60, 61."
              }
            ],
            quiz: [
              {
                id: "q-itd07014-2",
                question: "For an input variable accepting integers between 1 and 100, which set of values represents standard Boundary Value Analysis (BVA)?",
                options: [
                  "0, 1, 100, 101",
                  "1, 2, 50, 99, 100",
                  "10, 20, 30, 40",
                  "-1, 50, 105"
                ],
                correctAnswer: 1,
                explanation: "Standard BVA checks 5 key values: min (1), min+ (2), nominal (50), max- (99), and max (100)."
              }
            ]
          },
          {
            id: "itd07014-t3",
            title: "White-Box Testing: Basis Path & Cyclomatic Complexity",
            shortTitle: "Cyclomatic Complexity & Basis Path",
            description: "Derive Control Flow Graphs (CFG), compute McCabe's Cyclomatic Complexity V(G) = E - N + 2P, and determine the linearly independent basis path test suite.",
            objectives: [
              "Construct Control Flow Graphs with nodes, directed edges, and decision predicate nodes.",
              "Calculate Cyclomatic Complexity using 3 equivalent formulas (Edges/Nodes, Predicate nodes, Bounded regions).",
              "Trace a linearly independent basis path set guaranteeing 100% branch and statement coverage."
            ],
            estimatedDuration: "50 mins",
            difficulty: "Intermediate",
            examWeightage: "Critical (10M)",
            prerequisites: ["Testing Methodology"],
            coMapping: "CO2",
            visualizerType: "none",
            videos: [
              {
                title: "Control Flow Testing",
                channel: "Video resource listed in university curriculum",
                topic: "Module II – White-box testing and control-flow coverage",
                url: "https://www.youtube.com/watch?v=1uklXlRovX4",
                youtubeId: "1uklXlRovX4",
                embedUrl: "https://www.youtube.com/embed/1uklXlRovX4",
                duration: "25 mins",
                language: "English"
              },
              {
                title: "Data Flow and Mutation Testing",
                channel: "Video resource listed in university curriculum",
                topic: "Module II – Data-flow and mutation testing",
                url: "https://www.youtube.com/watch?v=RR_nEUtwbBA",
                youtubeId: "RR_nEUtwbBA",
                embedUrl: "https://www.youtube.com/embed/RR_nEUtwbBA",
                duration: "28 mins",
                language: "English"
              },
              {
                title: "State Transition Testing",
                channel: "Video resource listed in university curriculum",
                topic: "Module II – State-table and state-transition testing",
                url: "https://www.youtube.com/watch?v=21wOCNHsSU4",
                youtubeId: "21wOCNHsSU4",
                embedUrl: "https://www.youtube.com/embed/21wOCNHsSU4",
                duration: "20 mins",
                language: "English"
              },
              {
                title: "What is Regression Testing?",
                channel: "Guru99",
                topic: "Module II – Regression testing",
                url: "https://www.youtube.com/watch?v=aeu5zacsHsI",
                youtubeId: "aeu5zacsHsI",
                embedUrl: "https://www.youtube.com/embed/aeu5zacsHsI",
                duration: "22 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "Control Flow Graph represents all potential runtime execution paths through source code.",
              "Cyclomatic Complexity formula 1: V(G) = E - N + 2P (Edges - Nodes + 2*Components).",
              "Cyclomatic Complexity formula 2: V(G) = P + 1 (Predicate nodes + 1).",
              "Cyclomatic Complexity formula 3: V(G) = Number of closed regions + 1.",
              "Basis Path Testing guarantees that every line of code and every conditional branch outcome (true/false) is executed at least once."
            ],
            hinglishSummary: "White-box testing me hum code ka Control Flow Graph (CFG) banate hain. McCabe Cyclomatic Complexity V(G) batata hai ki code kitna complex hai aur saare branches cover karne ke liye kam se kam kitne test cases chahiye (V(G) = Predicate nodes + 1).",
            textbookRef: "Naresh Chauhan, Software Testing, Chapter 5",
            pyqs: [
              {
                id: "pyq-itd07014-3",
                exam: "MU Sem VII Dec 2023",
                marks: 10,
                question: "For a given code snippet to find largest of 3 numbers, draw the Control Flow Graph (CFG), calculate Cyclomatic Complexity using 3 methods, and list all linearly independent basis paths.",
                recurrence: "Repeated 5x in University Exams",
                blueprintAdvice: "Write clean CFG with numbered nodes, show calculations V(G) = E - N + 2 = P + 1 = Regions. Then list each path explicitly (e.g. 1-2-3-7, 1-2-4-5-7)."
              }
            ],
            quiz: [
              {
                id: "q-itd07014-3",
                question: "If a connected Control Flow Graph has 14 edges, 11 nodes, and 1 connected component, what is its McCabe Cyclomatic Complexity V(G)?",
                options: ["3", "5", "7", "23"],
                correctAnswer: 1,
                explanation: "V(G) = E - N + 2 = 14 - 11 + 2 = 5 linearly independent execution paths."
              }
            ]
          }
        ]
      },
      {
        id: "itd07014-m3",
        moduleNumber: 3,
        title: "Managing Test Process",
        lectureHours: 8,
        coMapping: "CO3",
        description: "Test organization, test planning according to IEEE 829, test effort estimation (Function Point analysis), defect metrics, and test suite minimization.",
        topics: [
          {
            id: "itd07014-t4",
            title: "Test Planning (IEEE 829) & Defect Metrics",
            shortTitle: "IEEE 829 Test Plan & Metrics",
            description: "Understand the industry standard IEEE 829 Test Plan structure, defect tracking metrics (Defect Density, Defect Removal Efficiency), and test suite minimization techniques.",
            objectives: [
              "Examine the 16 standard sections of IEEE 829 Test Documentation.",
              "Compute Defect Density = Defect Count / Size (KLOC/FP) and Defect Removal Efficiency (DRE).",
              "Apply Test Suite Minimization using concept lattice and greedy heuristics."
            ],
            estimatedDuration: "40 mins",
            difficulty: "Foundational",
            examWeightage: "High (5M-10M)",
            prerequisites: ["Testing Methodology"],
            coMapping: "CO3",
            visualizerType: "none",
            videos: [
              {
                title: "What is a Test Plan?",
                channel: "Guru99",
                topic: "Module III – Test planning and test management",
                url: "https://www.youtube.com/watch?v=Vdm1Lh540LM",
                youtubeId: "Vdm1Lh540LM",
                embedUrl: "https://www.youtube.com/embed/Vdm1Lh540LM",
                duration: "20 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "IEEE 829 specifies: Test plan identifier, Introduction, Test items, Features to be tested, Features not tested, Approach, Item pass/fail criteria, Suspension/Resumption criteria, Deliverables, Environmental needs, Staffing, Schedule, Risks.",
              "Defect Removal Efficiency: DRE = E / (E + D), where E is errors found prior to delivery, and D is defects found by customer.",
              "High DRE (>90%) indicates an effective pre-release quality filter."
            ],
            hinglishSummary: "IEEE 829 ek internationally recognized standard hai jo test plan ka format define karta hai (kya test karna hai, kaun karega, schedule kya hoga). Defect Removal Efficiency (DRE) measure karta hai ki release se pehle humne kitne percent bugs dhoond liye the.",
            textbookRef: "Naresh Chauhan, Software Testing, Chapter 8",
            pyqs: [
              {
                id: "pyq-itd07014-4",
                exam: "MU Sem VII May 2023",
                marks: 10,
                question: "Explain the structure of a Test Plan according to IEEE 829 format. What are software testing metrics? Define Defect Density and Defect Removal Efficiency (DRE).",
                recurrence: "Repeated 4x in Sem VII Papers",
                blueprintAdvice: "List at least 10 sections of IEEE 829. Provide exact mathematical formulas for Defect Density and DRE, and explain how metrics guide test stoppage decisions."
              }
            ],
            quiz: [
              {
                id: "q-itd07014-4",
                question: "If a testing team discovers 180 defects before release, and customers report 20 defects post-release, what is the Defect Removal Efficiency (DRE)?",
                options: ["80%", "89%", "90%", "95%"],
                correctAnswer: 2,
                explanation: "DRE = E / (E + D) = 180 / (180 + 20) = 180 / 200 = 0.90 = 90%."
              }
            ]
          }
        ]
      },
      {
        id: "itd07014-m4",
        moduleNumber: 4,
        title: "Test Automation",
        lectureHours: 5,
        coMapping: "CO4",
        description: "Automation tools need and ROI, categorization, guidelines for tool selection, JIRA, Bugzilla, Selenium WebDriver architecture, and test scripting.",
        topics: [
          {
            id: "itd07014-t5",
            title: "Test Automation & Selenium WebDriver Architecture",
            shortTitle: "Selenium & Automation Frameworks",
            description: "Study test automation ROI criteria, Selenium 4 architecture (W3C WebDriver protocol), locators (XPath, CSS), and Page Object Model (POM) design pattern.",
            objectives: [
              "Evaluate when to automate: high repeatability, regression suites, load testing vs exploratory/ad-hoc testing.",
              "Analyze Selenium WebDriver architecture: Client Bindings -> JSON Wire / W3C Protocol -> Browser Drivers -> Real Browsers.",
              "Construct robust locators using Relative XPath and CSS Selectors."
            ],
            estimatedDuration: "45 mins",
            difficulty: "Intermediate",
            examWeightage: "Critical (10M)",
            prerequisites: ["Testing Methodology"],
            coMapping: "CO4",
            visualizerType: "none",
            videos: [
              {
                title: "What is Selenium? Tutorial for Beginners",
                channel: "Guru99",
                topic: "Module IV – Test automation tools",
                url: "https://www.youtube.com/watch?v=BL4-_tVx2rE",
                youtubeId: "BL4-_tVx2rE",
                embedUrl: "https://www.youtube.com/embed/BL4-_tVx2rE",
                duration: "25 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "Do not automate tests that run only once or user interfaces under rapid redesign.",
              "Selenium 4 communicates directly with browser drivers via standard W3C WebDriver specification over HTTP.",
              "Page Object Model (POM) separates UI locators from test logic, minimizing test maintenance when frontends change.",
              "Explicit waits check expected conditions dynamically rather than using brittle thread sleeps."
            ],
            hinglishSummary: "Selenium automate karta hai browser testing ko. Har naye build me manual regression test karne ke bajaye script khud login, form fill, aur assert karti hai. Page Object Model (POM) use karne se agar button ka ID badal bhi jaye, toh sirf ek file me change karna padta hai.",
            textbookRef: "Naresh Chauhan, Software Testing, Chapter 13",
            pyqs: [
              {
                id: "pyq-itd07014-5",
                exam: "MU Sem VII Dec 2023",
                marks: 10,
                question: "Explain the architecture of Selenium WebDriver with a neat diagram. Write a sample Selenium test script to automate user login verification.",
                recurrence: "Repeated 5x in University Exams",
                blueprintAdvice: "Draw: Language Bindings (Java/Python) -> W3C WebDriver Protocol -> Drivers (ChromeDriver, GeckoDriver) -> Browsers. Write script showing driver instantiation, findElement by xpath, sendKeys, click, and assertion."
              }
            ],
            quiz: [
              {
                id: "q-itd07014-5",
                question: "In Selenium test automation design, what is the primary benefit of adopting the Page Object Model (POM)?",
                options: [
                  "It allows tests to execute without opening a real browser",
                  "It separates test verification scripts from page web element locators for maintainability",
                  "It automatically generates test data",
                  "It removes the need for browser drivers"
                ],
                correctAnswer: 1,
                explanation: "Page Object Model encapsulates page locators and user actions within page classes, so UI changes only require updates in one place."
              }
            ]
          }
        ]
      },
      {
        id: "itd07014-m5",
        moduleNumber: 5,
        title: "Testing for Specialized Environment",
        lectureHours: 4,
        coMapping: "CO5",
        description: "Agile testing lifecycle, testing in Scrum phases, testing web-based systems, cloud testing, mobile testing, and IoT testing challenges.",
        topics: [
          {
            id: "itd07014-t6",
            title: "Agile Testing, Scrum & Specialized Web/Cloud Environments",
            shortTitle: "Agile Testing & Specialized QA",
            description: "Understand the shift-left testing paradigm in Agile/Scrum sprints, Agile Testing Quadrants, Continuous Integration/Continuous Testing, and cross-browser cloud testing.",
            objectives: [
              "Analyze the 4 Agile Testing Quadrants (Brian Marick framework).",
              "Trace tester participation in Scrum ceremonies (Sprint Planning, Daily Standup, Sprint Retrospective).",
              "Identify testing challenges in web, mobile, and cloud-native applications."
            ],
            estimatedDuration: "40 mins",
            difficulty: "Foundational",
            examWeightage: "High (5M-10M)",
            prerequisites: ["Testing Methodology"],
            coMapping: "CO5",
            visualizerType: "none",
            videos: [
              {
                title: "What is Agile Testing?",
                channel: "Software Testing Mentor",
                topic: "Module V – Agile testing and Scrum",
                url: "https://www.youtube.com/watch?v=hYpx8l7KgAs",
                youtubeId: "hYpx8l7KgAs",
                embedUrl: "https://www.youtube.com/embed/hYpx8l7KgAs",
                duration: "20 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "In Agile, testing is not a separate sequential phase; testers collaborate with developers from Day 1 (Shift-Left).",
              "Q1 (Unit/Component tests - technology facing), Q2 (Story tests/Prototypes - business facing), Q3 (Exploratory/Usability - critique product), Q4 (Performance/Security - critique product).",
              "Continuous Testing integrates automated test suites into CI/CD pipelines (GitHub Actions, Jenkins) on every git commit."
            ],
            hinglishSummary: "Agile testing me testing aakhri mahine ka intezar nahi karti; har 2-week ke sprint me development ke saath-saath testing chalti hai (Shift-Left). Tester user stories ke acceptance criteria banata hai aur CI/CD pipeline me automated tests run karta hai.",
            textbookRef: "Naresh Chauhan, Software Testing, Chapter 15",
            pyqs: [
              {
                id: "pyq-itd07014-6",
                exam: "MU Sem VII May 2023",
                marks: 5,
                question: "Explain the Agile Testing Life Cycle and describe the four Agile Testing Quadrants with their objectives.",
                recurrence: "Repeated 4x in Sem VII Papers",
                blueprintAdvice: "Draw the 2x2 matrix: Technology-Facing vs Business-Facing, and Supporting the Team vs Critiquing the Product. Explain Q1 to Q4."
              }
            ],
            quiz: [
              {
                id: "q-itd07014-6",
                question: "In the Agile Testing Quadrants framework, which quadrant contains automated unit and component tests that are technology-facing and support the development team?",
                options: ["Quadrant 1 (Q1)", "Quadrant 2 (Q2)", "Quadrant 3 (Q3)", "Quadrant 4 (Q4)"],
                correctAnswer: 0,
                explanation: "Quadrant 1 consists of unit tests and component tests written by developers and testers to drive good technical design."
              }
            ]
          }
        ]
      },
      {
        id: "itd07014-m6",
        moduleNumber: 6,
        title: "Quality Management",
        lectureHours: 4,
        coMapping: "CO6",
        description: "Software Quality Management, McCall's quality factors, ISO 9000:2000 principles, Six Sigma methodology (DMAIC), and Total Quality Management.",
        topics: [
          {
            id: "itd07014-t7",
            title: "McCall's Quality Factors, ISO 9000 & Six Sigma",
            shortTitle: "Quality Models & Six Sigma",
            description: "Study McCall's 11 quality factors grouped into 3 operational perspectives (Product Operation, Revision, Transition), and Six Sigma DMAIC defect reduction (3.4 DPMO).",
            objectives: [
              "Categorize McCall's 11 quality factors into Product Operation, Product Revision, and Product Transition.",
              "Explain the 5 phases of Six Sigma DMAIC: Define, Measure, Analyze, Improve, Control.",
              "Contrast Quality Assurance (process oriented) with Quality Control (product oriented)."
            ],
            estimatedDuration: "40 mins",
            difficulty: "Foundational",
            examWeightage: "High (5M-10M)",
            prerequisites: ["Testing Methodology"],
            coMapping: "CO6",
            visualizerType: "none",
            videos: [
              {
                title: "Software Quality Assurance",
                channel: "Video resource listed in university curriculum",
                topic: "Module VI – Software quality management",
                url: "https://www.youtube.com/watch?v=KqDlDubS-OU",
                youtubeId: "KqDlDubS-OU",
                embedUrl: "https://www.youtube.com/embed/KqDlDubS-OU",
                duration: "25 mins",
                language: "English"
              }
            ],
            keyPoints: [
              "McCall Product Operation: Correctness, Reliability, Efficiency, Integrity, Usability.",
              "McCall Product Revision: Maintainability, Flexibility, Testability.",
              "McCall Product Transition: Portability, Reusability, Interoperability.",
              "Six Sigma targets a defect rate of no more than 3.4 Defects Per Million Opportunities (DPMO).",
              "DMAIC framework: Define problem -> Measure baseline -> Analyze root causes -> Improve process -> Control gains."
            ],
            hinglishSummary: "McCall's Model software quality ko teen angles se dekhta hai: Operation (kya product sahi chal raha hai?), Revision (kya product me changes asani se ho sakte hain?), aur Transition (kya product doosre system par asani se shift ho sakta hai?). Six Sigma ka target hota hai 99.99966% defect-free output (3.4 defects per million).",
            textbookRef: "Naresh Chauhan, Software Testing, Chapter 16",
            pyqs: [
              {
                id: "pyq-itd07014-7",
                exam: "MU Sem VII Dec 2023",
                marks: 10,
                question: "Explain McCall's Quality Factors in detail. Categorize all 11 factors into Product Operation, Product Revision, and Product Transition with examples.",
                recurrence: "Repeated 5x in University Exams",
                blueprintAdvice: "Draw the McCall quality factor tree. Define all 11 factors clearly and explain how metrics map to high-level factors."
              }
            ],
            quiz: [
              {
                id: "q-itd07014-7",
                question: "In McCall's Quality Model, which of the following quality factors belongs to the 'Product Revision' category?",
                options: ["Usability", "Maintainability", "Portability", "Correctness"],
                correctAnswer: 1,
                explanation: "Maintainability (effort required to locate and fix errors) is a core Product Revision factor along with Flexibility and Testability."
              }
            ]
          }
        ]
      }
    ]
  }
];

// Helper functions for state and progress
export function getSubjectByCode(code: string): Subject | undefined {
  return ATLAS_SUBJECTS.find(s => s.code.toLowerCase() === code.toLowerCase() || s.id.toLowerCase() === code.toLowerCase());
}

export function getTopicById(topicId: string): { subject: Subject; module: Module; topic: Topic } | undefined {
  for (const subject of ATLAS_SUBJECTS) {
    for (const module of subject.modules) {
      for (const topic of module.topics) {
        if (topic.id === topicId) {
          return { subject, module, topic };
        }
      }
    }
  }
  return undefined;
}

