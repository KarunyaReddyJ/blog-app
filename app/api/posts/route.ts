import { NextRequest, NextResponse } from 'next/server';
import { getPublishedPosts, type PostSort } from '@/lib/blog';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const tag = searchParams.get('tag') || undefined;
    const sort = (searchParams.get('sort') || 'recent') as PostSort;
    const posts = await getPublishedPosts({ limit, tag, sort });

    return NextResponse.json({
      data: posts,
      limit,
      tag,
      sort,
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
