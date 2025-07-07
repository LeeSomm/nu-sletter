<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { newsletterApi } from '$lib/api';
  import { authStore } from '$lib/stores/authStore';
  import { goto } from '$app/navigation';

  import Issues from './_Issues.svelte';
  import Subscribers from './_Subscribers.svelte';
  import Questions from './_Questions.svelte';

  let newsletter: any = null;
  let loading = true;
  let error: string | null = null;
  let activeTab = 'issues';

  onMount(async () => {
    const newsletterId = $page.params.id;
    if (!newsletterId) {
      error = 'Invalid newsletter ID';
      loading = false;
      return;
    }

    // Wait for auth to be ready
    const unsubscribe = authStore.subscribe(async (user) => {
      if (user) {
        try {
          newsletter = await newsletterApi.get(newsletterId);
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
  });
</script>

<div class="max-w-6xl mx-auto">
  {#if loading}
    <p>Loading...</p>
  {:else if error}
    <p class="text-red-600">{error}</p>
  {:else if newsletter}
    <div class="mb-6">
      <h1 class="text-4xl font-bold">{newsletter.name}</h1>
      <p class="text-gray-500 mt-2">"{newsletter.prompt}"</p>
      <button on:click={() => goto(`/newsletters/${newsletter?.id}/edit`)} class="btn btn-sm btn-outline mt-4">
        Edit Settings
      </button>
    </div>

    <div class="tabs tabs-boxed mb-6">
      <a class="tab" class:tab-active={activeTab === 'issues'} on:click={() => activeTab = 'issues'}>Issues</a>
      <a class="tab" class:tab-active={activeTab === 'subscribers'} on:click={() => activeTab = 'subscribers'}>Subscribers</a>
      <a class="tab" class:tab-active={activeTab === 'questions'} on:click={() => activeTab = 'questions'}>Questions</a>
    </div>

    <div>
      {#if activeTab === 'issues'}
        <Issues newsletterId={newsletter.id} />
      {:else if activeTab === 'subscribers'}
        <Subscribers newsletterId={newsletter.id} />
      {:else if activeTab === 'questions'}
        <Questions newsletterId={newsletter.id} />
      {/if}
    </div>

  {:else}
    <p>Newsletter not found.</p>
  {/if}
</div>
