import { json } from '@sveltejs/kit';
import { withAdminAuth, handleApiError } from '$lib/server/auth.js';
import { adminDb } from '$lib/server/admin.js';

// GET /api/admin/questions - List all questions
export const GET = withAdminAuth(async (event, user) => {
  try {
    // Get all questions
    const questionsSnapshot = await adminDb.collection('questions').get();
    
    const questions = await Promise.all(
      questionsSnapshot.docs.map(async (doc) => {
        const questionData = doc.data();
        
        // Get newsletter information
        let newsletterName = '';
        if (questionData.newsletterId) {
          try {
            const newsletterDoc = await adminDb
              .collection('newsletters')
              .doc(questionData.newsletterId)
              .get();
            if (newsletterDoc.exists) {
              newsletterName = newsletterDoc.data()?.name || 'Unknown';
            }
          } catch (err) {
            console.warn('Error fetching newsletter for question:', doc.id, err);
          }
        }

        // Get response count for this question
        let responseCount = 0;
        try {
          const responsesSnapshot = await adminDb
            .collection('userResponses')
            .where('questionId', '==', doc.id)
            .get();
          responseCount = responsesSnapshot.docs.length;
        } catch (err) {
          console.warn('Error counting responses for question:', doc.id, err);
        }

        return {
          id: doc.id,
          ...questionData,
          // Convert Firestore Timestamps to ISO strings for JSON serialization
          createdAt: questionData.createdAt?.toDate?.() ? questionData.createdAt.toDate().toISOString() : questionData.createdAt,
          newsletterName,
          responseCount
        };
      })
    );

    return json({
      questions,
      total: questions.length
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// PUT /api/admin/questions - Update question
export const PUT = withAdminAuth(async (event, user) => {
  try {
    const { questionId, updates } = await event.request.json();

    if (!questionId || !updates) {
      return json({ error: 'Question ID and updates are required' }, { status: 400 });
    }

    // Validate allowed fields for admin updates
    const allowedFields = ['text', 'isActive', 'category', 'tags'];
    const filteredUpdates: any = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await adminDb.collection('questions').doc(questionId).update(filteredUpdates);

    return json({ success: true, updated: filteredUpdates });
  } catch (error) {
    return handleApiError(error);
  }
});
