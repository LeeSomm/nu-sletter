import { json } from '@sveltejs/kit';
import { withAdminAuth, handleApiError } from '$lib/server/auth.js';
import { adminDb } from '$lib/server/admin.js';

// GET /api/admin/users - List all users
export const GET = withAdminAuth(async (event, user) => {
  try {
    const usersSnapshot = await adminDb.collection('users').get();
    
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Hide sensitive data in list view
      // We can add more fields here as needed
    }));

    return json({
      users,
      total: users.length
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// PUT /api/admin/users - Update user (bulk or single)
export const PUT = withAdminAuth(async (event, user) => {
  try {
    const { userId, updates } = await event.request.json();

    if (!userId || !updates) {
      return json({ error: 'User ID and updates are required' }, { status: 400 });
    }

    // Validate allowed fields for admin updates
    const allowedFields = ['displayName', 'isActive', 'isAdmin', 'preferences'];
    const filteredUpdates: any = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Prevent admin from removing their own admin status
    if (userId === user.uid && filteredUpdates.isAdmin === false) {
      return json({ error: 'Cannot remove your own admin privileges' }, { status: 400 });
    }

    await adminDb.collection('users').doc(userId).update(filteredUpdates);

    return json({ success: true, updated: filteredUpdates });
  } catch (error) {
    return handleApiError(error);
  }
});
