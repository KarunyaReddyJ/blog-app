import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createPost, updatePost } from '@/lib/database';
import { isAdminUser } from '@/lib/admin';
import { syncPostTags } from '@/lib/blog';
import { generateSlug } from '@/lib/auth';
import { CONTENT_LIMIT_BYTES, getContentSizeBytes } from '@/lib/content';

const LIMITS = {
  contentBytes: CONTENT_LIMIT_BYTES,
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const isUserAdmin = await isAdminUser(session.user.id, session.user.role);
    if (!isUserAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      id,
      title,
      excerpt,
      content,
      cover_image,
      seo_title,
      seo_description,
      tags = [],
    } = body;

    const normalizedTitle = String(title || '').trim();
    const normalizedExcerpt = String(excerpt || '').trim();
    const normalizedCoverImage = String(cover_image || '').trim();
    const normalizedSeoTitle = String(seo_title || '').trim();
    const normalizedSeoDescription = String(seo_description || '').trim();

    if (!normalizedTitle) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const contentSizeBytes = getContentSizeBytes(content);
    if (contentSizeBytes > LIMITS.contentBytes) {
      return NextResponse.json(
        { error: 'Content must be 16 MB or smaller.' },
        { status: 400 }
      );
    }

    const slug = generateSlug(normalizedTitle);
    const postData = {
      title: normalizedTitle,
      slug,
      excerpt: normalizedExcerpt || null,
      content: content || null,
      cover_image: normalizedCoverImage || null,
      seo_title: normalizedSeoTitle || null,
      seo_description: normalizedSeoDescription || null,
      author_id: session.user.id,
      updated_at: new Date().toISOString(),
    };

    let post;
    if (id) {
      // Update existing post
      post = await updatePost(id, postData);
    } else {
      // Create new post
      post = await createPost(postData);
    }

    await syncPostTags(post.id, Array.isArray(tags) ? tags : []);

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('Error saving post:', error);

    const databaseError = error as { code?: string; message?: string } | null;
    if (databaseError?.code === '22001') {
      return NextResponse.json(
        { error: 'One of the text fields is still longer than the current database schema allows.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save post' },
      { status: 500 }
    );
  }
}
