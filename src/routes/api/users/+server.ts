import { json } from '@sveltejs/kit';
import { withAuth, handleApiError } from '$lib/server/auth.js';
import { adminDb } from '$lib/server/admin.js';

// POST /api/users - Create user profile in Firestore
export const POST = withAuth(async (event, user) => {
  try {
    const body = await event.request.json();
    
    // Validate that the user is creating their own profile
    if (body.uid !== user.uid) {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if user already exists
    const existingUser = await adminDb.collection('users').doc(body.uid).get();
    if (existingUser.exists) {
      return json({ error: 'User profile already exists' }, { status: 409 });
    }

    // Prepare user data according to schema
    const userData = {
      uid: body.uid,
      email: body.email || user.email,
      displayName: body.displayName || user.name || '',
      createdAt: new Date(),
      isActive: true,
      isAdmin: false,
      preferences: {
        emailNotifications: body.preferences?.emailNotifications ?? true,
        timezone: body.preferences?.timezone || 'UTC'
      },
      newsletterMemberships: {}
    };

    // Create user document in Firestore
    await adminDb.collection('users').doc(body.uid).set(userData);

    return json({ success: true, user: userData });
  } catch (error) {
    return handleApiError(error);
  }
});
