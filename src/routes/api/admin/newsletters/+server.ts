import { json } from '@sveltejs/kit';
import { withAdminAuth, handleApiError } from '$lib/server/auth.js';
import { adminDb } from '$lib/server/admin.js';

// GET /api/admin/newsletters - List all newsletters
export const GET = withAdminAuth(async (event, user) => {
  try {
    // Get all newsletters
    const newslettersSnapshot = await adminDb.collection('newsletters').get();
    
    const newsletters = await Promise.all(
      newslettersSnapshot.docs.map(async (doc) => {
        const newsletterData = doc.data();
        
        // Get membership count for this newsletter
        const membershipsSnapshot = await adminDb
          .collection('newsletterMemberships')
          .where('newsletterId', '==', doc.id)
          .where('isActive', '==', true)
          .get();

        // Get owner information
        const ownerMembership = membershipsSnapshot.docs.find(
          memberDoc => memberDoc.data().role === 'owner'
        );
        
        let ownerEmail = 'Unknown';
        if (ownerMembership) {
          const ownerDoc = await adminDb
            .collection('users')
            .doc(ownerMembership.data().userId)
            .get();
          if (ownerDoc.exists) {
            ownerEmail = ownerDoc.data()?.email || 'Unknown';
          }
        }

        return {
          id: doc.id,
          ...newsletterData,
          // Convert Firestore Timestamps to ISO strings for JSON serialization
          createdAt: newsletterData.createdAt?.toDate?.() ? newsletterData.createdAt.toDate().toISOString() : newsletterData.createdAt,
          memberCount: membershipsSnapshot.docs.length,
          ownerEmail
        };
      })
    );

    return json({
      newsletters,
      total: newsletters.length
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// PUT /api/admin/newsletters - Update newsletter
export const PUT = withAdminAuth(async (event, user) => {
  try {
    const { newsletterId, updates } = await event.request.json();

    if (!newsletterId || !updates) {
      return json({ error: 'Newsletter ID and updates are required' }, { status: 400 });
    }

    // Validate allowed fields for admin updates
    const allowedFields = ['name', 'description', 'prompt', 'isActive', 'settings'];
    const filteredUpdates: any = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await adminDb.collection('newsletters').doc(newsletterId).update(filteredUpdates);

    return json({ success: true, updated: filteredUpdates });
  } catch (error) {
    return handleApiError(error);
  }
});
