import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AdminResumeForm } from '@/components/admin-resume-form';
import { isAdminUser } from '@/lib/admin';
import { getSiteResume } from '@/lib/site';

export default async function AdminResumePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const isAdmin = await isAdminUser(session.user.id, session.user.role);
  if (!isAdmin) {
    redirect('/');
  }

  const resume = await getSiteResume();
  return <AdminResumeForm initialResume={resume} />;
}
