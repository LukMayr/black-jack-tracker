import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import type { Provider } from "next-auth/providers/index";
import { db } from "~/server/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt", // ✅ changed from "database"
  },
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT ?? "587"),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASS,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    /*
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        
        async authorize(credentials) {
          if (!credentials) {
              throw new Error("Credentials are required");
          }
          const user = await db.user.findUnique({
            where: { email: credentials?.email },
          });
  
          if (!user || !user.passwordHash) {
            throw new Error("Invalid email or password");
          }
  
          const isValid = await compare(credentials.password, user.passwordHash);
          if (!isValid) {
            throw new Error("Invalid email or password");
          }
  
          return user;
        },
      }),*/
  ],
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
};
function EmailProvider(arg0: {
  server: {
    host: string | undefined;
    port: number;
    auth: { user: string | undefined; pass: string | undefined };
  };
  from: string | undefined;
}): Provider {
  throw new Error("Function not implemented.");
}
