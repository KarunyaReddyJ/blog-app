import { NextRequest, NextResponse } from 'next/server';
import { recordView, getViewCount } from '@/lib/database';
import { getClientIp, getUserAgent, rateLimit } from '@/lib/auth';

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

    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    // Rate limiting: max 1 view per IP per 5 minutes
    const rateLimitKey = `view:${id}:${ipAddress}`;
    if (!rateLimit.check(rateLimitKey, 1, 5 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'View already recorded for this session' },
        { status: 429 }
      );
    }

    // Record view
    await recordView(id, ipAddress, userAgent);

    const viewCount = await getViewCount(id);

    return NextResponse.json({
      success: true,
      viewCount,
    });
  } catch (error) {
    console.error('Error recording view:', error);
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
}
