<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/authStore';
  import { newsletterApi } from '$lib/api';
  import { goto } from '$app/navigation';

  let newsletter: any | null = null;
  let name = '';
  let prompt = '';
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    const newsletterId = $page.params.id;
    if (newsletterId) {
      const unsubscribe = authStore.subscribe(async (user) => {
        if (user) {
          try {
            newsletter = await newsletterApi.get(newsletterId);
            if (newsletter) {
              name = newsletter.name;
              prompt = newsletter.prompt || '';
            } else {
              error = 'Newsletter not found.';
            }
          } catch (err: any) {
            error = err.message;
          } finally {
            loading = false;
          }
          unsubscribe();
        } else if (user === null) {
          goto('/login');
        }
      });
    }
  });

  async function handleSubmit() {
    if (!name || !prompt) {
      error = 'Please fill out all fields.';
      return;
    }

    loading = true;
    error = null;

    try {
      if (newsletter) {
        await newsletterApi.update(newsletter.id, { name, prompt });
        goto(`/newsletters/${newsletter.id}`);
      }
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="max-w-2xl mx-auto">
  <h1 class="text-3xl font-bold mb-6">Edit Newsletter</h1>

  {#if loading}
    <p>Loading newsletter details...</p>
  {:else if error}
    <p class="text-red-600">{error}</p>
  {:else if newsletter}
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div>
        <label for="name" class="label">
          <span class="label-text">Newsletter Name</span>
        </label>
        <input type="text" id="name" bind:value={name} class="input input-bordered w-full" />
      </div>

      <div>
        <label for="prompt" class="label">
          <span class="label-text">Newsletter Prompt</span>
        </label>
        <textarea id="prompt" bind:value={prompt} class="textarea textarea-bordered w-full" rows="4"></textarea>
        <p class="text-sm text-gray-500 mt-1">This prompt will guide the AI when it generates each newsletter issue.</p>
      </div>

      <button type="submit" class="btn btn-primary" disabled={loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  {/if}
</div>
