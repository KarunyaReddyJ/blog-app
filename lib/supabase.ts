import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);
export const hasSupabaseAdminEnv = Boolean(supabaseUrl && supabaseServiceRoleKey);

// Lazy initialize clients to prevent errors during build
let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (!supabaseInstance && supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

function getSupabaseAdmin(): SupabaseClient | null {
  if (!supabaseAdminInstance && supabaseUrl && supabaseServiceRoleKey) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey);
  }
  return supabaseAdminInstance;
}

export const supabase = new Proxy({} as Record<string, unknown>, {
  get: (target: Record<string, unknown>, prop: string | symbol) => {
    const client = getSupabase();
    if (!client) {
      throw new Error('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    return (client as unknown as Record<string | symbol, unknown>)[prop];
  },
}) as unknown as SupabaseClient;

export const supabaseAdmin = new Proxy({} as Record<string, unknown>, {
  get: (target: Record<string, unknown>, prop: string | symbol) => {
    const client = getSupabaseAdmin();
    if (!client) {
      throw new Error('Supabase admin not configured. Set SUPABASE_SERVICE_ROLE_KEY');
    }
    return (client as unknown as Record<string | symbol, unknown>)[prop];
  },
}) as unknown as SupabaseClient;

export interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: Record<string, unknown> | null;
  cover_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
  author_id: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  view_count: number;
  like_count: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface PostTag {
  post_id: number;
  tag_id: number;
}

export interface PostLike {
  id: number;
  post_id: number;
  user_id: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface PostView {
  id: number;
  post_id: number;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface PostComment {
  id: number;
  post_id: number;
  parent_id: number | null;
  author_name: string;
  author_email: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}
