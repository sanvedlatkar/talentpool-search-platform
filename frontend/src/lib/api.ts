/**
 * API service layer for TalentPulse platform.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface Candidate {
  id: string;
  name: string;
  current_title: string;
  location?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  github_url?: string;
  experience_years?: number;
  raw_json?: any;
}

export interface CandidateDetail extends Candidate {
  skills: string[];
  projects: Array<{
    project_name: string;
    description?: string;
    technologies: string[];
  }>;
  certifications: Array<{
    certification_name: string;
    provider: string;
    status: string;
  }>;
  experience: Array<{
    company: string;
    role: string;
    duration?: string;
    description?: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year?: string;
  }>;
}

export const getCandidates = async (): Promise<Candidate[]> => {
  // FIX: removed mock data fallback — throw so UI shows real error
  const response = await fetch(`${API_BASE_URL}/candidates`);
  if (!response.ok) throw new Error(`Failed to fetch candidates: ${response.status}`);
  return await response.json();
};

export const getCandidate = async (id: string): Promise<{
  candidate: Candidate;
  skills: any[];
  projects: any[];
  certifications: any[];
  experience: any[];
  education: any[];
}> => {
  // FIX: removed mock data fallback — throw so UI shows real error
  // FIX: added experience and education to return type
  const response = await fetch(`${API_BASE_URL}/candidate/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch candidate: ${response.status}`);
  return await response.json();
};

export const searchCandidates = async (
  skill?: string,
  minExperience?: string,
  location?: string
): Promise<Candidate[]> => {
  // FIX: added min_experience and location params to match your API
  const params = new URLSearchParams();
  if (skill)         params.set('skill', skill);
  if (minExperience) params.set('min_experience', minExperience);
  if (location)      params.set('location', location);

  const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`);
  if (!response.ok) throw new Error(`Search failed: ${response.status}`);
  return await response.json();
};

export const generateUploadUrl = async (
  fileName: string,
  contentType: string
): Promise<{ candidate_id: string; upload_url: string; s3_key: string }> => {
  const response = await fetch(`${API_BASE_URL}/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_name: fileName, content_type: contentType })
  });
  if (!response.ok) throw new Error(`Failed to get upload URL: ${response.status}`);
  return await response.json();
};

export const completeUpload = async (
  candidateId: string,
  s3Key: string
): Promise<{ status: string }> => {
  const response = await fetch(`${API_BASE_URL}/upload-complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidate_id: candidateId, s3_key: s3Key })
  });
  if (!response.ok) throw new Error(`Failed to complete upload: ${response.status}`);
  return await response.json();
};