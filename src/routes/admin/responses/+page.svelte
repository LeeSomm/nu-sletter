<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/authStore.js';

  interface Response {
    id: string;
    newsletterId: string;
    sessionId: string;
    userId: string;
    questionId: string;
    response: string;
    submittedQuestion?: string;
    submittedAt: any;
    wordCount: number;
    isPublic: boolean;
    userEmail?: string;
    questionText?: string;
    newsletterName?: string;
  }

  let responses = $state<Response[]>([]);
  let loading = $state(true);
  let error = $state('');
  let searchTerm = $state('');
  let selectedResponse = $state<Response | null>(null);
  let showDetailModal = $state(false);

  // Reactive filtered responses
  let filteredResponses = $derived(
    responses.filter(response => 
      (response.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (response.questionText || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (response.newsletterName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.response.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  onMount(async () => {
    await loadResponses();
  });

  async function getAuthToken() {
    // Get the current user's ID token
    const { auth } = await import('$lib/firebase');
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return await user.getIdToken();
  }

  async function loadResponses() {
    try {
      loading = true;
      error = '';

      const token = await getAuthToken();
      const response = await fetch('/api/admin/responses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load responses');
      }

      const data = await response.json();
      responses = data.responses || [];
    } catch (err: any) {
      console.error('Error loading responses:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function openDetailModal(response: Response) {
    selectedResponse = response;
    showDetailModal = true;
  }

  function closeDetailModal() {
    selectedResponse = null;
    showDetailModal = false;
  }

  async function deleteResponse(responseId: string) {
    if (!confirm('Are you sure you want to delete this response? This action cannot be undone.')) {
      return;
    }

    try {
      error = '';
      const token = await getAuthToken();
      
      const response = await fetch('/api/admin/responses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ responseId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete response');
      }

      // Remove from local list
      responses = responses.filter(r => r.id !== responseId);
      
      if (selectedResponse?.id === responseId) {
        closeDetailModal();
      }
    } catch (err: any) {
      console.error('Error deleting response:', err);
      error = err.message;
    }
  }

  function formatDate(timestamp: any) {
    if (!timestamp) return 'Unknown';
    try {
      let date: Date;
      
      if (timestamp.toDate) {
        // Firestore Timestamp (shouldn't happen after API serialization, but keep for safety)
        date = timestamp.toDate();
      } else if (typeof timestamp === 'string') {
        // ISO string from API or dummy data
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        // Already a Date object
        date = timestamp;
      } else {
        // Try to convert whatever it is
        date = new Date(timestamp);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  }

  function formatContent(content: string) {
    if (typeof content === 'string') {
      return content.length > 100 ? content.substring(0, 100) + '...' : content;
    }
    return String(content);
  }
</script>

<svelte:head>
  <title>Response Management - Admin Panel</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="border-b border-gray-200 pb-4">
    <h1 class="text-3xl font-bold text-gray-900">Response Management</h1>
    <p class="text-gray-600 mt-2">View and manage all user responses</p>
  </div>

  <!-- Search and Filters -->
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex-1">
        <label for="search" class="block text-sm font-medium text-gray-700 mb-2">Search Responses</label>
        <input
          id="search"
          type="text"
          bind:value={searchTerm}
          placeholder="Search by user, question, newsletter, or content..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div class="flex items-end">
        <button 
          onclick={loadResponses}
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Refresh
        </button>
      </div>
    </div>
  </div>

  <!-- Error Display -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <div class="mt-2 text-sm text-red-700">{error}</div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Responses Table -->
  <div class="bg-white shadow rounded-lg overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <h3 class="text-lg font-medium text-gray-900">
        Responses ({filteredResponses.length} of {responses.length})
      </h3>
    </div>
    
    {#if loading}
      <div class="px-6 py-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-500">Loading responses...</p>
      </div>
    {:else if filteredResponses.length === 0}
      <div class="px-6 py-8 text-center">
        <p class="text-gray-500">No responses found.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Newsletter</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each filteredResponses as response (response.id)}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {response.userEmail || 'Unknown'}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {response.newsletterName || 'Unknown'}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900 max-w-xs truncate" title={response.questionText}>
                    {response.questionText || 'Unknown'}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900 max-w-xs truncate" title={response.response}>
                    {formatContent(response.response)}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(response.submittedAt)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onclick={() => openDetailModal(response)}
                    class="text-blue-600 hover:text-blue-900 focus:outline-none"
                  >
                    View
                  </button>
                  <button
                    onclick={() => deleteResponse(response.id)}
                    class="text-red-600 hover:text-red-900 focus:outline-none"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<!-- Detail Modal -->
{#if showDetailModal && selectedResponse}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
      <h3 class="text-lg font-bold text-gray-900 mb-4">Response Details</h3>
      
      <div class="space-y-4">
        <div>
          <div class="block text-sm font-medium text-gray-700">User</div>
          <p class="mt-1 text-sm text-gray-900">{selectedResponse.userEmail || 'Unknown'}</p>
        </div>

        <div>
          <div class="block text-sm font-medium text-gray-700">Newsletter</div>
          <p class="mt-1 text-sm text-gray-900">{selectedResponse.newsletterName || 'Unknown'}</p>
        </div>

        <div>
          <div class="block text-sm font-medium text-gray-700">Question</div>
          <p class="mt-1 text-sm text-gray-900">{selectedResponse.questionText || 'Unknown'}</p>
        </div>

        <div>
          <div class="block text-sm font-medium text-gray-700">Response Content</div>
          <div class="mt-1 p-3 bg-gray-50 rounded-md">
            <pre class="text-sm text-gray-900 whitespace-pre-wrap">{selectedResponse.response}</pre>
          </div>
        </div>

        {#if selectedResponse.submittedQuestion}
          <div>
            <div class="block text-sm font-medium text-gray-700">Submitted Question</div>
            <div class="mt-1 p-3 bg-blue-50 rounded-md">
              <p class="text-sm text-blue-900">{selectedResponse.submittedQuestion}</p>
            </div>
          </div>
        {/if}

        <div class="grid grid-cols-3 gap-4">
          <div>
            <div class="block text-sm font-medium text-gray-700">Submitted</div>
            <p class="mt-1 text-sm text-gray-900">{formatDate(selectedResponse.submittedAt)}</p>
          </div>
          <div>
            <div class="block text-sm font-medium text-gray-700">Word Count</div>
            <p class="mt-1 text-sm text-gray-900">{selectedResponse.wordCount}</p>
          </div>
          <div>
            <div class="block text-sm font-medium text-gray-700">Visibility</div>
            <p class="mt-1 text-sm text-gray-900">{selectedResponse.isPublic ? 'Public' : 'Private'}</p>
          </div>
        </div>

        {#if selectedResponse.sessionId}
          <div>
            <div class="block text-sm font-medium text-gray-700">Session ID</div>
            <p class="mt-1 text-sm text-gray-500 font-mono">{selectedResponse.sessionId}</p>
          </div>
        {/if}
      </div>

      <div class="flex justify-end space-x-3 mt-6">
        <button
          onclick={closeDetailModal}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Close
        </button>
        <button
          onclick={() => deleteResponse(selectedResponse!.id)}
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Delete Response
        </button>
      </div>
    </div>
  </div>
{/if}
