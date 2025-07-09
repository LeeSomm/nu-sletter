import { adminAuth, adminDb } from '$lib/server/admin.js';
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  name?: string;
}

export interface AdminUser extends AuthenticatedUser {
  isAdmin: true;
}

/**
 * Extracts and verifies the Firebase ID token from the request
 */
export async function authenticateUser(event: RequestEvent): Promise<AuthenticatedUser> {
  const authHeader = event.request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.slice(7);
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Checks if a user is an admin by looking up their user document
 */
export async function isUserAdmin(uid: string): Promise<boolean> {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return false;
    }

    const userData = userDoc.data();
    return userData?.isAdmin === true && userData?.isActive === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Wrapper for API handlers that require authentication
 */
export function withAuth<T extends Record<string, unknown>>(
  handler: (event: RequestEvent, user: AuthenticatedUser) => Promise<Response>
) {
  return async (event: RequestEvent): Promise<Response> => {
    try {
      const user = await authenticateUser(event);
      return await handler(event, user);
    } catch (error) {
      console.error('Authentication error:', error);
      return json(
        { error: error instanceof Error ? error.message : 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

/**
 * Wrapper for API handlers that require admin authentication
 */
export function withAdminAuth<T extends Record<string, unknown>>(
  handler: (event: RequestEvent, user: AdminUser) => Promise<Response>
) {
  return async (event: RequestEvent): Promise<Response> => {
    try {
      const user = await authenticateUser(event);
      
      // Check if user is admin
      const isAdmin = await isUserAdmin(user.uid);
      if (!isAdmin) {
        return json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }

      const adminUser: AdminUser = {
        ...user,
        isAdmin: true
      };

      return await handler(event, adminUser);
    } catch (error) {
      console.error('Admin authentication error:', error);
      return json(
        { error: error instanceof Error ? error.message : 'Admin authentication failed' },
        { status: 401 }
      );
    }
  };
}

/**
 * Handles common API errors
 */
export function handleApiError(error: unknown): Response {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    if (error.message.includes('Unauthorized')) {
      return json({ error: error.message }, { status: 403 });
    }
    if (error.message.includes('not found')) {
      return json({ error: error.message }, { status: 404 });
    }
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return json({ error: error.message }, { status: 400 });
    }
  }
  
  return json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
