
import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/admin';
import { generateNewsletterSummary } from '$lib/server/newsletter';

export async function POST() {
  try {
    // For now, we'll fetch all responses.
    // In a real app, we'd filter by the current week's session.
    const snapshot = await adminDb.collection('userResponses').get();
    const responses = snapshot.docs.map(doc => doc.data().response as string);

    if (responses.length === 0) {
      return json({ error: 'No responses found to generate a newsletter.' }, { status: 400 });
    }

    const summary = await generateNewsletterSummary(responses);

    return json({ summary });
  } catch (error: any) {
    console.error('Error in /api/generate-newsletter:', error);
    return json({ error: 'Failed to generate newsletter summary.' }, { status: 500 });
  }
}
