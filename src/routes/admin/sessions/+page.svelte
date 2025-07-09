<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/authStore.js';

  interface Session {
    id: string;
    newsletterId: string;
    weekIdentifier: string;
    weekStart: any;
    weekEnd: any;
    status: 'active' | 'pending' | 'completed';
    newsletterSent: boolean;
    participantCount: number;
    createdAt: any;
    generatedNewsletter?: string;
    newsletterName?: string;
    responseCount?: number;
  }

  let sessions = $state<Session[]>([]);
  let loading = $state(true);
  let error = $state('');
  let searchTerm = $state('');
  let statusFilter = $state('all');
  let selectedSession = $state<Session | null>(null);
  let showDetailModal = $state(false);

  // Reactive filtered sessions
  let filteredSessions = $derived(
    sessions.filter(session => {
      const matchesSearch = (
        (session.newsletterName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.weekIdentifier || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
  );

  onMount(async () => {
    await loadSessions();
  });

  async function getAuthToken() {
    // Get the current user's ID token
    const { auth } = await import('$lib/firebase');
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return await user.getIdToken();
  }

  async function loadSessions() {
    try {
      loading = true;
      error = '';

      const token = await getAuthToken();
      const response = await fetch('/api/admin/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load sessions');
      }

      const data = await response.json();
      sessions = data.sessions || [];
    } catch (err: any) {
      console.error('Error loading sessions:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function openDetailModal(session: Session) {
    selectedSession = session;
    showDetailModal = true;
  }

  function closeDetailModal() {
    selectedSession = null;
    showDetailModal = false;
  }

  async function updateSessionStatus(sessionId: string, status: string) {
    try {
      error = '';
      const token = await getAuthToken();
      
      const response = await fetch('/api/admin/sessions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId,
          updates: { status }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update session');
      }

      // Update the local session
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      if (sessionIndex !== -1) {
        sessions[sessionIndex].status = status as any;
      }
      
      if (selectedSession?.id === sessionId) {
        selectedSession.status = status as any;
      }
    } catch (err: any) {
      console.error('Error updating session:', err);
      error = err.message;
    }
  }

  async function toggleNewsletterSent(sessionId: string) {
    try {
      error = '';
      const token = await getAuthToken();
      
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;
      
      const response = await fetch('/api/admin/sessions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId,
          updates: { newsletterSent: !session.newsletterSent }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update session');
      }

      // Update the local session
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      if (sessionIndex !== -1) {
        sessions[sessionIndex].newsletterSent = !session.newsletterSent;
      }
      
      if (selectedSession?.id === sessionId) {
        selectedSession.newsletterSent = !session.newsletterSent;
      }
    } catch (err: any) {
      console.error('Error updating session:', err);
      error = err.message;
    }
  }

  async function deleteSession(sessionId: string) {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      error = '';
      const token = await getAuthToken();
      
      const response = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete session');
      }

      // Remove from local list
      sessions = sessions.filter(s => s.id !== sessionId);
      
      if (selectedSession?.id === sessionId) {
        closeDetailModal();
      }
    } catch (err: any) {
      console.error('Error deleting session:', err);
      error = err.message;
    }
  }

  function formatDate(timestamp: any) {
    if (!timestamp) return 'N/A';
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

  function getStatusColor(status: string) {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<svelte:head>
  <title>Session Management - Admin Panel</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="border-b border-gray-200 pb-4">
    <h1 class="text-3xl font-bold text-gray-900">Session Management</h1>
    <p class="text-gray-600 mt-2">Monitor and manage user response sessions</p>
  </div>

  <!-- Search and Filters -->
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex-1">
        <label for="search" class="block text-sm font-medium text-gray-700 mb-2">Search Sessions</label>
        <input
          id="search"
          type="text"
          bind:value={searchTerm}
          placeholder="Search by newsletter, week identifier, or session ID..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div class="flex items-end gap-3">
        <div>
          <label for="statusFilter" class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            id="statusFilter"
            bind:value={statusFilter}
            class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button 
          onclick={loadSessions}
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

  <!-- Sessions Table -->
  <div class="bg-white shadow rounded-lg overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <h3 class="text-lg font-medium text-gray-900">
        Sessions ({filteredSessions.length} of {sessions.length})
      </h3>
    </div>
    
    {#if loading}
      <div class="px-6 py-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-500">Loading sessions...</p>
      </div>
    {:else if filteredSessions.length === 0}
      <div class="px-6 py-8 text-center">
        <p class="text-gray-500">No sessions found.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Newsletter</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Newsletter Sent</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responses</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week Start</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each filteredSessions as session (session.id)}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {session.newsletterName || 'Unknown'}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {session.weekIdentifier || 'N/A'}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(session.status)}">
                    {session.status}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {session.newsletterSent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    {session.newsletterSent ? 'Sent' : 'Not Sent'}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {session.participantCount || 0}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {session.responseCount || 0}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(session.weekStart)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onclick={() => openDetailModal(session)}
                    class="text-blue-600 hover:text-blue-900 focus:outline-none"
                  >
                    View
                  </button>
                  <button
                    onclick={() => toggleNewsletterSent(session.id)}
                    class="text-purple-600 hover:text-purple-900 focus:outline-none"
                  >
                    Toggle Sent
                  </button>
                  {#if session.status !== 'completed'}
                    <button
                      onclick={() => updateSessionStatus(session.id, 'completed')}
                      class="text-green-600 hover:text-green-900 focus:outline-none"
                    >
                      Complete
                    </button>
                  {/if}
                  <button
                    onclick={() => deleteSession(session.id)}
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
{#if showDetailModal && selectedSession}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
      <h3 class="text-lg font-bold text-gray-900 mb-4">Session Details</h3>
      
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="block text-sm font-medium text-gray-700">Session ID</div>
            <p class="mt-1 text-sm text-gray-900 font-mono">{selectedSession.id}</p>
          </div>
          <div>
            <div class="block text-sm font-medium text-gray-700">Status</div>
            <span class="mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full {getStatusColor(selectedSession.status)}">
              {selectedSession.status}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="block text-sm font-medium text-gray-700">Newsletter</div>
            <p class="mt-1 text-sm text-gray-900">{selectedSession.newsletterName || 'Unknown'}</p>
          </div>
          <div>
            <div class="block text-sm font-medium text-gray-700">Week Identifier</div>
            <p class="mt-1 text-sm text-gray-900">{selectedSession.weekIdentifier || 'N/A'}</p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <div class="block text-sm font-medium text-gray-700">Newsletter Sent</div>
            <span class="mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full {selectedSession.newsletterSent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
              {selectedSession.newsletterSent ? 'Sent' : 'Not Sent'}
            </span>
          </div>
          <div>
            <div class="block text-sm font-medium text-gray-700">Participants</div>
            <p class="mt-1 text-sm text-gray-900">{selectedSession.participantCount || 0}</p>
          </div>
          <div>
            <div class="block text-sm font-medium text-gray-700">Responses</div>
            <p class="mt-1 text-sm text-gray-900">{selectedSession.responseCount || 0}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="block text-sm font-medium text-gray-700">Week Start</div>
            <p class="mt-1 text-sm text-gray-900">{formatDate(selectedSession.weekStart)}</p>
          </div>
          <div>
            <div class="block text-sm font-medium text-gray-700">Week End</div>
            <p class="mt-1 text-sm text-gray-900">{formatDate(selectedSession.weekEnd)}</p>
          </div>
        </div>

        <div>
          <div class="block text-sm font-medium text-gray-700">Created At</div>
          <p class="mt-1 text-sm text-gray-900">{formatDate(selectedSession.createdAt)}</p>
        </div>

        {#if selectedSession.generatedNewsletter && selectedSession.status === 'completed'}
          <div>
            <div class="block text-sm font-medium text-gray-700 mb-2">Generated Newsletter</div>
            <div class="bg-gray-50 border rounded-md p-4 max-h-96 overflow-y-auto">
              <pre class="whitespace-pre-wrap text-sm text-gray-900">{selectedSession.generatedNewsletter}</pre>
            </div>
          </div>
        {/if}
      </div>

      <div class="flex justify-between mt-6">
        <div class="space-x-2">
          <button
            onclick={() => toggleNewsletterSent(selectedSession!.id)}
            class="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Toggle Newsletter Sent
          </button>
          {#if selectedSession.status !== 'completed'}
            <button
              onclick={() => updateSessionStatus(selectedSession!.id, 'completed')}
              class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Mark Completed
            </button>
          {/if}
        </div>
        
        <div class="space-x-3">
          <button
            onclick={closeDetailModal}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Close
          </button>
          <button
            onclick={() => deleteSession(selectedSession!.id)}
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete Session
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
