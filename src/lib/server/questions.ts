import { adminDb } from './admin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { hasNewsletterAccess } from './newsletters.js';

export interface Question {
  id: string;
  text: string;
  source: 'user' | 'admin' | 'llm';
  createdBy: string;
  newsletterId: string;
  createdAt: any;
  usageCount: number;
  isActive: boolean;
  category?: string;
  tags?: string[];
}

/**
 * Gets questions for a newsletter (server-side)
 */
export async function getQuestions(newsletterId: string, userId: string): Promise<Question[]> {
  // Verify user has access to this newsletter
  if (!await hasNewsletterAccess(newsletterId, userId, 'read')) {
    throw new Error('Unauthorized: User cannot access questions for this newsletter');
  }

  const snapshot = await adminDb
    .collection('questions')
    .where('newsletterId', '==', newsletterId)
    .where('isActive', '==', true)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Question));
}

/**
 * Adds a question to a newsletter (server-side)
 */
export async function addQuestion(
  newsletterId: string,
  questionText: string,
  createdBy: string,
  source: 'user' | 'admin' | 'llm' = 'user',
  category?: string,
  tags?: string[]
): Promise<Question> {
  // Verify user has write access to this newsletter
  if (!await hasNewsletterAccess(newsletterId, createdBy, 'write')) {
    throw new Error('Unauthorized: User cannot add questions to this newsletter');
  }

  const questionData = {
    text: questionText,
    source,
    createdBy,
    newsletterId,
    createdAt: FieldValue.serverTimestamp(),
    usageCount: 0,
    isActive: true,
    ...(category && { category }),
    ...(tags && { tags })
  };

  const questionRef = await adminDb.collection('questions').add(questionData);
  
  return {
    id: questionRef.id,
    ...questionData
  } as Question;
}

/**
 * Deletes a question (server-side)
 */
export async function deleteQuestion(questionId: string, userId: string): Promise<void> {
  // Get the question to verify ownership
  const questionDoc = await adminDb.collection('questions').doc(questionId).get();
  
  if (!questionDoc.exists) {
    throw new Error('Question not found');
  }

  const questionData = questionDoc.data()!;
  
  // Verify user has write access to the newsletter
  if (!await hasNewsletterAccess(questionData.newsletterId, userId, 'write')) {
    throw new Error('Unauthorized: User cannot delete questions from this newsletter');
  }

  await adminDb.collection('questions').doc(questionId).update({ isActive: false });
}

/**
 * Increments question usage count (server-side)
 */
export async function incrementQuestionUsage(questionId: string): Promise<void> {
  const questionRef = adminDb.collection('questions').doc(questionId);
  
  await adminDb.runTransaction(async (transaction) => {
    const questionDoc = await transaction.get(questionRef);
    
    if (!questionDoc.exists) {
      throw new Error('Question not found');
    }

    const currentCount = questionDoc.data()?.usageCount || 0;
    transaction.update(questionRef, { usageCount: currentCount + 1 });
  });
}

/**
 * Gets a single question by ID (server-side)
 */
export async function getQuestion(questionId: string, userId: string): Promise<Question | null> {
  const questionDoc = await adminDb.collection('questions').doc(questionId).get();
  
  if (!questionDoc.exists) {
    return null;
  }

  const questionData = questionDoc.data()!;
  
  // Verify user has access to the newsletter this question belongs to
  if (!await hasNewsletterAccess(questionData.newsletterId, userId, 'read')) {
    throw new Error('Unauthorized: User cannot access this question');
  }

  return {
    id: questionDoc.id,
    ...questionData
  } as Question;
}

/**
 * Updates a question (server-side)
 */
export async function updateQuestion(
  questionId: string,
  updates: Partial<Question>,
  userId: string
): Promise<void> {
  // Get the question to verify ownership
  const questionDoc = await adminDb.collection('questions').doc(questionId).get();
  
  if (!questionDoc.exists) {
    throw new Error('Question not found');
  }

  const questionData = questionDoc.data()!;
  
  // Verify user has write access to the newsletter
  if (!await hasNewsletterAccess(questionData.newsletterId, userId, 'write')) {
    throw new Error('Unauthorized: User cannot update questions in this newsletter');
  }

  // Remove fields that shouldn't be updated directly
  const { id, createdAt, createdBy, newsletterId, ...allowedUpdates } = updates;

  await adminDb.collection('questions').doc(questionId).update(allowedUpdates);
}
