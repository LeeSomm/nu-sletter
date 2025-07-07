import { adminDb } from './admin.js';
import { FieldValue } from 'firebase-admin/firestore';

export interface Newsletter {
  id: string;
  name: string;
  description: string;
  prompt: string;
  owners: string[];
  moderators: string[];
  settings: {
    isPublic: boolean;
    requireApproval: boolean;
    maxMembers?: number;
    questionSubmissionRequired: boolean;
  };
  createdAt: any;
  isActive: boolean;
}

/**
 * Creates a new newsletter (server-side)
 */
export async function createNewsletter(
  ownerId: string,
  name: string,
  description: string,
  prompt: string,
  settings: {
    isPublic?: boolean;
    requireApproval?: boolean;
    maxMembers?: number;
    questionSubmissionRequired?: boolean;
  } = {}
): Promise<string> {
  const newsletterData = {
    name,
    description,
    prompt,
    owners: [ownerId],
    moderators: [],
    settings: {
      isPublic: settings.isPublic ?? true,
      requireApproval: settings.requireApproval ?? false,
      maxMembers: settings.maxMembers,
      questionSubmissionRequired: settings.questionSubmissionRequired ?? false,
    },
    createdAt: FieldValue.serverTimestamp(),
    isActive: true,
  };

  const newsletterRef = await adminDb.collection('newsletters').add(newsletterData);
  return newsletterRef.id;
}

/**
 * Gets newsletters for a user (server-side)
 */
export async function getNewslettersForUser(userId: string): Promise<Newsletter[]> {
  const snapshot = await adminDb
    .collection('newsletters')
    .where('owners', 'array-contains', userId)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Newsletter));
}

/**
 * Gets a single newsletter by ID (server-side)
 */
export async function getNewsletter(newsletterId: string): Promise<Newsletter | null> {
  const doc = await adminDb.collection('newsletters').doc(newsletterId).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return {
    id: doc.id,
    ...doc.data()
  } as Newsletter;
}

/**
 * Updates a newsletter (server-side)
 */
export async function updateNewsletter(
  newsletterId: string,
  data: Partial<Newsletter>,
  userId: string
): Promise<void> {
  // Verify user is owner
  const newsletter = await getNewsletter(newsletterId);
  if (!newsletter || !newsletter.owners.includes(userId)) {
    throw new Error('Unauthorized: User is not an owner of this newsletter');
  }

  await adminDb.collection('newsletters').doc(newsletterId).update(data);
}

/**
 * Deletes a newsletter (server-side)
 */
export async function deleteNewsletter(newsletterId: string, userId: string): Promise<void> {
  // Verify user is owner
  const newsletter = await getNewsletter(newsletterId);
  if (!newsletter || !newsletter.owners.includes(userId)) {
    throw new Error('Unauthorized: User is not an owner of this newsletter');
  }

  await adminDb.collection('newsletters').doc(newsletterId).update({ isActive: false });
}

/**
 * Checks if user has access to newsletter
 */
export async function hasNewsletterAccess(
  newsletterId: string,
  userId: string,
  accessType: 'read' | 'write' = 'read'
): Promise<boolean> {
  const newsletter = await getNewsletter(newsletterId);
  if (!newsletter) return false;

  const isOwner = newsletter.owners.includes(userId);
  const isModerator = newsletter.moderators.includes(userId);

  if (accessType === 'write') {
    return isOwner || isModerator;
  }

  // For read access, check if public or user is member
  if (newsletter.settings.isPublic) return true;
  if (isOwner || isModerator) return true;

  // Check if user is a member
  const userDoc = await adminDb.collection('users').doc(userId).get();
  if (userDoc.exists) {
    const userData = userDoc.data();
    const memberships = userData?.newsletterMemberships || {};
    return memberships[newsletterId]?.isActive === true;
  }

  return false;
}

/**
 * Adds a user to a newsletter
 */
export async function addUserToNewsletter(newsletterId: string, userId: string, addedByUserId: string): Promise<void> {
  // Verify the person adding has write access
  if (!await hasNewsletterAccess(newsletterId, addedByUserId, 'write')) {
    throw new Error('Unauthorized: User cannot add members to this newsletter');
  }

  const userRef = adminDb.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const userData = userDoc.data();
  const memberships = userData?.newsletterMemberships || {};

  memberships[newsletterId] = {
    joinedAt: FieldValue.serverTimestamp(),
    isActive: true,
    answeredQuestions: []
  };

  await userRef.update({ newsletterMemberships: memberships });
}

/**
 * Removes a user from a newsletter
 */
export async function removeUserFromNewsletter(newsletterId: string, userId: string, removedByUserId: string): Promise<void> {
  // Verify the person removing has write access OR user is removing themselves
  const hasAccess = await hasNewsletterAccess(newsletterId, removedByUserId, 'write');
  const isSelfRemoval = userId === removedByUserId;

  if (!hasAccess && !isSelfRemoval) {
    throw new Error('Unauthorized: User cannot remove members from this newsletter');
  }

  const userRef = adminDb.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (userDoc.exists) {
    const userData = userDoc.data();
    const memberships = userData?.newsletterMemberships || {};

    if (memberships[newsletterId]) {
      memberships[newsletterId].isActive = false;
      await userRef.update({ newsletterMemberships: memberships });
    }
  }
}

/**
 * Gets newsletter members
 */
export async function getNewsletterMembers(newsletterId: string, requestingUserId: string): Promise<any[]> {
  // Verify user has access to view members
  if (!await hasNewsletterAccess(newsletterId, requestingUserId, 'read')) {
    throw new Error('Unauthorized: User cannot view members of this newsletter');
  }

  const usersSnapshot = await adminDb
    .collection('users')
    .where(`newsletterMemberships.${newsletterId}.isActive`, '==', true)
    .get();

  return usersSnapshot.docs.map(doc => ({
    id: doc.id,
    email: doc.data().email,
    displayName: doc.data().displayName,
    membership: doc.data().newsletterMemberships?.[newsletterId]
  }));
}
