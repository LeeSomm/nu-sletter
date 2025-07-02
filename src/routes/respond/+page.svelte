
<script lang="ts">
  import { db, auth } from '$lib/firebase';
  import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/authStore';

  let weeklyQuestion: string | null = "What's one thing you're looking forward to this week?";
  let responseText = '';
  let submittedQuestionText = '';
  let error: string | null = null;

  async function submitResponse() {
    if (!$authStore) {
      error = 'You must be logged in to submit a response.';
      return;
    }

    try {
      // In a real app, we'd fetch the actual weekly question for the user
      // For now, we'll use the hardcoded one.
      const questionId = 'hardcoded-question-id'; 

      await addDoc(collection(db, 'userResponses'), {
        userId: $authStore.uid,
        // sessionId would be the current week's session ID
        sessionId: '2025-W27', 
        questionId: questionId,
        response: responseText,
        submittedQuestion: submittedQuestionText,
        submittedAt: serverTimestamp(),
        wordCount: responseText.split(' ').filter(Boolean).length,
      });

      // Also add the submitted question to the questions collection
      await addDoc(collection(db, 'questions'), {
        text: submittedQuestionText,
        source: 'user',
        createdBy: $authStore.uid,
        createdAt: serverTimestamp(),
        usageCount: 0,
        isActive: true,
      });

      goto('/');
    } catch (err: any) {
      error = err.message;
    }
  }
</script>

<div class="max-w-xl mx-auto">
  <h1 class="text-3xl font-bold mb-4">This Week's Question</h1>
  <div class="p-6 bg-white rounded-lg shadow mb-6">
    <p class="text-xl">{weeklyQuestion}</p>
  </div>

  <h2 class="text-2xl font-bold mb-4">Your Response</h2>
  <form on:submit|preventDefault={submitResponse} class="space-y-6">
    <div>
      <label for="response" class="block text-sm font-medium text-gray-700">Your Answer</label>
      <textarea id="response" bind:value={responseText} rows="6" class="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required></textarea>
    </div>
    <div>
      <label for="submitted-question" class="block text-sm font-medium text-gray-700">Submit a Question for a Future Week</label>
      <input type="text" id="submitted-question" bind:value={submittedQuestionText} class="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
    </div>
    {#if error}
      <p class="text-sm text-red-600">{error}</p>
    {/if}
    <div>
      <button type="submit" class="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Submit Response & Question
      </button>
    </div>
  </form>
</div>
