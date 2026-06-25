import type { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { recoverMessageAddress } from 'viem';
import { prisma } from '@/lib/prisma';
import { isAdminEmail } from '@/lib/admin';
import { verifyNonce } from '@/lib/siwe';

const googleEnabled = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: '/auth/signin' },
  providers: [
    ...(googleEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const email = String(creds.email).toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(String(creds.password), user.passwordHash);
        if (!ok) return null;
        // Block sign-in until the email has been confirmed with a one-time code.
        // The client detects this message and switches to the verification step.
        if (!user.emailVerified) throw new Error('EMAIL_NOT_VERIFIED');
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
    CredentialsProvider({
      id: 'email-otp',
      name: 'Email code',
      credentials: {
        email: { label: 'Email', type: 'email' },
        code: { label: 'Code', type: 'text' },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.code) return null;
        const email = String(creds.email).toLowerCase();
        const rec = await prisma.emailOtp.findFirst({
          where: { email },
          orderBy: { createdAt: 'desc' },
        });
        if (!rec || rec.expiresAt < new Date()) return null;
        const ok = await bcrypt.compare(String(creds.code), rec.codeHash);
        if (!ok) return null;
        await prisma.emailOtp.deleteMany({ where: { email } });
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          // Passwordless first-time sign-in: create an already-verified account.
          user = await prisma.user.create({ data: { email, emailVerified: new Date() } });
        } else if (!user.emailVerified) {
          // Existing account (e.g. just signed up with a password) — confirm it.
          user = await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
        }
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
    CredentialsProvider({
      id: 'siwe',
      name: 'Wallet',
      credentials: {
        message: { label: 'Message', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
      },
      async authorize(creds) {
        try {
          const message = String(creds?.message || '');
          const signature = String(creds?.signature || '') as `0x${string}`;
          if (!message || !signature) return null;

          const addrMatch = message.match(/Wallet:\s*(0x[a-fA-F0-9]{40})/);
          const nonceMatch = message.match(/Nonce:\s*(\d+\.[a-f0-9]+)/);
          if (!addrMatch || !nonceMatch) return null;
          if (!verifyNonce(nonceMatch[1])) return null;

          const recovered = await recoverMessageAddress({ message, signature });
          if (recovered.toLowerCase() !== addrMatch[1].toLowerCase()) return null;

          const wallet = recovered.toLowerCase();
          let user = await prisma.user.findFirst({ where: { walletAddress: wallet } });
          if (!user) {
            user = await prisma.user.create({
              data: {
                walletAddress: wallet,
                emailVerified: new Date(),
                name: `${recovered.slice(0, 6)}…${recovered.slice(-4)}`,
              },
            });
          }
          return { id: user.id, name: user.name, email: user.email, image: user.image };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = (user as { id?: string }).id;
      token.isAdmin = isAdminEmail(token.email);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid;
        session.user.isAdmin = token.isAdmin ?? false;
      }
      return session;
    },
  },
};
