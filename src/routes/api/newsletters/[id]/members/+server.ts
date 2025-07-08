import { json } from '@sveltejs/kit';
import { withAuth, handleApiError } from '$lib/server/auth.js';
import {
  addUserToNewsletter,
  removeUserFromNewsletter,
  getNewsletterMembers,
  updateUserRole
} from '$lib/server/newsletters.js';

// GET /api/newsletters/[id]/members - Get newsletter members
export const GET = withAuth(async (event, user) => {
  try {
    const newsletterId = event.params.id;
    
    if (!newsletterId) {
      return json({ error: 'Newsletter ID is required' }, { status: 400 });
    }

    const members = await getNewsletterMembers(newsletterId, user.uid);
    return json(members);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/newsletters/[id]/members - Add a member to newsletter
export const POST = withAuth(async (event, user) => {
  try {
    const newsletterId = event.params.id;
    const { userId, role = 'member' } = await event.request.json();
    
    if (!newsletterId || !userId) {
      return json({ error: 'Newsletter ID and user ID are required' }, { status: 400 });
    }

    if (!['member', 'moderator'].includes(role)) {
      return json({ error: 'Invalid role. Must be "member" or "moderator"' }, { status: 400 });
    }

    await addUserToNewsletter(newsletterId, userId, user.uid, role);

    return json({ success: true }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE /api/newsletters/[id]/members - Remove a member from newsletter
export const DELETE = withAuth(async (event, user) => {
  try {
    const newsletterId = event.params.id;
    const { userId } = await event.request.json();
    
    if (!newsletterId || !userId) {
      return json({ error: 'Newsletter ID and user ID are required' }, { status: 400 });
    }

    await removeUserFromNewsletter(newsletterId, userId, user.uid);

    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
});

// PATCH /api/newsletters/[id]/members - Update member role
export const PATCH = withAuth(async (event, user) => {
  try {
    const newsletterId = event.params.id;
    const { userId, role } = await event.request.json();
    
    if (!newsletterId || !userId || !role) {
      return json({ error: 'Newsletter ID, user ID, and role are required' }, { status: 400 });
    }

    if (!['member', 'moderator', 'owner'].includes(role)) {
      return json({ error: 'Invalid role. Must be "member", "moderator", or "owner"' }, { status: 400 });
    }

    await updateUserRole(newsletterId, userId, role, user.uid);

    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
});
