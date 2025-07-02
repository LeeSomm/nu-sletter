
<script lang="ts">
  import { db, auth } from '$lib/firebase';
  import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
  import type { DocumentData } from 'firebase/firestore';
  import { authStore } from '$lib/stores/authStore';

  let responses: DocumentData[] = [];
  let loading = true;
  let error: string | null = null;

  authStore.subscribe(user => {
    if (user) {
      loadResponses(user.uid);
    } else {
      // Handle case where user is not logged in, though route protection should prevent this.
      loading = false;
      responses = [];
    }
  });

  async function loadResponses(uid: string) {
    loading = true;
    try {
      const q = query(
        collection(db, 'userResponses'),
        where('userId', '==', uid),
        orderBy('submittedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      responses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="max-w-4xl mx-auto">
  <h1 class="text-3xl font-bold mb-6">My Dashboard</h1>

  <h2 class="text-2xl font-semibold mb-4">My Past Responses</h2>
  {#if loading}
    <p>Loading your responses...</p>
  {:else if error}
    <p class="text-red-600">Error loading responses: {error}</p>
  {:else if responses.length === 0}
    <p>You haven't submitted any responses yet.</p>
  {:else}
    <div class="space-y-4">
      {#each responses as response}
        <div class="p-4 bg-white rounded-lg shadow">
          <p class="text-gray-600 text-sm">
            {new Date(response.submittedAt?.toDate()).toLocaleDateString()}
          </p>
          <p class="font-bold mt-2">Your Response:</p>
          <p class="text-lg mt-1">{response.response}</p>
          <p class="font-bold mt-2">Question You Submitted:</p>
          <p class="text-lg mt-1">{response.submittedQuestion}</p>
        </div>
      {/each}
    </div>
  {/if}
</div>
