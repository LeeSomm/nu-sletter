import { json } from '@sveltejs/kit';
import { withAdminAuth, handleApiError } from '$lib/server/auth.js';
import { adminDb } from '$lib/server/admin.js';

// GET /api/admin/responses - List all responses
export const GET = withAdminAuth(async (event, user) => {
  try {
    // Get all responses
    const responsesSnapshot = await adminDb.collection('userResponses').get();
    
    const responses = await Promise.all(
      responsesSnapshot.docs.map(async (doc) => {
        const responseData = doc.data();
        
        // Get user information
        let userEmail = 'Unknown';
        if (responseData.userId) {
          try {
            const userDoc = await adminDb
              .collection('users')
              .doc(responseData.userId)
              .get();
            if (userDoc.exists) {
              userEmail = userDoc.data()?.email || 'Unknown';
            }
          } catch (err) {
            console.warn('Error fetching user for response:', doc.id, err);
          }
        }

        // Get question information
        let questionText = 'Unknown';
        let newsletterName = 'Unknown';
        if (responseData.questionId) {
          try {
            const questionDoc = await adminDb
              .collection('questions')
              .doc(responseData.questionId)
              .get();
            if (questionDoc.exists) {
              const questionData = questionDoc.data();
              questionText = questionData?.text || 'Unknown';
              
              // Get newsletter name from question
              if (questionData?.newsletterId) {
                const newsletterDoc = await adminDb
                  .collection('newsletters')
                  .doc(questionData.newsletterId)
                  .get();
                if (newsletterDoc.exists) {
                  newsletterName = newsletterDoc.data()?.name || 'Unknown';
                }
              }
            }
          } catch (err) {
            console.warn('Error fetching question for response:', doc.id, err);
          }
        }

        return {
          id: doc.id,
          ...responseData,
          // Convert Firestore Timestamps to ISO strings for JSON serialization
          submittedAt: responseData.submittedAt?.toDate?.() ? responseData.submittedAt.toDate().toISOString() : responseData.submittedAt,
          userEmail,
          questionText,
          newsletterName
        };
      })
    );

    // Sort by submission date (newest first)
    responses.sort((a, b) => {
      const dateA = new Date(a.submittedAt);
      const dateB = new Date(b.submittedAt);
      return dateB.getTime() - dateA.getTime();
    });

    return json({
      responses,
      total: responses.length
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE /api/admin/responses - Delete response (admin only, for moderation)
export const DELETE = withAdminAuth(async (event, user) => {
  try {
    const { responseId } = await event.request.json();

    if (!responseId) {
      return json({ error: 'Response ID is required' }, { status: 400 });
    }

    await adminDb.collection('userResponses').doc(responseId).delete();

    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
});
