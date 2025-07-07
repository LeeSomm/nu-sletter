
<script lang="ts">
  import { onMount } from 'svelte';
  import { db, auth } from '$lib/firebase';
  import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
  import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
  import { authStore } from '$lib/stores/authStore';

  interface Newsletter {
    id: string;
    name: string;
    users: string[];
  }

  let newsletters: Newsletter[] = [];
  let isLoading = true;
  let error: string | null = null;

  async function fetchNewsletters() {
    try {
      const querySnapshot = await getDocs(collection(db, 'newsletters'));
      newsletters = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          users: data.users,
        };
      });
    } catch (err: any) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  onMount(fetchNewsletters);

  async function createNewsletter() {
    const name = prompt('Enter the new newsletter name:');
    const promptText = prompt('Enter the newsletter prompt:');
    if (name && promptText) {
      try {
        const newNewsletter = {
          name,
          prompt: promptText,
          users: [],
          owners: [$authStore?.uid],
          createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, 'newsletters'), newNewsletter);
        newsletters = [...newsletters, { id: docRef.id, name: newNewsletter.name, users: newNewsletter.users }];
      } catch (err: any) {
        error = `Failed to add newsletter: ${err.message}`;
      }
    }
  }
</script>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-4">
    <h1 class="text-2xl font-bold">Newsletter Management</h1>
    <button on:click={createNewsletter} class="px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700">
      Create Newsletter
    </button>
  </div>

  {#if isLoading}
    <p>Loading newsletters...</p>
  {:else if error}
    <p class="text-red-600">{error}</p>
  {:else}
    <div class="overflow-x-auto bg-white rounded-lg shadow">
      <table class="min-w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#each newsletters as newsletter (newsletter.id)}
            <tr>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{newsletter.name}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{newsletter.users.length}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a href="/admin/newsletters/{newsletter.id}" class="text-indigo-600 hover:text-indigo-900">Edit</a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
