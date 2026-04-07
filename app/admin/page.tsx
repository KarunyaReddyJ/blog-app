import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function AdminEntryPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  redirect('/admin/dashboard');
}
