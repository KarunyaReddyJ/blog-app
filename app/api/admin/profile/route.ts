import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAdminUser } from '@/lib/admin';
import { getSiteProfile, saveSiteProfile } from '@/lib/site';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = await isAdminUser(session.user.id, session.user.role);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const data = await getSiteProfile();
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
      full_name?: string;
      headline?: string;
      short_bio?: string;
      long_bio?: string;
      location?: string;
      email?: string;
      github_url?: string;
      linkedin_url?: string;
      x_url?: string;
      focus_areas?: string[];
      current_interests?: string[];
    };

    if (!body.full_name?.trim() || !body.headline?.trim() || !body.short_bio?.trim()) {
      return NextResponse.json({ error: 'Name, headline, and short bio are required.' }, { status: 400 });
    }

    const data = await saveSiteProfile({
      full_name: body.full_name,
      headline: body.headline,
      short_bio: body.short_bio,
      long_bio: body.long_bio || null,
      location: body.location || null,
      email: body.email || null,
      github_url: body.github_url || null,
      linkedin_url: body.linkedin_url || null,
      x_url: body.x_url || null,
      focus_areas: body.focus_areas || [],
      current_interests: body.current_interests || [],
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
