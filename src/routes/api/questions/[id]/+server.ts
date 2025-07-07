import { json } from '@sveltejs/kit';
import { withAuth, handleApiError } from '$lib/server/auth.js';
import {
  getQuestion,
  deleteQuestion,
  updateQuestion
} from '$lib/server/questions.js';

// GET /api/questions/[id] - Get a specific question
export const GET = withAuth(async (event, user) => {
  try {
    const questionId = event.params.id;
    
    if (!questionId) {
      return json({ error: 'Question ID is required' }, { status: 400 });
    }

    const question = await getQuestion(questionId, user.uid);
    
    if (!question) {
      return json({ error: 'Question not found' }, { status: 404 });
    }

    return json(question);
  } catch (error) {
    return handleApiError(error);
  }
});

// PUT /api/questions/[id] - Update a question
export const PUT = withAuth(async (event, user) => {
  try {
    const questionId = event.params.id;
    
    if (!questionId) {
      return json({ error: 'Question ID is required' }, { status: 400 });
    }

    const updates = await event.request.json();

    await updateQuestion(questionId, updates, user.uid);

    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE /api/questions/[id] - Delete a question
export const DELETE = withAuth(async (event, user) => {
  try {
    const questionId = event.params.id;
    
    if (!questionId) {
      return json({ error: 'Question ID is required' }, { status: 400 });
    }

    await deleteQuestion(questionId, user.uid);

    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
});
