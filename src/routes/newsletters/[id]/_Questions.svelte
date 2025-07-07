<script lang="ts">
  import { onMount } from 'svelte';
  import { questionsApi } from '$lib/api';
  import { authStore } from '$lib/stores/authStore';

  export let newsletterId: string;

  let questions: any[] = [];
  let loading = true;
  let error: string | null = null;
  let newQuestionText = '';
  let adding = false;

  onMount(async () => {
    await loadQuestions();
  });

  async function loadQuestions() {
    loading = true;
    try {
      questions = await questionsApi.getForNewsletter(newsletterId);
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function handleAddQuestion() {
    if (!newQuestionText.trim() || !$authStore) return;
    
    adding = true;
    try {
      await questionsApi.create({
        newsletterId,
        text: newQuestionText.trim(),
        source: 'user'
      });
      newQuestionText = '';
      await loadQuestions();
    } catch (err: any) {
      error = err.message;
    } finally {
      adding = false;
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    try {
      await questionsApi.delete(questionId);
      await loadQuestions();
    } catch (err: any) {
      error = err.message;
    }
  }
</script>

<div>
  <h2 class="text-2xl font-bold mb-4">Questions</h2>

  <div class="mb-6">
    <form on:submit|preventDefault={handleAddQuestion} class="flex gap-2">
      <input type="text" bind:value={newQuestionText} class="input input-bordered w-full" placeholder="e.g., What was the highlight of your week?" disabled={adding} />
      <button type="submit" class="btn btn-primary" disabled={adding || !newQuestionText.trim()}>
        {adding ? 'Adding...' : 'Add'}
      </button>
    </form>
  </div>

  {#if loading}
    <p>Loading questions...</p>
  {:else if error}
    <p class="text-red-600">{error}</p>
  {:else if questions.length === 0}
    <p>No questions have been added to this newsletter yet.</p>
  {:else}
    <ul class="space-y-2">
      {#each questions as question}
        <li class="flex justify-between items-center p-3 bg-base-100 rounded-lg border">
          <div>
            <span class="font-medium">{question.text}</span>
            {#if question.category}
              <span class="ml-2 badge badge-sm badge-outline">{question.category}</span>
            {/if}
            <div class="text-xs text-gray-500 mt-1">
              {question.source} • Used {question.usageCount || 0} times
            </div>
          </div>
          <button on:click={() => handleDeleteQuestion(question.id)} class="btn btn-xs btn-error">Delete</button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
