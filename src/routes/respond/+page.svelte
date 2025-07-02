
<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$lib/firebase';
  import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/authStore';

  let weeklyQuestion: string | null = "What's one thing you're looking forward to this week?";
  let responseText = '';
  let submittedQuestionText = '';
  let error: string | null = null;
  let existingResponseId: string | null = null;
  let isLoading = true;
  let isSubmitting = false;

  // Hardcoded session ID for now
  const sessionId = '2025-W27';

  onMount(async () => {
    const unsubscribe = authStore.subscribe(async (user) => {
      if (user) {
        const q = query(
          collection(db, 'userResponses'),
          where('userId', '==', user.uid),
          where('sessionId', '==', sessionId)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const existingResponse = querySnapshot.docs[0].data();
          existingResponseId = querySnapshot.docs[0].id;
          responseText = existingResponse.response;
          submittedQuestionText = existingResponse.submittedQuestion;
        }
      }
      isLoading = false;
    });
    return unsubscribe;
  });

  async function submitResponse() {
    if (!$authStore) {
      error = 'You must be logged in to submit a response.';
      return;
    }

    isSubmitting = true;
    error = null;

    try {
      const questionId = 'hardcoded-question-id';

      const responseData = {
        userId: $authStore.uid,
        sessionId: sessionId,
        questionId: questionId,
        response: responseText,
        submittedQuestion: submittedQuestionText,
        submittedAt: serverTimestamp(),
        wordCount: responseText.split(' ').filter(Boolean).length,
      };

      if (existingResponseId) {
        // Update existing response
        const responseRef = doc(db, 'userResponses', existingResponseId);
        await updateDoc(responseRef, responseData);
      } else {
        // Add new response
        const newResponseRef = await addDoc(collection(db, 'userResponses'), responseData);
        existingResponseId = newResponseRef.id;
        
        // Only add the submitted question to the questions collection on initial submission
        await addDoc(collection(db, 'questions'), {
            text: submittedQuestionText,
            source: 'user',
            createdBy: $authStore.uid,
            createdAt: serverTimestamp(),
            usageCount: 0,
            isActive: true,
        });
      }

      goto('/');
    } catch (err: any) {
      error = err.message;
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="max-w-xl mx-auto">
  <h1 class="text-3xl font-bold mb-4">This Week's Question</h1>
  <div class="p-6 bg-white rounded-lg shadow mb-6">
    <p class="text-xl">{weeklyQuestion}</p>
  </div>

  {#if isLoading}
    <p>Loading your response...</p>
  {:else}
    <h2 class="text-2xl font-bold mb-4">Your Response</h2>
    <form on:submit|preventDefault={submitResponse} class="space-y-6">
      <div>
        <label for="response" class="block text-sm font-medium text-gray-700">Your Answer</label>
        <textarea id="response" bind:value={responseText} rows="6" class="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required disabled={isSubmitting}></textarea>
      </div>
      <div>
        <label for="submitted-question" class="block text-sm font-medium text-gray-700">Submit a Question for a Future Week</label>
        <input type="text" id="submitted-question" bind:value={submittedQuestionText} class="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required disabled={isSubmitting} />
      </div>
      {#if error}
        <p class="text-sm text-red-600">{error}</p>
      {/if}
      <div>
        <button type="submit" class="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50" disabled={isSubmitting}>
          {#if isSubmitting}
            Submitting...
          {:else}
            {existingResponseId ? 'Update' : 'Submit'} Response & Question
          {/if}
        </button>
      </div>
    </form>
  {/if}
</div>
