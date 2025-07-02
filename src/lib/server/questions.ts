
import { db } from '$lib/firebase/admin';
import { collection, getDocs, query, where, doc, setDoc, writeBatch } from 'firebase/firestore';

interface Question {
  id: string;
  text: string;
}

interface User {
  uid: string;
  answeredQuestions: string[];
}

export async function assignWeeklyQuestions() {
  console.log("Starting weekly question assignment...");

  try {
    // 1. Fetch all active questions
    const questionsQuery = query(collection(db, 'questions'), where('isActive', '==', true));
    const questionsSnapshot = await getDocs(questionsQuery);
    const allQuestions: Question[] = questionsSnapshot.docs.map(doc => ({ id: doc.id, text: doc.data().text }));

    // 2. Fetch all active users
    const usersQuery = query(collection(db, 'users'), where('isActive', '==', true));
    const usersSnapshot = await getDocs(usersQuery);
    const allUsers: User[] = usersSnapshot.docs.map(doc => ({ uid: doc.id, answeredQuestions: doc.data().answeredQuestions || [] }));

    const batch = writeBatch(db);
    const weeklyAssignments: { [userId: string]: string } = {};

    // 3. For each user, find a question they haven't answered
    for (const user of allUsers) {
      const availableQuestions = allQuestions.filter(q => !user.answeredQuestions.includes(q.id));

      if (availableQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        const assignedQuestion = availableQuestions[randomIndex];
        
        weeklyAssignments[user.uid] = assignedQuestion.id;

        // Update user's answered questions list
        const userRef = doc(db, 'users', user.uid);
        batch.update(userRef, {
          answeredQuestions: [...user.answeredQuestions, assignedQuestion.id]
        });

      } else {
        // Handle case where user has answered all available questions
        // Maybe generate a new one with LLM or reuse the oldest one
        console.warn(`User ${user.uid} has answered all available questions.`);
        // For now, we'll just assign a random one from the whole pool
        const randomIndex = Math.floor(Math.random() * allQuestions.length);
        weeklyAssignments[user.uid] = allQuestions[randomIndex].id;
      }
    }

    // 4. Store assignments in a new weekly session document
    const weekId = `${new Date().getFullYear()}-W${getWeekNumber(new Date())}`;
    const sessionRef = doc(db, 'weeklySessions', weekId);
    batch.set(sessionRef, {
      assignments: weeklyAssignments,
      createdAt: new Date(),
    });

    await batch.commit();
    console.log(`Successfully assigned questions for week ${weekId}`);

  } catch (error) {
    console.error("Error assigning weekly questions:", error);
  }
}

function getWeekNumber(d: Date): number {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
  return weekNo;
}
