import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import { createClient } from "@supabase/supabase-js";
import { 
  users, academicProfiles, subjects, resources, 
  knowledgeGraphNodes, pyqQuestions, flashcards, studySessions,
  studentModels, studentTopicProfiles
} from "./schema";

const supabase = createClient(
  process.env.SUPABASE_URL || "", 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "", 
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const client = postgres(process.env.DATABASE_URL || "", { max: 1 });
const db = drizzle(client);

async function seed() {
  console.log("🌱 Starting database seed...");

  const email = "demo@aisemos.com";
  const password = "DemoPass123!";

  // 1. Create User in Supabase Auth
  let authUserId;
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      if (authError.message.includes("already")) {
        console.log("User already exists in auth, fetching...");
        const { data: usersData } = await supabase.auth.admin.listUsers();
        authUserId = usersData.users.find(u => u.email === email)?.id;
      } else {
        throw authError;
      }
    } else {
      authUserId = authData.user.id;
    }
  } catch (error) {
    console.error("⚠️ Could not create auth user. Ensure SUPABASE_SERVICE_ROLE_KEY is set.", error);
    // Fallback dummy ID for local development without Supabase Admin privileges
    authUserId = "11111111-1111-1111-1111-111111111111"; 
  }

  // 2. Create User Record in Database
  const [user] = await db.insert(users).values({
    email,
    authId: authUserId
  }).onConflictDoUpdate({
    target: users.email,
    set: { authId: authUserId }
  }).returning();

  // 3. Create Academic Profile (Mumbai Univ, IT, Sem VII)
  const [profile] = await db.insert(academicProfiles).values({
    userId: user.id,
    university: "Mumbai University",
    branch: "Information Technology",
    semester: 7
  }).returning();

  // 4. Create Subjects
  const subjectNames = [
    "Enterprise Network Design",
    "IT Service Management",
    "Artificial Intelligence",
    "Cyber Security and Laws"
  ];

  const createdSubjects = [];
  for (const name of subjectNames) {
    const [sub] = await db.insert(subjects).values({
      userId: user.id,
      academicProfileId: profile.id,
      name,
      examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    }).returning();
    createdSubjects.push(sub);
  }

  // 5. Create Student Model
  await db.insert(studentModels).values({
    userId: user.id,
    academicHealthScore: 78.5,
    learningPace: 'standard',
    preferredStyle: 'visual',
    preferredAnswerLength: 'medium'
  }).onConflictDoNothing();

  // 6. Populate a Subject fully (Artificial Intelligence)
  const aiSubject = createdSubjects.find(s => s.name === "Artificial Intelligence");

  if (aiSubject) {
    // 6.1 Resource
    const [resource] = await db.insert(resources).values({
      userId: user.id,
      subjectId: aiSubject.id,
      filename: "information-technology-engineering-syllabus-sem-vii-mumbai-university.pdf",
      storageUrl: "https://example.com/syllabus.pdf",
      fileType: "pdf",
      sha256Hash: "dummysha256" + Date.now(),
      status: "ready"
    }).returning();

    // 6.2 Knowledge Graph Nodes
    const topics = ["Search Algorithms", "Neural Networks", "Expert Systems", "Fuzzy Logic"];
    const kgNodes = [];
    for (const topic of topics) {
      const [node] = await db.insert(knowledgeGraphNodes).values({
        userId: user.id,
        subjectId: aiSubject.id,
        nodeType: 'topic',
        label: topic,
        sourceResourceId: resource.id
      }).returning();
      kgNodes.push(node);
      
      // Student Topic Profile
      await db.insert(studentTopicProfiles).values({
        userId: user.id,
        subjectId: aiSubject.id,
        topic,
        confidence: topic === "Neural Networks" ? 40 : 85,
        weakFlag: topic === "Neural Networks" ? "weak" : "none"
      }).onConflictDoNothing();
    }

    // 6.3 PYQs
    await db.insert(pyqQuestions).values([
      {
        userId: user.id,
        subjectId: aiSubject.id,
        resourceId: resource.id,
        questionText: "Explain the A* search algorithm with an example.",
        markValue: 10,
        examYear: "2023",
        unitHeader: "Search",
        priorityLabel: "High",
        repeatCount: 4,
        knowledgeNodeId: kgNodes[0].id
      },
      {
        userId: user.id,
        subjectId: aiSubject.id,
        resourceId: resource.id,
        questionText: "Differentiate between Forward and Backward Chaining.",
        markValue: 5,
        examYear: "2022",
        priorityLabel: "Medium",
        repeatCount: 2,
        knowledgeNodeId: kgNodes[2].id
      }
    ]);

    // 6.4 Flashcards
    await db.insert(flashcards).values([
      {
        userId: user.id,
        subjectId: aiSubject.id,
        sourceResourceId: resource.id,
        sourceChunkIndex: 1,
        cardType: 'concept',
        front: "What is a heuristic function?",
        back: "A function that estimates the cost to reach the goal state from a given node.",
        intervalDays: 3,
        easeFactor: 2.5,
        dueDate: new Date(Date.now() - 24*60*60*1000).toISOString() // Overdue
      },
      {
        userId: user.id,
        subjectId: aiSubject.id,
        sourceResourceId: resource.id,
        sourceChunkIndex: 2,
        cardType: 'basic',
        front: "Who proposed the Turing Test?",
        back: "Alan Turing in 1950.",
        intervalDays: 1,
        easeFactor: 2.3,
        dueDate: new Date().toISOString() // Due today
      }
    ]);

    // 6.5 Study Session
    await db.insert(studySessions).values({
      userId: user.id,
      subjectId: aiSubject.id,
      goalMode: "study",
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      endedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      durationSecs: 1800,
      topicsCovered: ["Search Algorithms"],
      questionsAsked: 5,
      weakConcepts: ["Heuristic Admissibility"]
    });
  }

  console.log("✅ Seed complete!");
  console.log("-----------------------------------------");
  console.log("Login ID:", email);
  console.log("Password:", password);
  console.log("-----------------------------------------");
  process.exit(0);
}

seed().catch(console.error);
