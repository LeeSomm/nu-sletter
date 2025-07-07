import { json } from '@sveltejs/kit';
import { withAuth, handleApiError } from '$lib/server/auth.js';
import {
  submitUserResponse,
  getSessionResponses,
  getUserSessionResponses
} from '$lib/server/responses.js';

// GET /api/responses?sessionId=...&userId=... - Get responses
export const GET = withAuth(async (event, user) => {
  try {
    const sessionId = event.url.searchParams.get('sessionId');
    const userId = event.url.searchParams.get('userId');
    
    if (!sessionId) {
      return json({ error: 'Session ID is required' }, { status: 400 });
    }

    let responses;
    if (userId) {
      // Get responses for a specific user
      responses = await getUserSessionResponses(sessionId, userId, user.uid);
    } else {
      // Get all responses for the session
      responses = await getSessionResponses(sessionId, user.uid);
    }

    return json(responses);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/responses - Submit a new response
export const POST = withAuth(async (event, user) => {
  try {
    const {
      newsletterId,
      sessionId,
      questionId,
      response,
      isPublic = false,
      submittedQuestion
    } = await event.request.json();

    if (!newsletterId || !sessionId || !questionId || !response) {
      return json({
        error: 'Newsletter ID, session ID, question ID, and response are required'
      }, { status: 400 });
    }

    const userResponse = await submitUserResponse(
      newsletterId,
      sessionId,
      user.uid,
      questionId,
      response,
      isPublic,
      submittedQuestion
    );

    return json(userResponse, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
