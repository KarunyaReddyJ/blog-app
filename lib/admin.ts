import { hasSupabaseAdminEnv, supabaseAdmin } from './supabase';

export async function isAdminUser(userId: string, sessionRole?: string | null): Promise<boolean> {
  if (sessionRole === 'admin' || sessionRole === 'editor') {
    return true;
  }

  if (!hasSupabaseAdminEnv) return Boolean(userId);

  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error) {
    return Boolean(userId);
  }

  if (!data?.role) {
    return Boolean(userId);
  }

  return data.role === 'admin' || data.role === 'editor';
}
