import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAdminUser } from '@/lib/admin';
import { getSiteResume, saveSiteResume } from '@/lib/site';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = await isAdminUser(session.user.id, session.user.role);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const data = await getSiteResume();
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isAdminUser(session.user.id, session.user.role);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as {
      title?: string;
      summary?: string;
      resume_url?: string;
      highlights?: string[];
    };

    if (!body.title?.trim() || !body.summary?.trim()) {
      return NextResponse.json({ error: 'Title and summary are required.' }, { status: 400 });
    }

    const data = await saveSiteResume({
      title: body.title,
      summary: body.summary,
      resume_url: body.resume_url || null,
      highlights: body.highlights || [],
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error saving resume:', error);
    return NextResponse.json({ error: 'Failed to save resume' }, { status: 500 });
  }
}
