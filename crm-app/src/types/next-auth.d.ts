type AppRole = 'admin' | 'manager' | 'member' | 'viewer';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string | null;
      name: string | null;
      image?: string | null;
      role?: AppRole;
    };
  }

  interface User {
    id: string;
    email: string | null;
    name: string | null;
    image?: string | null;
    role?: AppRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: AppRole;
  }
}
