<script lang="ts">
  import { authStore } from '$lib/stores/authStore';
  import { newsletterApi } from '$lib/api';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let name = '';
  let description = '';
  let prompt = '';
  let isPublic = true;
  let requireApproval = false;
  let questionSubmissionRequired = false;
  let loading = false;
  let error: string | null = null;

  onMount(() => {
    // Check authentication
    const unsubscribe = authStore.subscribe((user) => {
      if (user === null) {
        goto('/login');
      }
      unsubscribe();
    });
  });

  async function handleSubmit() {
    if (!name || !description || !prompt) {
      error = 'Please fill out all required fields.';
      return;
    }
    if (!$authStore) {
      error = 'You must be logged in to create a newsletter.';
      return;
    }

    loading = true;
    error = null;

    try {
      const result = await newsletterApi.create({
        name,
        description,
        prompt,
        settings: {
          isPublic,
          requireApproval,
          questionSubmissionRequired
        }
      });
      
      if (result.id) {
        goto(`/newsletters/${result.id}`);
      } else {
        error = 'Failed to create newsletter. Please try again.';
      }
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="max-w-2xl mx-auto">
  <h1 class="text-3xl font-bold mb-6">Create a New Newsletter</h1>

  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <div>
      <label for="name" class="label">
        <span class="label-text">Newsletter Name *</span>
      </label>
      <input type="text" id="name" bind:value={name} class="input input-bordered w-full" placeholder="e.g., Weekly Family Updates" required />
    </div>

    <div>
      <label for="description" class="label">
        <span class="label-text">Description *</span>
      </label>
      <textarea id="description" bind:value={description} class="textarea textarea-bordered w-full" rows="2" placeholder="Brief description of your newsletter" required></textarea>
    </div>

    <div>
      <label for="prompt" class="label">
        <span class="label-text">Newsletter Prompt *</span>
      </label>
      <textarea id="prompt" bind:value={prompt} class="textarea textarea-bordered w-full" rows="4" placeholder="e.g., A fun and lighthearted summary of our family's week." required></textarea>
      <p class="text-sm text-gray-500 mt-1">This prompt will guide the AI when it generates each newsletter issue.</p>
    </div>

    <div class="space-y-2">
      <h3 class="text-lg font-medium">Settings</h3>
      
      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text">Public Newsletter</span>
          <input type="checkbox" bind:checked={isPublic} class="toggle toggle-primary" />
        </label>
        <p class="text-sm text-gray-500">Allow anyone to find and join this newsletter</p>
      </div>

      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text">Require Approval</span>
          <input type="checkbox" bind:checked={requireApproval} class="toggle toggle-primary" />
        </label>
        <p class="text-sm text-gray-500">Manually approve new members before they can participate</p>
      </div>

      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text">Question Submission Required</span>
          <input type="checkbox" bind:checked={questionSubmissionRequired} class="toggle toggle-primary" />
        </label>
        <p class="text-sm text-gray-500">Members must submit questions along with their responses</p>
      </div>
    </div>

    {#if error}
      <div class="alert alert-error">
        {error}
      </div>
    {/if}

    <button type="submit" class="btn btn-primary" disabled={loading}>
      {loading ? 'Creating...' : 'Create Newsletter'}
    </button>
  </form>
</div>
