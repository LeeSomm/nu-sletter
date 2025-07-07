import { json } from '@sveltejs/kit';
import { withAuth, handleApiError } from '$lib/server/auth.js';
import {
  getQuestions,
  addQuestion,
  deleteQuestion,
  updateQuestion
} from '$lib/server/questions.js';

// GET /api/questions?newsletterId=... - Get questions for a newsletter
export const GET = withAuth(async (event, user) => {
  try {
    const newsletterId = event.url.searchParams.get('newsletterId');
    
    if (!newsletterId) {
      return json({ error: 'Newsletter ID is required' }, { status: 400 });
    }

    const questions = await getQuestions(newsletterId, user.uid);
    return json(questions);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/questions - Create a new question
export const POST = withAuth(async (event, user) => {
  try {
    const { newsletterId, text, source = 'user', category, tags } = await event.request.json();

    if (!newsletterId || !text) {
      return json({ error: 'Newsletter ID and question text are required' }, { status: 400 });
    }

    const question = await addQuestion(
      newsletterId,
      text,
      user.uid,
      source,
      category,
      tags
    );

    return json(question, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
