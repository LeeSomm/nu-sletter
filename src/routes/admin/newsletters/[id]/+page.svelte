
<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { db } from '$lib/firebase';
  import { doc, getDoc, updateDoc } from 'firebase/firestore';
  import type { DocumentData } from 'firebase/firestore';

  interface Newsletter {
    id: string;
    name: string;
    prompt: string;
    users: string[];
  }

  let newsletter: Newsletter | null = null;
  let isLoading = true;
  let error: string | null = null;

  onMount(async () => {
    const id = $page.params.id;
    try {
      const docRef = doc(db, 'newsletters', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as DocumentData;
        newsletter = {
          id: docSnap.id,
          name: data.name,
          prompt: data.prompt,
          users: data.users,
        };
      } else {
        error = 'Newsletter not found';
      }
    } catch (err: any) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  });

  async function updateNewsletter() {
    if (!newsletter) return;
    try {
      const newsletterRef = doc(db, 'newsletters', newsletter.id);
      await updateDoc(newsletterRef, {
        name: newsletter.name,
        prompt: newsletter.prompt,
        users: newsletter.users,
      });
      alert('Newsletter updated successfully!');
    } catch (err: any) {
      error = `Failed to update newsletter: ${err.message}`;
    }
  }
</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Edit Newsletter</h1>

  {#if isLoading}
    <p>Loading newsletter...</p>
  {:else if error}
    <p class="text-red-600">{error}</p>
  {:else if newsletter}
    <form on:submit|preventDefault={updateNewsletter} class="space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
        <input type="text" id="name" bind:value={newsletter.name} class="w-full px-3 py-2 mt-1 border rounded-md" required />
      </div>
      <div>
        <label for="prompt" class="block text-sm font-medium text-gray-700">Prompt</label>
        <textarea id="prompt" bind:value={newsletter.prompt} rows="6" class="w-full px-3 py-2 mt-1 border rounded-md" required></textarea>
      </div>
      <div>
        <label for="users" class="block text-sm font-medium text-gray-700">Users (comma-separated UIDs)</label>
        <input type="text" id="users" bind:value={newsletter.users} class="w-full px-3 py-2 mt-1 border rounded-md" />
      </div>
      <div>
        <button type="submit" class="px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700">
          Save Changes
        </button>
      </div>
    </form>
  {/if}
</div>
