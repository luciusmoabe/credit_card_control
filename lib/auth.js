import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { sql } from '@/lib/db';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'E-mail e Senha',
      credentials: {
        email: { label: "E-mail", type: "email", placeholder: "admin@dominio.com" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const [user] = await sql`SELECT * FROM users WHERE email = ${credentials.email}`;
          if (!user) return null;
          if (user.active === false) throw new Error('Conta inativa. Procure o administrador.');
          
          const passwordMatch = await bcrypt.compare(credentials.password, user.password_hash);
          if (!passwordMatch) return null;
          
          return { id: user.id, email: user.email, name: user.name, role: user.role };
        } catch (error) {
          if (error.message.includes('Conta inativa')) throw error;
          return null;
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET || 'fallback_secret_key_for_dev_only',
};
