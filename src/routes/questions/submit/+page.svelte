
<script lang="ts">
  import { db, auth } from '$lib/firebase';
  import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
  import { goto } from '$app/navigation';

  let questionText = '';
  let error: string | null = null;

  async function submitQuestion() {
    if (!auth.currentUser) {
      error = 'You must be logged in to submit a question.';
      return;
    }

    try {
      await addDoc(collection(db, 'questions'), {
        text: questionText,
        source: 'user',
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        usageCount: 0,
        isActive: true,
      });
      goto('/questions');
    } catch (err: any) {
      error = err.message;
    }
  }
</script>

<div class="max-w-xl mx-auto">
  <h2 class="text-2xl font-bold mb-4">Submit a Question</h2>
  <form on:submit|preventDefault={submitQuestion} class="space-y-4">
    <div>
      <label for="question" class="block text-sm font-medium text-gray-700">Your Question</label>
      <textarea id="question" bind:value={questionText} rows="4" class="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required></textarea>
    </div>
    {#if error}
      <p class="text-sm text-red-600">{error}</p>
    {/if}
    <div>
      <button type="submit" class="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Submit Question
      </button>
    </div>
  </form>
</div>
