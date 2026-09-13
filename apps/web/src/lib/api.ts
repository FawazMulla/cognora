import { supabase } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers = new Headers(options.headers);
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  
  const byokKey = localStorage.getItem('byok_gemini_key');
  if (byokKey) {
    headers.set('x-api-key', byokKey);
  }

  const cohereKey = localStorage.getItem('byok_cohere_key');
  if (cohereKey) {
    headers.set('x-cohere-key', cohereKey);
  }

  const preferredProvider = localStorage.getItem('byok_provider') || 'gemini';
  headers.set('x-preferred-provider', preferredProvider);
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}
