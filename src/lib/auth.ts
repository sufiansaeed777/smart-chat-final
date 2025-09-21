import { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { AppDataSource } from "@/config/database"
import { User } from "@/entities/User"
import { UserRole } from "@/types/UserRole"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Initialize database connection
          if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
          }

          const userRepository = AppDataSource.getRepository(User);
          const user = await userRepository.findOne({
            where: { email: credentials.email }
          });

          if (!user || !user.isActive || !user.isEmailVerified) {
            return null;
          }

          const isPasswordValid = user.password ? await bcrypt.compare(credentials.password, user.password) : false;
          if (!isPasswordValid) {
            return null;
          }

          // Update last login
          user.lastLoginAt = new Date();
          await userRepository.save(user);

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`.trim(),
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            isActive: user.isActive,
          };
        } catch (error) {
          console.error('Error in credentials authorization:', error);
          return null;
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          // Initialize database connection
          if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
          }

          const userRepository = AppDataSource.getRepository(User);
          
          // Check if user already exists
          const existingUser = await userRepository.findOne({
            where: { email: user.email! }
          });

          if (!existingUser) {
            // Create new user with Google info
            const newUser = new User();
            newUser.email = user.email!;
            newUser.firstName = user.name?.split(' ')[0] || null;
            newUser.lastName = user.name?.split(' ').slice(1).join(' ') || null;
            newUser.isEmailVerified = true; // Google accounts are pre-verified
            newUser.isActive = true;
            newUser.role = UserRole.MANAGER; // All users who sign up become managers by default
            
            // Generate a random password for Google users
            const randomPassword = Math.random().toString(36).slice(-10);
            newUser.password = await bcrypt.hash(randomPassword, 12);
            
            await userRepository.save(newUser);
            console.log('Google user created:', newUser.email);
          } else {
            // Update existing user if needed
            if (!existingUser.isEmailVerified) {
              existingUser.isEmailVerified = true;
              existingUser.isActive = true;
              await userRepository.save(existingUser);
            }
          }
          
          return true;
        } catch (error) {
          console.error('Error in Google sign in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user) {
        token.provider = "google";
        token.email = user.email;
        
        // Get user role from database for Google users
        try {
          if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
          }
          const userRepository = AppDataSource.getRepository(User);
          const dbUser = await userRepository.findOne({
            where: { email: user.email! }
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.id = dbUser.id;
            token.isEmailVerified = dbUser.isEmailVerified;
            token.isActive = dbUser.isActive;
          }
        } catch (error) {
          console.error('Error fetching user role for Google sign-in:', error);
        }
      }
      
      // Add role and verification status to token for credentials provider
      if (user && 'role' in user && user.role) {
        token.role = user.role;
        token.id = user.id;
        token.isEmailVerified = (user as { isEmailVerified?: boolean }).isEmailVerified;
        token.isActive = (user as { isActive?: boolean }).isActive;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token.provider === "google" && session.user) {
        // Extend the session user type to include provider
        (session.user as { provider?: string }).provider = "google";
      }
      
      // Add role, id, and verification status to session
      if (token.role && session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      if (token.id && session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      if (token.isEmailVerified !== undefined && session.user) {
        (session.user as { isEmailVerified?: boolean }).isEmailVerified = token.isEmailVerified as boolean;
      }
      if (token.isActive !== undefined && session.user) {
        (session.user as { isActive?: boolean }).isActive = token.isActive as boolean;
      }
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to role-specific dashboard after successful sign in
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows relative callback URLs
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl + '/user-dashboard' // Default for Google sign-in
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}
