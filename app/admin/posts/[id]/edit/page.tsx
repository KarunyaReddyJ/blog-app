import { notFound, redirect } from 'next/navigation';
import { PostEditorForm } from '@/components/post-editor-form';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { isAdminUser } from '@/lib/admin';
import { getAdminPostById } from '@/lib/blog';

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const isAdmin = await isAdminUser(session.user.id, session.user.role);
  if (!isAdmin) {
    redirect('/');
  }

  const { id } = await params;
  const post = await getAdminPostById(Number(id), session.user.id);

  if (!post) {
    notFound();
  }

  return (
    <PostEditorForm
      mode="edit"
      initialPost={{
        id: post.id,
        title: post.title,
        excerpt: post.excerpt || '',
        cover_image: post.cover_image || '',
        seo_title: post.seo_title || '',
        seo_description: post.seo_description || '',
        content: post.content,
        tags: post.tags.map((tag) => tag.name),
        published_at: post.published_at,
      }}
    />
  );
}
