import { json } from '@sveltejs/kit';
import { withAuth, handleApiError } from '$lib/server/auth.js';
import { adminDb } from '$lib/server/admin.js';

// GET /api/users/me - Get current user profile
export const GET = withAuth(async (event, user) => {
  try {
    const userDoc = await adminDb.collection('users').doc(user.uid).get();
    
    if (!userDoc.exists) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    return json(userDoc.data());
  } catch (error) {
    return handleApiError(error);
  }
});
