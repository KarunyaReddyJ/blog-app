import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AdminProfileForm } from '@/components/admin-profile-form';
import { isAdminUser } from '@/lib/admin';
import { getSiteProfile } from '@/lib/site';

export default async function AdminProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const isAdmin = await isAdminUser(session.user.id, session.user.role);
  if (!isAdmin) {
    redirect('/');
  }

  const profile = await getSiteProfile();
  return <AdminProfileForm initialProfile={profile} />;
}
