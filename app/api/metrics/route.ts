import { NextRequest, NextResponse } from 'next/server';
import { getPostMetrics } from '@/lib/database';

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

    const metrics = await getPostMetrics(id);

    return NextResponse.json({ data: metrics });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
