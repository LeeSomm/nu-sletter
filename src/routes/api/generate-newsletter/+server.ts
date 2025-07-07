
import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/admin';
import { generateNewsletter } from '$lib/server/newsletterGenerator';
import { createIssue } from '$lib/server/newsletters';

export async function POST({ request }) {
  try {
    const { newsletterId, issueId } = await request.json();

    if (!newsletterId || !issueId) {
      return json({ error: 'newsletterId and issueId are required.' }, { status: 400 });
    }

    const snapshot = await adminDb.collection('newsletters').doc(newsletterId).collection('issues').doc(issueId).collection('responses').get();
    const responses = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        questionId: data.questionId,
        response: data.response,
      };
    });

    if (responses.length === 0) {
      return json({ error: 'No responses found to generate a newsletter.' }, { status: 400 });
    }

    const summary = await generateNewsletter(newsletterId, responses);

    // Store the generated summary in the issue document
    await adminDb.collection('newsletters').doc(newsletterId).collection('issues').doc(issueId).update({
      content: summary,
    });

    return json({ summary });
  } catch (error: any) {
    console.error('Error in /api/generate-newsletter:', error);
    return json({ error: 'Failed to generate newsletter summary.' }, { status: 500 });
  }
}
