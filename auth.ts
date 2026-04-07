import NextAuth, { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { supabase } from '@/lib/supabase';

declare module 'next-auth' {
  interface User {
    role?: string;
    accessToken?: string;
  }
  interface JWT {
    role?: string;
    accessToken?: string;
  }
  interface Session {
    user?: {
      id?: string;
      role?: string;
      email?: string | null;
    };
    accessToken?: string;
  }
}

const config = {
  providers: [
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<{ id: string; email: string; name: string; role: string; accessToken: string } | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email as string,
            password: credentials.password as string,
          });

          if (error || !data.user) {
            return null;
          }

          const { data: userRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .single();

          return {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || data.user.email || 'User',
            role: userRole?.role || 'viewer',
            accessToken: data.session?.access_token || '',
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'viewer';
        token.accessToken = user.accessToken;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub || '';
        session.user.role = token.role as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  logger: {
    error(error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('CredentialsSignin')) {
        return;
      }

      console.error(error);
    },
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
} as NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
