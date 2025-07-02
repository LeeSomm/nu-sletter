

import { GoogleGenAI } from '@google/genai';
import { GOOGLE_API_KEY } from '$env/static/private';

const genAI = new GoogleGenAI({apiKey: GOOGLE_API_KEY});
const model = 'gemini-2.5-flash'

export async function generateNewsletterSummary(responses: string[]): Promise<string> {
  // const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
    You are a friendly and engaging newsletter editor. 
    Your task is to create a summary of the following responses from a group of friends.
    The summary should be lighthearted, personal, and highlight interesting or funny points.
    Do not just list the responses. Weave them into a cohesive narrative.
    Make it sound like a real person wrote it.

    Here are the responses:
    ${responses.join('\n---\n')}

    Please generate a summary of these responses.
  `;

  try {
    // const result = await model.generateContent(prompt);
    // const response = await result.response;
    // const text = await response.text();
    // return text;
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

