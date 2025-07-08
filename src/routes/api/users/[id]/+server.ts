import { json } from '@sveltejs/kit';
import { withAuth, handleApiError } from '$lib/server/auth.js';
import { adminDb } from '$lib/server/admin.js';

// GET /api/users/[id] - Get user profile by ID
export const GET = withAuth(async (event, user) => {
  try {
    const { params } = event;
    const userId = params.id;

    if (!userId) {
      return json({ error: 'User ID is required' }, { status: 400 });
    }

    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Return basic public info only (privacy protection)
    const userData = userDoc.data();
    return json({
      uid: userData?.uid,
      displayName: userData?.displayName,
      email: userData?.email, // Consider removing this for privacy
      isActive: userData?.isActive
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// PUT /api/users/[id] - Update user profile
export const PUT = withAuth(async (event, user) => {
  try {
    const { params } = event;
    const userId = params.id;

    // Users can only update their own profile
    if (userId !== user.uid) {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await event.request.json();
    const allowedFields = ['displayName', 'preferences'];
    
    // Filter only allowed fields for update
    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await adminDb.collection('users').doc(userId).update(updateData);

    return json({ success: true, updated: updateData });
  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE /api/users/[id] - Delete user profile
export const DELETE = withAuth(async (event, user) => {
  try {
    const { params } = event;
    const userId = params.id;

    // Users can only delete their own profile
    if (userId !== user.uid) {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete user document from Firestore
    await adminDb.collection('users').doc(userId).delete();

    return json({ success: true, message: 'User profile deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
});
