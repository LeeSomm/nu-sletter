import { adminDb } from './admin.js';
import { FieldValue } from 'firebase-admin/firestore';

export interface Newsletter {
  id: string;
  name: string;
  description: string;
  prompt: string;
  settings: {
    isPublic: boolean;
    requireApproval: boolean;
    maxMembers?: number;
    questionSubmissionRequired: boolean;
  };
  createdAt: any;
  isActive: boolean;
}

export interface NewsletterMembership {
  id: string;
  newsletterId: string;
  userId: string;
  role: 'owner' | 'moderator' | 'member';
  joinedAt: any;
  isActive: boolean;
  answeredQuestions: string[];
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
    settings: {
      isPublic: settings.isPublic ?? true,
      requireApproval: settings.requireApproval ?? false,
      maxMembers: settings.maxMembers ?? 100, // Default max members. Current setup does not pass maxMembers value.
      questionSubmissionRequired: settings.questionSubmissionRequired ?? false,
    },
    createdAt: FieldValue.serverTimestamp(),
    isActive: true,
  };

  const newsletterRef = await adminDb.collection('newsletters').add(newsletterData);
  
  // Create owner membership
  await adminDb.collection('newsletterMemberships').add({
    newsletterId: newsletterRef.id,
    userId: ownerId,
    role: 'owner',
    joinedAt: FieldValue.serverTimestamp(),
    isActive: true,
    answeredQuestions: []
  });
  
  return newsletterRef.id;
}

/**
 * Gets newsletters for a user (server-side)
 */
export async function getNewslettersForUser(userId: string): Promise<Newsletter[]> {
  // Get user's newsletter memberships
  const membershipsSnapshot = await adminDb
    .collection('newsletterMemberships')
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .get();

  if (membershipsSnapshot.empty) {
    return [];
  }

  const newsletterIds = membershipsSnapshot.docs.map(doc => doc.data().newsletterId);
  
  // Get the newsletters
  const newsletters: Newsletter[] = [];
  for (const newsletterId of newsletterIds) {
    const newsletter = await getNewsletter(newsletterId);
    if (newsletter) {
      newsletters.push(newsletter);
    }
  }

  return newsletters;
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
  // Verify user has owner or moderator access
  const membership = await getUserMembership(newsletterId, userId);
  if (!membership || (membership.role !== 'owner' && membership.role !== 'moderator')) {
    throw new Error('Unauthorized: User is not an owner or moderator of this newsletter');
  }

  await adminDb.collection('newsletters').doc(newsletterId).update(data);
}

/**
 * Deletes a newsletter (server-side)
 */
export async function deleteNewsletter(newsletterId: string, userId: string): Promise<void> {
  // Verify user is owner
  const membership = await getUserMembership(newsletterId, userId);
  if (!membership || membership.role !== 'owner') {
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

  const membership = await getUserMembership(newsletterId, userId);
  
  if (accessType === 'write') {
    return membership?.role === 'owner' || membership?.role === 'moderator';
  }

  // For read access, check if public or user is member
  if (newsletter.settings.isPublic) return true;
  return membership !== null;
}

/**
 * Adds a user to a newsletter
 */
export async function addUserToNewsletter(
  newsletterId: string, 
  userId: string, 
  addedByUserId: string,
  role: 'member' | 'moderator' = 'member'
): Promise<void> {
  // Verify the person adding has write access
  if (!await hasNewsletterAccess(newsletterId, addedByUserId, 'write')) {
    throw new Error('Unauthorized: User cannot add members to this newsletter');
  }

  // Check if user already has an active membership
  const existingMembership = await getUserMembership(newsletterId, userId);
  if (existingMembership) {
    throw new Error('User is already a member of this newsletter');
  }

  // Check if user exists
  const userDoc = await adminDb.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  // Create new membership
  await adminDb.collection('newsletterMemberships').add({
    newsletterId,
    userId,
    role,
    joinedAt: FieldValue.serverTimestamp(),
    isActive: true,
    answeredQuestions: []
  });
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

  // Get the membership to deactivate
  const membership = await getUserMembership(newsletterId, userId);
  if (!membership) {
    throw new Error('User is not a member of this newsletter');
  }

  // Owners cannot be removed unless they're removing themselves
  if (membership.role === 'owner' && !isSelfRemoval) {
    throw new Error('Cannot remove newsletter owner');
  }

  // Deactivate the membership
  await adminDb.collection('newsletterMemberships').doc(membership.id).update({
    isActive: false
  });
}

/**
 * Gets newsletter members
 */
export async function getNewsletterMembers(newsletterId: string, requestingUserId: string): Promise<any[]> {
  // Verify user has access to view members
  if (!await hasNewsletterAccess(newsletterId, requestingUserId, 'read')) {
    throw new Error('Unauthorized: User cannot view members of this newsletter');
  }

  const membershipsSnapshot = await adminDb
    .collection('newsletterMemberships')
    .where('newsletterId', '==', newsletterId)
    .where('isActive', '==', true)
    .get();

  const members = [];
  for (const membershipDoc of membershipsSnapshot.docs) {
    const membershipData = membershipDoc.data();
    const userDoc = await adminDb.collection('users').doc(membershipData.userId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data()!;
      members.push({
        id: membershipData.userId,
        email: userData.email,
        displayName: userData.displayName,
        membership: {
          id: membershipDoc.id,
          role: membershipData.role,
          joinedAt: membershipData.joinedAt,
          answeredQuestions: membershipData.answeredQuestions
        }
      });
    }
  }

  return members;
}

/**
 * Gets a user's membership for a specific newsletter
 */
export async function getUserMembership(newsletterId: string, userId: string): Promise<NewsletterMembership | null> {
  const snapshot = await adminDb
    .collection('newsletterMemberships')
    .where('newsletterId', '==', newsletterId)
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  } as NewsletterMembership;
}

/**
 * Updates a user's role in a newsletter
 */
export async function updateUserRole(
  newsletterId: string,
  targetUserId: string,
  newRole: 'member' | 'moderator' | 'owner',
  requestingUserId: string
): Promise<void> {
  // Only owners can change roles
  const requestingUserMembership = await getUserMembership(newsletterId, requestingUserId);
  if (!requestingUserMembership || requestingUserMembership.role !== 'owner') {
    throw new Error('Unauthorized: Only owners can update user roles');
  }

  const targetMembership = await getUserMembership(newsletterId, targetUserId);
  if (!targetMembership) {
    throw new Error('User is not a member of this newsletter');
  }

  await adminDb.collection('newsletterMemberships').doc(targetMembership.id).update({
    role: newRole
  });
}
