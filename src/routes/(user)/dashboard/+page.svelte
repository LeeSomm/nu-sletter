
<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/authStore';
  import { newsletterApi } from '$lib/api';
  import { goto } from '$app/navigation';

  let newsletters: any[] = [];
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    // Wait for auth to be ready
    const unsubscribe = authStore.subscribe(async (user) => {
      if (user) {
        try {
          newsletters = await newsletterApi.getAll();
        } catch (err: any) {
          error = err.message;
        } finally {
          loading = false;
        }
      } else if (user === null) {
        // User is not authenticated, redirect to login
        goto('/login');
      }
      // Unsubscribe after handling any defined state
      if (user !== undefined) {
        unsubscribe();
      }

    });
  });

  function handleCreateNewsletter() {
    goto('/newsletters/create');
  }
</script>

<div class="max-w-4xl mx-auto">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">My Newsletters</h1>
    <button on:click={handleCreateNewsletter} class="btn btn-primary">
      Create Newsletter
    </button>
  </div>

  {#if loading}
    <p>Loading your newsletters...</p>
  {:else if error}
    <p class="text-red-600">Error: {error}</p>
  {:else if newsletters.length === 0}
    <p>You haven't created any newsletters yet. Get started by creating one!</p>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each newsletters as newsletter}
        <a href="/newsletters/{newsletter.id}" class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
          <div class="card-body">
            <h2 class="card-title">{newsletter.name}</h2>
            <p>Manage newsletter, view issues, and more.</p>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
