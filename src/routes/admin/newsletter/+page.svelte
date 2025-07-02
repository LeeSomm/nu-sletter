
<script lang="ts">
  import { onMount } from 'svelte';
  import type { DocumentData } from 'firebase/firestore';

  let summary = '';
  let loading = false;
  let error: string | null = null;

  async function generateNewsletter() {
    loading = true;
    error = null;
    try {
      const res = await fetch('/api/generate-newsletter', { method: 'POST' });
      if (!res.ok) {
        throw new Error((await res.json()).error || 'Failed to generate newsletter');
      }
      const data = await res.json();
      summary = data.summary;
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="max-w-4xl mx-auto">
  <h1 class="text-3xl font-bold mb-6">Newsletter Generator</h1>

  <button on:click={generateNewsletter} disabled={loading} class="px-6 py-3 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
    {loading ? 'Generating...' : 'Generate Weekly Newsletter'}
  </button>

  {#if error}
    <p class="text-red-600 mt-4">Error: {error}</p>
  {/if}

  {#if summary}
    <div class="mt-8 p-6 bg-white rounded-lg shadow">
      <h2 class="text-2xl font-semibold mb-4">Generated Summary</h2>
      <p class="whitespace-pre-wrap">{summary}</p>
    </div>
  {/if}
</div>
