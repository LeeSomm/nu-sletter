import { json } from '@sveltejs/kit';
import { withAuth, handleApiError } from '$lib/server/auth.js';
import {
  addUserToNewsletter,
  removeUserFromNewsletter,
  getNewsletterMembers
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
    const { userId } = await event.request.json();
    
    if (!newsletterId || !userId) {
      return json({ error: 'Newsletter ID and user ID are required' }, { status: 400 });
    }

    await addUserToNewsletter(newsletterId, userId, user.uid);

    return json({ success: true }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE /api/newsletters/[id]/members/[userId] - Remove a member from newsletter
export const DELETE = withAuth(async (event, user) => {
  try {
    const newsletterId = event.params.id;
    const userId = event.params.userId;
    
    if (!newsletterId || !userId) {
      return json({ error: 'Newsletter ID and user ID are required' }, { status: 400 });
    }

    await removeUserFromNewsletter(newsletterId, userId, user.uid);

    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
});
