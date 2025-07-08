import { json } from '@sveltejs/kit';
import { withAuth, handleApiError } from '$lib/server/auth.js';
import {
  getNewsletter,
  updateNewsletter,
  deleteNewsletter,
  hasNewsletterAccess
} from '$lib/server/newsletters.js';

// GET /api/newsletters/[id] - Get a specific newsletter
export const GET = withAuth(async (event, user) => {
  try {
    const newsletterId = event.params.id;
    
    if (!newsletterId) {
      return json({ error: 'Newsletter ID is required' }, { status: 400 });
    }

    const newsletter = await getNewsletter(newsletterId);
    
    if (!newsletter) {
      return json({ error: 'Newsletter not found' }, { status: 404 });
    }

    // Check if user has access using the new membership system
    const hasAccess = await hasNewsletterAccess(newsletterId, user.uid, 'read');

    if (!hasAccess) {
      return json({ error: 'Access denied' }, { status: 403 });
    }

    return json(newsletter);
  } catch (error) {
    return handleApiError(error);
  }
});

// PUT /api/newsletters/[id] - Update a newsletter
export const PUT = withAuth(async (event, user) => {
  try {
    const newsletterId = event.params.id;
    
    if (!newsletterId) {
      return json({ error: 'Newsletter ID is required' }, { status: 400 });
    }

    const updates = await event.request.json();

    await updateNewsletter(newsletterId, updates, user.uid);

    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE /api/newsletters/[id] - Delete a newsletter
export const DELETE = withAuth(async (event, user) => {
  try {
    const newsletterId = event.params.id;
    
    if (!newsletterId) {
      return json({ error: 'Newsletter ID is required' }, { status: 400 });
    }

    await deleteNewsletter(newsletterId, user.uid);

    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
});
