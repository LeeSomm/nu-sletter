import { json } from '@sveltejs/kit';
import { withAdminAuth, handleApiError } from '$lib/server/auth.js';
import { adminDb } from '$lib/server/admin.js';

// GET /api/admin/sessions - List all sessions
export const GET = withAdminAuth(async (event, user) => {
  try {
    // Get all sessions
    const sessionsSnapshot = await adminDb.collection('sessions').get();
    
    const sessions = await Promise.all(
      sessionsSnapshot.docs.map(async (doc) => {
        const sessionData = doc.data();
        
        // Get newsletter information
        let newsletterName = 'Unknown';
        if (sessionData.newsletterId) {
          try {
            const newsletterDoc = await adminDb
              .collection('newsletters')
              .doc(sessionData.newsletterId)
              .get();
            if (newsletterDoc.exists) {
              newsletterName = newsletterDoc.data()?.name || 'Unknown';
            }
          } catch (err) {
            console.warn('Error fetching newsletter for session:', doc.id, err);
          }
        }

        // Count responses for this session
        let responseCount = 0;
        try {
          const responsesSnapshot = await adminDb
            .collection('userResponses')
            .where('sessionId', '==', doc.id)
            .get();
          responseCount = responsesSnapshot.docs.length;
        } catch (err) {
          console.warn('Error counting responses for session:', doc.id, err);
        }

        return {
          id: doc.id,
          ...sessionData,
          // Convert Firestore Timestamps to ISO strings for JSON serialization
          weekStart: sessionData.weekStart?.toDate?.() ? sessionData.weekStart.toDate().toISOString() : sessionData.weekStart,
          weekEnd: sessionData.weekEnd?.toDate?.() ? sessionData.weekEnd.toDate().toISOString() : sessionData.weekEnd,
          createdAt: sessionData.createdAt?.toDate?.() ? sessionData.createdAt.toDate().toISOString() : sessionData.createdAt,
          newsletterName,
          responseCount
        };
      })
    );

    // Sort by week start date (newest first)
    sessions.sort((a, b) => {
      const dateA = new Date(a.weekStart);
      const dateB = new Date(b.weekStart);
      return dateB.getTime() - dateA.getTime();
    });

    return json({
      sessions,
      total: sessions.length
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// PUT /api/admin/sessions - Update session status
export const PUT = withAdminAuth(async (event, user) => {
  try {
    const { sessionId, updates } = await event.request.json();

    if (!sessionId || !updates) {
      return json({ error: 'Session ID and updates are required' }, { status: 400 });
    }

    // Validate allowed fields for admin updates
    const allowedFields = ['status', 'newsletterSent'];
    const filteredUpdates: any = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await adminDb.collection('sessions').doc(sessionId).update(filteredUpdates);

    return json({ success: true, updated: filteredUpdates });
  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE /api/admin/sessions - Delete session (admin only, for cleanup)
export const DELETE = withAdminAuth(async (event, user) => {
  try {
    const { sessionId } = await event.request.json();

    if (!sessionId) {
      return json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Delete the session
    await adminDb.collection('sessions').doc(sessionId).delete();

    // Optionally delete associated responses (commented out for safety)
    // const responsesSnapshot = await adminDb
    //   .collection('responses')
    //   .where('sessionId', '==', sessionId)
    //   .get();
    // 
    // const batch = adminDb.batch();
    // responsesSnapshot.docs.forEach(doc => {
    //   batch.delete(doc.ref);
    // });
    // await batch.commit();

    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
});
