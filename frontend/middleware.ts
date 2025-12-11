import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

interface JWTPayload {
  id: string;
  role: 'patient' | 'doctor';
  email: string;
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;
  
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isPatientPage = pathname.startsWith('/patient');
  const isDoctorPage = pathname.startsWith('/doctor');
  const isDashboard = isPatientPage || isDoctorPage;
  
  // No token and trying to access protected pages
  if (!token && isDashboard) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Has token - verify it
  if (token) {
    try {
      const secret = new TextEncoder().encode(
        process.env.NEXT_PUBLIC_JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
      );
      const { payload } = await jwtVerify(token, secret) as { payload: JWTPayload };
      
      // Already on auth page - redirect to appropriate dashboard
      if (isAuthPage) {
        const dashboard = payload.role === 'doctor' ? '/doctor' : '/patient';
        return NextResponse.redirect(new URL(dashboard, request.url));
      }
      
      // Already on correct dashboard - allow through
      if ((isPatientPage && payload.role === 'patient') || 
          (isDoctorPage && payload.role === 'doctor')) {
        return NextResponse.next();
      }
      
      // On wrong dashboard - redirect to correct one
      if (isPatientPage && payload.role === 'doctor') {
        return NextResponse.redirect(new URL('/doctor', request.url));
      }
      
      if (isDoctorPage && payload.role === 'patient') {
        return NextResponse.redirect(new URL('/patient', request.url));
      }
      
    } catch (error) {
      console.error('JWT verification failed:', error);
      
      // Only redirect to login if trying to access protected pages
      if (isDashboard) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.set('token', '', {
          httpOnly: true,
          expires: new Date(0),
          path: '/',
        });
        return response;
      }
    }
  }
  
  // Default: allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/register', '/patient/:path*', '/doctor/:path*']
};