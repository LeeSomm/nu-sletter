import { json } from '@sveltejs/kit';
import { withAdminAuth, handleApiError } from '$lib/server/auth.js';

// GET /api/admin/test - Test admin authentication
export const GET = withAdminAuth(async (event, user) => {
  try {
    return json({ 
      message: 'Admin authentication successful',
      user: {
        uid: user.uid,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
});
