<script lang="ts">
  import { onMount } from 'svelte';
  import { newsletterApi } from '$lib/api';

  export let newsletterId: string;

  let issues: any[] = [];
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      const newsletter = await newsletterApi.get(newsletterId);
      issues = newsletter.issues || [];
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

<div>
  <h2 class="text-2xl font-bold mb-4">Past Issues</h2>
  {#if loading}
    <p>Loading issues...</p>
  {:else if error}
    <p class="text-red-600">{error}</p>
  {:else if issues.length === 0}
    <p>No issues have been generated for this newsletter yet.</p>
  {:else}
    <div class="space-y-4">
      {#each issues as issue}
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <p class="text-sm text-gray-500">{new Date(issue.createdAt?.toDate()).toLocaleDateString()}</p>
            <p>{issue.content}</p>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
