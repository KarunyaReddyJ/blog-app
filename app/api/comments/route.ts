import { NextRequest, NextResponse } from 'next/server';
import { createComment, getCommentsByPostId } from '@/lib/database';
import { rateLimit } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = Number(searchParams.get('postId'));

    if (!Number.isInteger(postId) || postId <= 0) {
      return NextResponse.json({ error: 'Valid postId is required' }, { status: 400 });
    }

    const comments = await getCommentsByPostId(postId);
    return NextResponse.json({ data: comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      postId?: number;
      parentId?: number | null;
      authorName?: string;
      authorEmail?: string;
      content?: string;
    };

    const postId = Number(body.postId);
    const parentId = body.parentId ? Number(body.parentId) : null;
    const authorName = body.authorName?.trim() || '';
    const authorEmail = body.authorEmail?.trim() || '';
    const content = body.content?.trim() || '';

    if (!Number.isInteger(postId) || postId <= 0) {
      return NextResponse.json({ error: 'Valid postId is required' }, { status: 400 });
    }

    if (parentId !== null && (!Number.isInteger(parentId) || parentId <= 0)) {
      return NextResponse.json({ error: 'Invalid parent comment id' }, { status: 400 });
    }

    if (authorName.length < 2 || authorName.length > 60) {
      return NextResponse.json({ error: 'Name must be between 2 and 60 characters' }, { status: 400 });
    }

    if (content.length < 3 || content.length > 2000) {
      return NextResponse.json({ error: 'Comment must be between 3 and 2000 characters' }, { status: 400 });
    }

    const rateLimitKey = `comment:${request.headers.get('x-forwarded-for') || 'unknown'}`;
    if (!rateLimit.check(rateLimitKey, 6, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many comments. Please try again later.' }, { status: 429 });
    }

    const comment = await createComment({
      postId,
      parentId,
      authorName,
      authorEmail: authorEmail || null,
      content,
    });

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
