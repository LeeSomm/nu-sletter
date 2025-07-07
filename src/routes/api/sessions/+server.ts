import { json } from '@sveltejs/kit';
import { withAuth, handleApiError } from '$lib/server/auth.js';
import {
  createSession,
  getActiveSession,
  updateSession
} from '$lib/server/responses.js';

// GET /api/sessions?newsletterId=... - Get active session for newsletter
export const GET = withAuth(async (event, user) => {
  try {
    const newsletterId = event.url.searchParams.get('newsletterId');
    
    if (!newsletterId) {
      return json({ error: 'Newsletter ID is required' }, { status: 400 });
    }

    const session = await getActiveSession(newsletterId, user.uid);
    return json(session);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/sessions - Create a new session
export const POST = withAuth(async (event, user) => {
  try {
    const {
      newsletterId,
      weekIdentifier,
      weekStart,
      weekEnd
    } = await event.request.json();

    if (!newsletterId || !weekIdentifier) {
      return json({
        error: 'Newsletter ID and week identifier are required'
      }, { status: 400 });
    }

    const sessionId = await createSession(
      newsletterId,
      weekIdentifier,
      weekStart ? new Date(weekStart) : new Date(),
      weekEnd ? new Date(weekEnd) : new Date(),
      user.uid
    );

    return json({ id: sessionId }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
