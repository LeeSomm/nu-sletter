import { json } from '@sveltejs/kit';
import { withAuth, handleApiError } from '$lib/server/auth.js';
import {
  getNewslettersForUser,
  createNewsletter,
  getNewsletter,
  updateNewsletter,
  deleteNewsletter
} from '$lib/server/newsletters.js';

// GET /api/newsletters - Get newsletters for authenticated user
export const GET = withAuth(async (event, user) => {
  try {
    const newsletters = await getNewslettersForUser(user.uid);
    return json(newsletters);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/newsletters - Create a new newsletter
export const POST = withAuth(async (event, user) => {
  try {
    const { name, description, prompt, settings } = await event.request.json();

    if (!name || !description || !prompt) {
      return json({ error: 'Name, description, and prompt are required' }, { status: 400 });
    }

    const newsletterId = await createNewsletter(
      user.uid,
      name,
      description,
      prompt,
      settings
    );

    return json({ id: newsletterId }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
