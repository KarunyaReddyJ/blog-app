import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAdminUser } from '@/lib/admin';
import { getAdminPosts } from '@/lib/blog';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isUserAdmin = await isAdminUser(session.user.id, session.user.role);
    if (!isUserAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const posts = await getAdminPosts(session.user.id);

    return NextResponse.json({
      data: posts,
    });
  } catch (error) {
    console.error('Error fetching admin posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
