import { getAccessToken } from "./secure-storage";

// Default to localhost for web, 10.0.2.2 for android emulator, etc.
// In a real device you need the local network IP.
const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000/api";

async function getHeaders() {
  const token = await getAccessToken();
  return {
    "Content-Type": "application/json",
    // Mock user for testing, in reality this comes from Clerk/Supabase auth token
    "x-user-id": token || "test-user-id", 
  };
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = await getHeaders();
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Specific fetchers for TanStack Query
export const fetchStudentModel = () => fetchApi<any>("/student-model");
export const fetchSubjects = () => fetchApi<any>("/subjects");
export const fetchSubjectAnalytics = (id: string) => fetchApi<any>(`/subjects/${id}/analytics`);
export const generateHomework = (data: any) => fetchApi<any>("/homework/generate", { method: "POST", body: JSON.stringify(data) });
export const generateAnswer = (data: any) => fetchApi<any>("/answers/generate", { method: "POST", body: JSON.stringify(data) });
export const optimizeAnswer = (data: any) => fetchApi<any>("/answers/optimize", { method: "POST", body: JSON.stringify(data) });
export const generatePractical = (data: any) => fetchApi<any>("/practicals/generate", { method: "POST", body: JSON.stringify(data) });
export const generateVivaQuestion = (data: any) => fetchApi<any>("/viva/generate", { method: "POST", body: JSON.stringify(data) });
export const evaluateVivaAnswer = (data: any) => fetchApi<any>("/viva/evaluate", { method: "POST", body: JSON.stringify(data) });
