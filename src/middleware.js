import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect dashboard and app routes
  const protectedRoutes = ['/dashboard', '/courses', '/lessons', '/quizzes', '/certificates', '/profile'];
  const leaderRoutes = ['/leader'];
  const adminRoutes = ['/admin'];
  const authRoutes = ['/login', '/signup', '/reset-password'];
  const userPortalRoutes = [...protectedRoutes, ...leaderRoutes];

  const pathname = request.nextUrl.pathname;

  // Redirect unauthenticated users to login
  if (!user && (
    protectedRoutes.some(route => pathname.startsWith(route)) ||
    leaderRoutes.some(route => pathname.startsWith(route)) ||
    adminRoutes.some(route => pathname.startsWith(route))
  )) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const role = profile?.role || 'student';

    // Redirect authenticated users away from auth pages by role
    if (authRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL(role === 'admin' ? '/admin' : '/dashboard', request.url));
    }

    // Enforce strict separation between admin and user portals
    if (role === 'admin' && userPortalRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    if (adminRoutes.some(route => pathname.startsWith(route)) && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (leaderRoutes.some(route => pathname.startsWith(route)) && !['leader', 'admin'].includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
