<script lang="ts">
  import { onMount } from 'svelte';

  interface User {
    id: string;
    email: string;
    displayName?: string;
    isActive: boolean;
    isAdmin: boolean;
    createdAt: any;
    preferences?: {
      emailNotifications: boolean;
      timezone: string;
    };
  }

  let users = $state<User[]>([]);
  let loading = $state(true);
  let error = $state('');
  let searchTerm = $state('');
  let editingUser = $state<User | null>(null);
  let showEditModal = $state(false);

  // Reactive filtered users
  let filteredUsers = $derived(
    users.filter(user => 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.displayName || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  onMount(async () => {
    await loadUsers();
  });

  async function loadUsers() {
    try {
      loading = true;
      error = '';

      const token = await getAuthToken();
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json();
      users = data.users || [];
    } catch (err: any) {
      console.error('Error loading users:', err);
      error = 'Failed to load users';
    } finally {
      loading = false;
    }
  }

  async function getAuthToken() {
    // Get the current user's ID token
    const { auth } = await import('$lib/firebase');
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return await user.getIdToken();
  }

  function editUser(user: User) {
    editingUser = { ...user };
    showEditModal = true;
  }

  function closeEditModal() {
    editingUser = null;
    showEditModal = false;
  }

  async function saveUser() {
    if (!editingUser) return;

    try {
      const token = await getAuthToken();
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: editingUser.id,
          updates: {
            displayName: editingUser.displayName,
            isActive: editingUser.isActive,
            isAdmin: editingUser.isAdmin,
            preferences: editingUser.preferences
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      // Update local state
      const userIndex = users.findIndex(u => u.id === editingUser.id);
      if (userIndex !== -1) {
        users[userIndex] = { ...editingUser };
        users = [...users]; // Trigger reactivity
      }

      closeEditModal();
    } catch (err: any) {
      console.error('Error saving user:', err);
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
  <title>User Management - Admin Panel</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="border-b border-gray-200 pb-4">
    <h1 class="text-3xl font-bold text-gray-900">User Management</h1>
    <p class="text-gray-600 mt-2">Manage user accounts and permissions</p>
  </div>

  <!-- Search and Filters -->
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex-1">
        <label for="search" class="sr-only">Search users</label>
        <input
          type="text"
          id="search"
          bind:value={searchTerm}
          placeholder="Search users by email or name..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
        >
      </div>
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-600">
          {filteredUsers.length} of {users.length} users
        </span>
        <button
          onclick={loadUsers}
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
      <div class="text-lg text-gray-600">Loading users...</div>
    </div>
  {:else}
    <!-- Users Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Joined
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each filteredUsers as user (user.id || user.id)}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    {user.displayName || 'No name'}
                  </div>
                  <div class="text-sm text-gray-500">{user.email}</div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {
                  user.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }">
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {
                  user.isAdmin 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-gray-100 text-gray-800'
                }">
                  {user.isAdmin ? 'Admin' : 'User'}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(user.createdAt)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onclick={() => editUser(user)}
                  class="text-red-600 hover:text-red-900"
                >
                  Edit
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if filteredUsers.length === 0}
        <div class="text-center py-8">
          <div class="text-gray-500">
            {searchTerm ? 'No users match your search' : 'No users found'}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Edit User Modal -->
{#if showEditModal && editingUser}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={editingUser.email}
              disabled
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Display Name</label>
            <input
              type="text"
              bind:value={editingUser.displayName}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
          </div>
          
          <div class="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              bind:checked={editingUser.isActive}
              class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            >
            <label for="isActive" class="ml-2 block text-sm text-gray-900">
              Account is active
            </label>
          </div>
          
          <div class="flex items-center">
            <input
              type="checkbox"
              id="isAdmin"
              bind:checked={editingUser.isAdmin}
              class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            >
            <label for="isAdmin" class="ml-2 block text-sm text-gray-900">
              Admin privileges
            </label>
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
            onclick={saveUser}
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
