<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/authStore';
  import { questionsApi, responsesApi, sessionsApi } from '$lib/api';

  let questions: any[] = [];
  let responses: { [questionId: string]: string } = {};
  let error: string | null = null;
  let isLoading = true;
  let isSubmitting = false;
  let newsletterId: string;
  let sessionId: string;

  onMount(async () => {
    newsletterId = $page.url.searchParams.get('newsletterId') || '';
    
    if (!newsletterId) {
      error = 'Missing newsletter information.';
      isLoading = false;
      return;
    }

    // Wait for auth to be ready
    const unsubscribe = authStore.subscribe(async (user) => {
      if (user) {
        try {
          // Get the active session for this newsletter
          const activeSession = await sessionsApi.getActive(newsletterId);
          if (!activeSession) {
            error = 'No active session found for this newsletter.';
            isLoading = false;
            return;
          }
          sessionId = activeSession.id;

          // Get questions for the newsletter
          questions = await questionsApi.getForNewsletter(newsletterId);
        } catch (err: any) {
          error = err.message;
        } finally {
          isLoading = false;
        }
        unsubscribe();
      } else if (user === null) {
        goto('/login');
      }
    });
  });

  async function submitResponses() {
    if (!$authStore) {
      error = 'You must be logged in to respond.';
      return;
    }

    if (!sessionId) {
      error = 'No active session found.';
      return;
    }

    isSubmitting = true;
    error = null;

    try {
      // Submit each response individually
      for (const question of questions) {
        const responseText = responses[question.id];
        if (responseText?.trim()) {
          await responsesApi.submit({
            newsletterId,
            sessionId,
            questionId: question.id,
            response: responseText.trim(),
            isPublic: false // You could add a checkbox for this
          });
        }
      }

      // Redirect back to newsletter page
      goto(`/newsletters/${newsletterId}`);
    } catch (err: any) {
      error = err.message;
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="max-w-xl mx-auto">
  <h1 class="text-3xl font-bold mb-4">Respond to Newsletter</h1>

  {#if isLoading}
    <p>Loading questions...</p>
  {:else if error}
    <p class="text-red-600">{error}</p>
  {:else if questions.length === 0}
    <p>There are no questions for this newsletter yet.</p>
  {:else}
    <form on:submit|preventDefault={submitResponses} class="space-y-6">
      {#each questions as question}
        <div>
          <label for="response-{question.id}" class="block text-lg font-medium text-gray-700">{question.text}</label>
          <textarea id="response-{question.id}" bind:value={responses[question.id]} rows="4" class="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required disabled={isSubmitting}></textarea>
        </div>
      {/each}

      <div>
        <button type="submit" class="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Responses'}
        </button>
      </div>
    </form>
  {/if}
</div>