import { NextRequest, NextResponse } from 'next/server';
import { recordLike, checkIfLiked } from '@/lib/database';
import { getClientIp, rateLimit } from '@/lib/auth';
import { auth } from '@/app/api/auth/[...nextauth]/route';

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

    // Get user and IP
    const session = await auth();
    const userId = session?.user?.id || null;
    const ipAddress = getClientIp(request);

    // Rate limiting: max 5 likes per IP per minute
    const rateLimitKey = `like:${ipAddress}`;
    if (!rateLimit.check(rateLimitKey, 5, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Check if already liked
    const alreadyLiked = await checkIfLiked(id, userId, ipAddress);
    if (alreadyLiked) {
      return NextResponse.json(
        { error: 'You have already liked this post' },
        { status: 409 }
      );
    }

    // Record like
    const result = await recordLike(id, userId, ipAddress);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Error recording like:', error);
    return NextResponse.json(
      { error: 'Failed to record like' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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
    const userId = session?.user?.id || null;
    const ipAddress = getClientIp(request);

    const liked = await checkIfLiked(id, userId, ipAddress);

    return NextResponse.json({ liked });
  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'Failed to check like status' },
      { status: 500 }
    );
  }
}
