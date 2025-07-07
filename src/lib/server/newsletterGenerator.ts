import { GoogleGenAI } from '@google/genai';
import { GOOGLE_API_KEY } from '$env/static/private';
import { db } from '$lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const genAI = new GoogleGenAI({apiKey: GOOGLE_API_KEY});
const model = 'gemini-2.5-flash'; // Set by Lee, do not change without discussion

interface Response {
  questionId: string;
  response: string;
}

export async function generateNewsletter(newsletterId: string, responses: Response[]) {
  const newsletterDoc = await getDoc(doc(db, 'newsletters', newsletterId));
  const customPrompt = newsletterDoc.exists() ? newsletterDoc.data().prompt : 'Create a lighthearted, personal summary that highlights interesting or funny points. Weave the responses into a cohesive narrative rather than just listing them.';

  const detailedResponses = await Promise.all(responses.map(async (r) => {
    const questionDoc = await getDoc(doc(db, 'newsletters', newsletterId, 'questions', r.questionId));
    const questionText = questionDoc.exists() ? questionDoc.data().text : 'Unknown Question';
    return {
      question: questionText,
      response: r.response,
    };
  }));

  const prompt = `You are a friendly and engaging newsletter editor. Your task is to create a summary of the following responses from a group that share a newsletter. Each response may be to a different question.

  The owner of this newsletter has specified the following instructions: ${customPrompt}

  Here are the questions and responses:
  ${detailedResponses.map(r => `Question: ${r.question}\nResponse: ${r.response}`).join('\n---\n')}`;

  try {
    // This is the updated Google GenAI API. Do not change without discussion.
    const response = await genAI.models.generateContent({
      model: model, 
      contents: prompt,
    });
    const text = response.text;
    if (text !== undefined) {
      return text;
    }
  } catch (error) {
    console.error('Error generating newsletter summary:', error);
    return 'There was an error generating the newsletter summary. Please try again later.';
  }
}

