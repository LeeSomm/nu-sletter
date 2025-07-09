
<script lang="ts">
  import { onMount } from 'svelte';

  interface Newsletter {
    id: string;
    name: string;
    description: string;
    prompt: string;
    isActive: boolean;
    memberCount: number;
    ownerEmail: string;
    createdAt: any;
    settings: {
      isPublic: boolean;
      requireApproval: boolean;
      maxMembers?: number;
      questionSubmissionRequired: boolean;
    };
  }

  let newsletters = $state<Newsletter[]>([]);
  let loading = $state(true);
  let error = $state('');
  let searchTerm = $state('');
  let editingNewsletter = $state<Newsletter | null>(null);
  let showEditModal = $state(false);

  // Reactive filtered newsletters
  let filteredNewsletters = $derived(
    newsletters.filter(newsletter => 
      newsletter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      newsletter.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  onMount(async () => {
    await loadNewsletters();
  });

  async function loadNewsletters() {
    try {
      loading = true;
      error = '';

      const token = await getAuthToken();
      const response = await fetch('/api/admin/newsletters', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load newsletters');
      }

      const data = await response.json();
      newsletters = data.newsletters || [];
    } catch (err: any) {
      console.error('Error loading newsletters:', err);
      error = 'Failed to load newsletters';
    } finally {
      loading = false;
    }
  }

  async function getAuthToken() {
    const { auth } = await import('$lib/firebase');
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return await user.getIdToken();
  }

  function editNewsletter(newsletter: Newsletter) {
    editingNewsletter = { ...newsletter };
    showEditModal = true;
  }

  function closeEditModal() {
    editingNewsletter = null;
    showEditModal = false;
  }

  async function saveNewsletter() {
    if (!editingNewsletter) return;

    try {
      const token = await getAuthToken();
      const response = await fetch('/api/admin/newsletters', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newsletterId: editingNewsletter.id,
          updates: {
            name: editingNewsletter.name,
            description: editingNewsletter.description,
            prompt: editingNewsletter.prompt,
            isActive: editingNewsletter.isActive,
            settings: editingNewsletter.settings
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update newsletter');
      }

      // Update local state
      const newsletterIndex = newsletters.findIndex(n => n.id === editingNewsletter.id);
      if (newsletterIndex !== -1) {
        newsletters[newsletterIndex] = { ...editingNewsletter };
        newsletters = [...newsletters]; // Trigger reactivity
      }

      closeEditModal();
    } catch (err: any) {
      console.error('Error saving newsletter:', err);
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
</script>

<svelte:head>
  <title>Newsletter Management - Admin Panel</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="border-b border-gray-200 pb-4">
    <h1 class="text-3xl font-bold text-gray-900">Newsletter Management</h1>
    <p class="text-gray-600 mt-2">Manage all newsletters and their settings</p>
  </div>

  <!-- Search and Filters -->
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex-1">
        <label for="search" class="sr-only">Search newsletters</label>
        <input
          type="text"
          id="search"
          bind:value={searchTerm}
          placeholder="Search newsletters by name or owner..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
        >
      </div>
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-600">
          {filteredNewsletters.length} of {newsletters.length} newsletters
        </span>
        <button
          onclick={loadNewsletters}
          class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Refresh
        </button>
      </div>
    </div>
  </div>

  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="text-red-600">{error}</div>
    </div>
  {/if}

  {#if loading}
    <div class="text-center py-8">
      <div class="text-lg text-gray-600">Loading newsletters...</div>
    </div>
  {:else}
    <!-- Newsletters Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Newsletter
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Owner
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Members
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each filteredNewsletters as newsletter (newsletter.id)}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    {newsletter.name}
                  </div>
                  <div class="text-sm text-gray-500">
                    {newsletter.description || 'No description'}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {newsletter.ownerEmail}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {newsletter.memberCount}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {
                  newsletter.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }">
                  {newsletter.isActive ? 'Active' : 'Inactive'}
                </span>
                {#if newsletter.settings?.isPublic}
                  <span class="ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    Public
                  </span>
                {/if}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(newsletter.createdAt)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onclick={() => editNewsletter(newsletter)}
                  class="text-red-600 hover:text-red-900"
                >
                  Edit
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if filteredNewsletters.length === 0}
        <div class="text-center py-8">
          <div class="text-gray-500">
            {searchTerm ? 'No newsletters match your search' : 'No newsletters found'}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Edit Newsletter Modal -->
{#if showEditModal && editingNewsletter}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Edit Newsletter</h3>
        
        <div class="space-y-4 max-h-96 overflow-y-auto">
          <div>
            <label class="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              bind:value={editingNewsletter.name}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              bind:value={editingNewsletter.description}
              rows="3"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            ></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">AI Prompt</label>
            <textarea
              bind:value={editingNewsletter.prompt}
              rows="4"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            ></textarea>
          </div>
          
          <div class="space-y-3">
            <h4 class="text-sm font-medium text-gray-700">Settings</h4>
            
            <div class="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                bind:checked={editingNewsletter.isActive}
                class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              >
              <label for="isActive" class="ml-2 block text-sm text-gray-900">
                Newsletter is active
              </label>
            </div>
            
            <div class="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                bind:checked={editingNewsletter.settings.isPublic}
                class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              >
              <label for="isPublic" class="ml-2 block text-sm text-gray-900">
                Public newsletter
              </label>
            </div>
            
            <div class="flex items-center">
              <input
                type="checkbox"
                id="requireApproval"
                bind:checked={editingNewsletter.settings.requireApproval}
                class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              >
              <label for="requireApproval" class="ml-2 block text-sm text-gray-900">
                Require approval to join
              </label>
            </div>
            
            <div class="flex items-center">
              <input
                type="checkbox"
                id="questionSubmissionRequired"
                bind:checked={editingNewsletter.settings.questionSubmissionRequired}
                class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              >
              <label for="questionSubmissionRequired" class="ml-2 block text-sm text-gray-900">
                Question submission required
              </label>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <button
            onclick={closeEditModal}
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onclick={saveNewsletter}
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
