import { adminDb } from './admin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { hasNewsletterAccess } from './newsletters.js';

export interface UserResponse {
  id: string;
  newsletterId: string;
  sessionId: string;
  userId: string;
  questionId: string;
  response: string;
  submittedQuestion?: string;
  submittedAt: any;
  wordCount: number;
  isPublic: boolean;
}

export interface Session {
  id: string;
  newsletterId: string;
  weekIdentifier: string;
  weekStart: any;
  weekEnd: any;
  status: 'active' | 'pending' | 'completed';
  newsletterSent: boolean;
  participantCount: number;
  createdAt: any;
  generatedNewsletter?: string;
}

export interface QuestionAssignment {
  id: string;
  sessionId: string;
  newsletterId: string;
  userId: string;
  questionId: string;
  assignedAt: any;
  answered: boolean;
}

/**
 * Submits a user response (server-side)
 */
export async function submitUserResponse(
  newsletterId: string,
  sessionId: string,
  userId: string,
  questionId: string,
  response: string,
  isPublic: boolean = false,
  submittedQuestion?: string
): Promise<UserResponse> {
  // Verify user has access to this newsletter
  if (!await hasNewsletterAccess(newsletterId, userId, 'read')) {
    throw new Error('Unauthorized: User cannot submit responses to this newsletter');
  }

  // Verify the session exists and belongs to the newsletter
  const sessionDoc = await adminDb.collection('sessions').doc(sessionId).get();
  if (!sessionDoc.exists || sessionDoc.data()?.newsletterId !== newsletterId) {
    throw new Error('Invalid session');
  }

  const responseData = {
    newsletterId,
    sessionId,
    userId,
    questionId,
    response,
    submittedAt: FieldValue.serverTimestamp(),
    wordCount: response.split(/\s+/).length,
    isPublic,
    ...(submittedQuestion && { submittedQuestion })
  };

  const responseRef = await adminDb.collection('userResponses').add(responseData);
  
  // Mark the question assignment as answered
  await markQuestionAsAnswered(sessionId, userId, questionId);

  return {
    id: responseRef.id,
    ...responseData
  } as UserResponse;
}

/**
 * Gets responses for a session (server-side)
 */
export async function getSessionResponses(sessionId: string, userId: string): Promise<UserResponse[]> {
  // Get the session to verify newsletter access
  const sessionDoc = await adminDb.collection('sessions').doc(sessionId).get();
  if (!sessionDoc.exists) {
    throw new Error('Session not found');
  }

  const newsletterId = sessionDoc.data()?.newsletterId;
  if (!await hasNewsletterAccess(newsletterId, userId, 'read')) {
    throw new Error('Unauthorized: User cannot access responses for this session');
  }

  const snapshot = await adminDb
    .collection('userResponses')
    .where('sessionId', '==', sessionId)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as UserResponse));
}

/**
 * Gets responses for a specific user in a session (server-side)
 */
export async function getUserSessionResponses(sessionId: string, targetUserId: string, requestingUserId: string): Promise<UserResponse[]> {
  // Get the session to verify newsletter access
  const sessionDoc = await adminDb.collection('sessions').doc(sessionId).get();
  if (!sessionDoc.exists) {
    throw new Error('Session not found');
  }

  const newsletterId = sessionDoc.data()?.newsletterId;
  
  // User can view their own responses, or if they have write access to the newsletter
  const canViewResponses = targetUserId === requestingUserId || 
                           await hasNewsletterAccess(newsletterId, requestingUserId, 'write');
  
  if (!canViewResponses) {
    throw new Error('Unauthorized: User cannot view these responses');
  }

  const snapshot = await adminDb
    .collection('userResponses')
    .where('sessionId', '==', sessionId)
    .where('userId', '==', targetUserId)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as UserResponse));
}

/**
 * Creates a new session (server-side)
 */
export async function createSession(
  newsletterId: string,
  weekIdentifier: string,
  weekStart: Date,
  weekEnd: Date,
  userId: string
): Promise<string> {
  // Verify user has write access to this newsletter
  if (!await hasNewsletterAccess(newsletterId, userId, 'write')) {
    throw new Error('Unauthorized: User cannot create sessions for this newsletter');
  }

  const sessionData = {
    newsletterId,
    weekIdentifier,
    weekStart: FieldValue.serverTimestamp(),
    weekEnd: FieldValue.serverTimestamp(),
    status: 'active' as const,
    newsletterSent: false,
    participantCount: 0,
    createdAt: FieldValue.serverTimestamp()
  };

  const sessionRef = await adminDb.collection('sessions').add(sessionData);
  return sessionRef.id;
}

/**
 * Gets the active session for a newsletter (server-side)
 */
export async function getActiveSession(newsletterId: string, userId: string): Promise<Session | null> {
  // Verify user has access to this newsletter
  if (!await hasNewsletterAccess(newsletterId, userId, 'read')) {
    throw new Error('Unauthorized: User cannot access sessions for this newsletter');
  }

  const snapshot = await adminDb
    .collection('sessions')
    .where('newsletterId', '==', newsletterId)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  } as Session;
}

/**
 * Assigns a question to a user (server-side)
 */
export async function assignQuestionToUser(
  sessionId: string,
  newsletterId: string,
  userId: string,
  questionId: string,
  assignedByUserId: string
): Promise<string> {
  // Verify user has write access to this newsletter
  if (!await hasNewsletterAccess(newsletterId, assignedByUserId, 'write')) {
    throw new Error('Unauthorized: User cannot assign questions for this newsletter');
  }

  const assignmentData = {
    sessionId,
    newsletterId,
    userId,
    questionId,
    assignedAt: FieldValue.serverTimestamp(),
    answered: false
  };

  const assignmentRef = await adminDb.collection('questionAssignments').add(assignmentData);
  return assignmentRef.id;
}

/**
 * Gets question assignments for a user in a session (server-side)
 */
export async function getUserQuestionAssignments(sessionId: string, targetUserId: string, requestingUserId: string): Promise<QuestionAssignment[]> {
  // Get the session to verify newsletter access
  const sessionDoc = await adminDb.collection('sessions').doc(sessionId).get();
  if (!sessionDoc.exists) {
    throw new Error('Session not found');
  }

  const newsletterId = sessionDoc.data()?.newsletterId;
  
  // User can view their own assignments, or if they have read access to the newsletter
  const canViewAssignments = targetUserId === requestingUserId || 
                             await hasNewsletterAccess(newsletterId, requestingUserId, 'read');
  
  if (!canViewAssignments) {
    throw new Error('Unauthorized: User cannot view these assignments');
  }

  const snapshot = await adminDb
    .collection('questionAssignments')
    .where('sessionId', '==', sessionId)
    .where('userId', '==', targetUserId)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as QuestionAssignment));
}

/**
 * Marks a question assignment as answered (server-side)
 */
async function markQuestionAsAnswered(sessionId: string, userId: string, questionId: string): Promise<void> {
  const snapshot = await adminDb
    .collection('questionAssignments')
    .where('sessionId', '==', sessionId)
    .where('userId', '==', userId)
    .where('questionId', '==', questionId)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const assignmentRef = adminDb.collection('questionAssignments').doc(snapshot.docs[0].id);
    await assignmentRef.update({ answered: true });
  }
}

/**
 * Updates a session (server-side)
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<Session>,
  userId: string
): Promise<void> {
  const sessionDoc = await adminDb.collection('sessions').doc(sessionId).get();
  
  if (!sessionDoc.exists) {
    throw new Error('Session not found');
  }

  const sessionData = sessionDoc.data()!;
  
  // Verify user has write access to the newsletter
  if (!await hasNewsletterAccess(sessionData.newsletterId, userId, 'write')) {
    throw new Error('Unauthorized: User cannot update this session');
  }

  // Remove fields that shouldn't be updated directly
  const { id, createdAt, newsletterId, ...allowedUpdates } = updates;

  await adminDb.collection('sessions').doc(sessionId).update(allowedUpdates);
}
