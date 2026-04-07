import { supabase, supabaseAdmin, Post, PostComment, Tag } from './supabase';

// ==================== Posts ====================

export async function getAllPosts(
  limit: number = 10,
  offset: number = 0,
  published_only: boolean = true
) {
  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (published_only) {
    query = query.not('published_at', 'is', null);
  }

  const { data, error } = await query.range(offset, offset + limit - 1);

  if (error) throw error;
  return data as Post[];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .not('published_at', 'is', null)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return (data as Post) || null;
}

export async function getPostById(id: number): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return (data as Post) || null;
}

export async function createPost(post: Partial<Post>) {
  if (!supabaseAdmin) throw new Error('Service role key not configured');

  const { data, error } = await supabaseAdmin
    .from('posts')
    .insert([post])
    .select()
    .single();

  if (error) throw error;
  return data as Post;
}

export async function updatePost(id: number, updates: Partial<Post>) {
  if (!supabaseAdmin) throw new Error('Service role key not configured');

  const { data, error } = await supabaseAdmin
    .from('posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Post;
}

export async function deletePost(id: number) {
  if (!supabaseAdmin) throw new Error('Service role key not configured');

  const { error } = await supabaseAdmin
    .from('posts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== Tags ====================

export async function getAllTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data as Tag[]) || [];
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return (data as Tag) || null;
}

export async function createTag(name: string, slug: string): Promise<Tag> {
  if (!supabaseAdmin) throw new Error('Service role key not configured');

  const { data, error } = await supabaseAdmin
    .from('tags')
    .insert([{ name, slug }])
    .select()
    .single();

  if (error) throw error;
  return data as Tag;
}

// ==================== Post Tags ====================

export async function addTagToPost(postId: number, tagId: number) {
  if (!supabaseAdmin) throw new Error('Service role key not configured');

  const { error } = await supabaseAdmin
    .from('post_tags')
    .insert([{ post_id: postId, tag_id: tagId }]);

  if (error) throw error;
}

export async function removeTagFromPost(postId: number, tagId: number) {
  if (!supabaseAdmin) throw new Error('Service role key not configured');

  const { error } = await supabaseAdmin
    .from('post_tags')
    .delete()
    .eq('post_id', postId)
    .eq('tag_id', tagId);

  if (error) throw error;
}

export async function getPostTags(postId: number): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('post_tags')
    .select('tags(*)')
    .eq('post_id', postId);

  if (error) throw error;
  return data?.map((pt: { tags: unknown }) => pt.tags as Tag) || [];
}

// ==================== Likes ====================

export async function recordLike(postId: number, userId: string | null, ipAddress: string | null) {
  if (!supabaseAdmin) throw new Error('Service role key not configured');

  const { data, error } = await supabaseAdmin
    .from('post_likes')
    .insert([{ post_id: postId, user_id: userId, ip_address: ipAddress }])
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation
    if (error.code === '23505') {
      return { error: 'Already liked', code: 'ALREADY_LIKED' };
    }
    throw error;
  }

  // Increment like count
  await supabaseAdmin.rpc('increment_like_count', { post_id: postId });

  return { data };
}

export async function checkIfLiked(postId: number, userId: string | null, ipAddress: string | null) {
  let query = supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId);

  if (userId) {
    query = query.eq('user_id', userId);
  } else if (ipAddress) {
    query = query.eq('ip_address', ipAddress);
  } else {
    return false;
  }

  const { data, error } = await query;

  if (error) throw error;
  return data && data.length > 0;
}

export async function getLikeCount(postId: number): Promise<number> {
  const post = await getPostById(postId);
  return post?.like_count || 0;
}

// ==================== Views ====================

export async function recordView(postId: number, ipAddress: string | null, userAgent: string | null) {
  if (!supabaseAdmin) throw new Error('Service role key not configured');

  const { error } = await supabaseAdmin
    .from('post_views')
    .insert([{ post_id: postId, ip_address: ipAddress, user_agent: userAgent }]);

  if (error) throw error;

  // Increment view count
  await supabaseAdmin.rpc('increment_view_count', { post_id: postId });
}

export async function getViewCount(postId: number): Promise<number> {
  const post = await getPostById(postId);
  return post?.view_count || 0;
}

// ==================== Metrics ====================

export async function getPostMetrics(postId: number) {
  const post = await getPostById(postId);
  if (!post) throw new Error('Post not found');

  return {
    views: post.view_count,
    likes: post.like_count,
  };
}

// ==================== Comments ====================

export type CommentNode = PostComment & {
  replies: CommentNode[];
};

function buildCommentTree(comments: PostComment[]): CommentNode[] {
  const commentMap = new Map<number, CommentNode>();

  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  const roots: CommentNode[] = [];

  commentMap.forEach((comment) => {
    if (comment.parent_id && commentMap.has(comment.parent_id)) {
      commentMap.get(comment.parent_id)?.replies.push(comment);
      return;
    }

    roots.push(comment);
  });

  return roots;
}

export async function getCommentsByPostId(postId: number): Promise<CommentNode[]> {
  if (!supabaseAdmin) return [];

  const { data, error } = await supabaseAdmin
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return buildCommentTree((data as PostComment[]) || []);
}

export async function createComment({
  postId,
  parentId,
  authorName,
  authorEmail,
  content,
}: {
  postId: number;
  parentId?: number | null;
  authorName: string;
  authorEmail?: string | null;
  content: string;
}) {
  if (!supabaseAdmin) throw new Error('Service role key not configured');

  const { data, error } = await supabaseAdmin
    .from('post_comments')
    .insert([
      {
        post_id: postId,
        parent_id: parentId || null,
        author_name: authorName,
        author_email: authorEmail || null,
        content,
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as PostComment;
}
