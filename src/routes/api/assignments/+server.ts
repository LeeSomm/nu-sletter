import { json } from '@sveltejs/kit';
import { withAuth, handleApiError } from '$lib/server/auth.js';
import {
  assignQuestionToUser,
  getUserQuestionAssignments
} from '$lib/server/responses.js';

// GET /api/assignments?sessionId=...&userId=... - Get question assignments
export const GET = withAuth(async (event, user) => {
  try {
    const sessionId = event.url.searchParams.get('sessionId');
    const userId = event.url.searchParams.get('userId') || user.uid;
    
    if (!sessionId) {
      return json({ error: 'Session ID is required' }, { status: 400 });
    }

    const assignments = await getUserQuestionAssignments(sessionId, userId, user.uid);
    return json(assignments);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/assignments - Assign a question to a user
export const POST = withAuth(async (event, user) => {
  try {
    const {
      sessionId,
      newsletterId,
      userId,
      questionId
    } = await event.request.json();

    if (!sessionId || !newsletterId || !userId || !questionId) {
      return json({
        error: 'Session ID, newsletter ID, user ID, and question ID are required'
      }, { status: 400 });
    }

    const assignmentId = await assignQuestionToUser(
      sessionId,
      newsletterId,
      userId,
      questionId,
      user.uid
    );

    return json({ id: assignmentId }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
