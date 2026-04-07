import { cache } from 'react';
import { hasSupabaseAdminEnv, hasSupabaseEnv, supabase, supabaseAdmin } from '@/lib/supabase';

export interface SiteProfile {
  id: number;
  full_name: string;
  headline: string;
  short_bio: string;
  long_bio: string | null;
  location: string | null;
  email: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  x_url: string | null;
  focus_areas: string[];
  current_interests: string[];
  updated_at: string;
}

export interface SiteResume {
  id: number;
  title: string;
  summary: string;
  resume_url: string | null;
  highlights: string[];
  updated_at: string;
}

const defaultProfile: SiteProfile = {
  id: 1,
  full_name: 'Your Name',
  headline: 'Backend engineer building reliable systems and thoughtful software.',
  short_bio:
    'I write about backend engineering, APIs, distributed systems, debugging, and the tradeoffs that shape real software.',
  long_bio:
    'This site is my personal space for sharing technical notes, project lessons, architecture decisions, and the ideas I keep coming back to while building software.',
  location: null,
  email: null,
  github_url: null,
  linkedin_url: null,
  x_url: null,
  focus_areas: ['Backend systems', 'APIs', 'Distributed systems'],
  current_interests: ['System design', 'Developer tooling', 'Reliability engineering'],
  updated_at: new Date(0).toISOString(),
};

const defaultResume: SiteResume = {
  id: 1,
  title: 'Resume',
  summary: 'A snapshot of my work, interests, and experience as an engineer.',
  resume_url: null,
  highlights: ['Systems thinking', 'Backend engineering', 'Debugging complex issues'],
  updated_at: new Date(0).toISOString(),
};

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function mapProfile(input: Partial<SiteProfile> | null | undefined): SiteProfile {
  if (!input) {
    return defaultProfile;
  }

  return {
    ...defaultProfile,
    ...input,
    focus_areas: normalizeStringArray(input.focus_areas),
    current_interests: normalizeStringArray(input.current_interests),
  };
}

function mapResume(input: Partial<SiteResume> | null | undefined): SiteResume {
  if (!input) {
    return defaultResume;
  }

  return {
    ...defaultResume,
    ...input,
    highlights: normalizeStringArray(input.highlights),
  };
}

export const getSiteProfile = cache(async (): Promise<SiteProfile> => {
  if (!hasSupabaseEnv) {
    return defaultProfile;
  }

  const { data } = await supabase.from('site_profile').select('*').eq('id', 1).maybeSingle();
  return mapProfile((data as Partial<SiteProfile> | null) || null);
});

export const getSiteResume = cache(async (): Promise<SiteResume> => {
  if (!hasSupabaseEnv) {
    return defaultResume;
  }

  const { data } = await supabase.from('site_resume').select('*').eq('id', 1).maybeSingle();
  return mapResume((data as Partial<SiteResume> | null) || null);
});

export async function saveSiteProfile(input: {
  full_name: string;
  headline: string;
  short_bio: string;
  long_bio?: string | null;
  location?: string | null;
  email?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  x_url?: string | null;
  focus_areas?: string[];
  current_interests?: string[];
}) {
  if (!hasSupabaseAdminEnv) throw new Error('Service role key not configured');

  const payload = {
    id: 1,
    ...input,
    full_name: input.full_name.trim(),
    headline: input.headline.trim(),
    short_bio: input.short_bio.trim(),
    long_bio: input.long_bio?.trim() || null,
    location: input.location?.trim() || null,
    email: input.email?.trim() || null,
    github_url: input.github_url?.trim() || null,
    linkedin_url: input.linkedin_url?.trim() || null,
    x_url: input.x_url?.trim() || null,
    focus_areas: (input.focus_areas || []).map((item) => item.trim()).filter(Boolean),
    current_interests: (input.current_interests || []).map((item) => item.trim()).filter(Boolean),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin.from('site_profile').upsert(payload).select().single();
  if (error) throw error;
  return mapProfile(data as Partial<SiteProfile>);
}

export async function saveSiteResume(input: {
  title: string;
  summary: string;
  resume_url?: string | null;
  highlights?: string[];
}) {
  if (!hasSupabaseAdminEnv) throw new Error('Service role key not configured');

  const payload = {
    id: 1,
    title: input.title.trim(),
    summary: input.summary.trim(),
    resume_url: input.resume_url?.trim() || null,
    highlights: (input.highlights || []).map((item) => item.trim()).filter(Boolean),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin.from('site_resume').upsert(payload).select().single();
  if (error) throw error;
  return mapResume(data as Partial<SiteResume>);
}
