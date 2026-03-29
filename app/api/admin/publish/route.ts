import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { updatePost, getPostById } from '@/lib/database';
import { isAdminUser } from '@/lib/admin';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID required (use ?id=postId)' },
        { status: 400 }
      );
    }

    const id = parseInt(postId);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

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

    const body = await request.json() || {};
    const { publish = true } = body;

    const post = await getPostById(id);

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.author_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update published status
    const updatedPost = await updatePost(id, {
      published_at: publish ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    });

    // Trigger ISR revalidation
    try {
      revalidatePath('/blog');
      revalidatePath(`/blog/${post.slug}`);
    } catch (err) {
      console.warn('ISR revalidation failed:', err);
      // Don't fail the request if revalidation fails
    }

    return NextResponse.json({
      success: true,
      data: updatedPost,
      published: !!updatedPost.published_at,
    });
  } catch (error) {
    console.error('Error publishing post:', error);
    return NextResponse.json(
      { error: 'Failed to publish post' },
      { status: 500 }
    );
  }
}
