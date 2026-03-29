import { redirect } from 'next/navigation';
import { PostEditorForm } from '@/components/post-editor-form';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { isAdminUser } from '@/lib/admin';

export default async function NewPostPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const isAdmin = await isAdminUser(session.user.id, session.user.role);
  if (!isAdmin) {
    redirect('/');
  }

  return <PostEditorForm mode="new" />;
}
