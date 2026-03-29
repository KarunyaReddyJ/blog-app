import { cache } from 'react';
import { generateSlug } from './auth';
import { getReadingTimeMinutes } from './content';
import {
  hasSupabaseAdminEnv,
  hasSupabaseEnv,
  type Post,
  type Tag,
  supabase,
  supabaseAdmin,
} from './supabase';

export type PostSort = 'recent' | 'liked' | 'viewed';

export interface PostWithTags extends Post {
  tags: Tag[];
  readingTime: number;
}

function mapTags(input: unknown): Tag[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      const record = item as { tags?: Tag | null };
      return record.tags;
    })
    .filter((tag): tag is Tag => Boolean(tag));
}

function mapPost(input: Post & { post_tags?: unknown }): PostWithTags {
  return {
    ...input,
    tags: mapTags(input.post_tags),
    readingTime: getReadingTimeMinutes(input.content),
  };
}

function compareBySort(sort: PostSort) {
  if (sort === 'liked') {
    return (a: PostWithTags, b: PostWithTags) =>
      b.like_count - a.like_count || Date.parse(b.created_at) - Date.parse(a.created_at);
  }

  if (sort === 'viewed') {
    return (a: PostWithTags, b: PostWithTags) =>
      b.view_count - a.view_count || Date.parse(b.created_at) - Date.parse(a.created_at);
  }

  return (a: PostWithTags, b: PostWithTags) =>
    Date.parse(b.published_at || b.created_at) - Date.parse(a.published_at || a.created_at);
}

export const getPublishedPosts = cache(async ({
  limit = 24,
  tag,
  sort = 'recent',
}: {
  limit?: number;
  tag?: string;
  sort?: PostSort;
} = {}): Promise<PostWithTags[]> => {
  if (!hasSupabaseEnv) return [];

  const { data, error } = await supabase
    .from('posts')
    .select('*, post_tags(tags(*))')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Failed to load published posts:', error);
    return [];
  }

  const posts = ((data as Array<Post & { post_tags?: unknown }>) || []).map(mapPost);
  const filtered = tag
    ? posts.filter((post) => post.tags.some((postTag) => postTag.slug === tag))
    : posts;

  return filtered.sort(compareBySort(sort)).slice(0, limit);
});

export const getPublishedPostBySlug = cache(async (slug: string): Promise<PostWithTags | null> => {
  if (!hasSupabaseEnv) return null;

  const { data, error } = await supabase
    .from('posts')
    .select('*, post_tags(tags(*))')
    .eq('slug', slug)
    .not('published_at', 'is', null)
    .single();

  if (error) {
    return null;
  }

  return mapPost(data as Post & { post_tags?: unknown });
});

export const getPublishedPostSlugs = cache(async (): Promise<string[]> => {
  if (!hasSupabaseEnv) return [];

  const { data, error } = await supabase
    .from('posts')
    .select('slug')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false });

  if (error) {
    return [];
  }

  return (data || [])
    .map((item) => (item as { slug?: string }).slug || '')
    .filter(Boolean);
});

export async function getAllPublicTags(): Promise<Tag[]> {
  if (!hasSupabaseEnv) return [];

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Failed to load tags:', error);
    return [];
  }

  return (data as Tag[]) || [];
}

export async function getAdminPosts(userId: string): Promise<PostWithTags[]> {
  if (!hasSupabaseAdminEnv) return [];

  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('*, post_tags(tags(*))')
    .eq('author_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data as Array<Post & { post_tags?: unknown }>) || []).map(mapPost);
}

export async function getAdminPostById(id: number, userId: string): Promise<PostWithTags | null> {
  if (!hasSupabaseAdminEnv) return null;

  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('*, post_tags(tags(*))')
    .eq('id', id)
    .eq('author_id', userId)
    .single();

  if (error) {
    return null;
  }

  return mapPost(data as Post & { post_tags?: unknown });
}

export async function syncPostTags(postId: number, rawTags: string[]) {
  if (!hasSupabaseAdminEnv) return [];

  const normalizedTags = [...new Set(rawTags.map((tag) => tag.trim()).filter(Boolean))];
  const slugs = normalizedTags.map((tag) => generateSlug(tag));

  const { data: existingTags, error: existingTagsError } = await supabaseAdmin
    .from('tags')
    .select('*')
    .in('slug', slugs);

  if (existingTagsError) {
    throw existingTagsError;
  }

  const knownTags = (existingTags as Tag[]) || [];
  const knownSlugs = new Set(knownTags.map((tag) => tag.slug));

  const missingTags = normalizedTags
    .map((name) => ({ name, slug: generateSlug(name) }))
    .filter((tag) => !knownSlugs.has(tag.slug));

  let createdTags: Tag[] = [];
  if (missingTags.length > 0) {
    const { data, error } = await supabaseAdmin
      .from('tags')
      .insert(missingTags)
      .select('*');

    if (error) {
      throw error;
    }

    createdTags = (data as Tag[]) || [];
  }

  const allTags = [...knownTags, ...createdTags];

  const { error: deleteError } = await supabaseAdmin
    .from('post_tags')
    .delete()
    .eq('post_id', postId);

  if (deleteError) {
    throw deleteError;
  }

  if (allTags.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from('post_tags')
      .insert(allTags.map((tag) => ({ post_id: postId, tag_id: tag.id })));

    if (insertError) {
      throw insertError;
    }
  }

  return allTags;
}
