import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    if (!token?.role) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const role = token.role;
    const canManage = role === 'admin' || role === 'manager';

    if (req.nextUrl.pathname.startsWith('/api/admin') && !canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (req.nextUrl.pathname.startsWith('/admin') && !canManage) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/admin/:path*'],
};
