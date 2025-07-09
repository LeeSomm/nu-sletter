<script lang="ts">
  import { onMount } from 'svelte';

  let stats = $state({
    users: 0,
    newsletters: 0,
    questions: 0,
    responses: 0,
    sessions: 0
  });
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    await loadStats();
  });

  async function loadStats() {
    try {
      loading = true;
      error = '';

      // For now, we'll create a simple stats endpoint
      // In the meantime, let's show placeholder data
      stats = {
        users: 0,
        newsletters: 0,
        questions: 0,
        responses: 0,
        sessions: 0
      };

    } catch (err: any) {
      console.error('Error loading stats:', err);
      error = 'Failed to load dashboard statistics';
    } finally {
      loading = false;
    }
  }

  const quickActions = [
    { href: '/admin/users', label: 'Manage Users', description: 'View and edit user accounts' },
    { href: '/admin/newsletters', label: 'Manage Newsletters', description: 'View all newsletters and their settings' },
    { href: '/admin/questions', label: 'Manage Questions', description: 'View and edit questions across all newsletters' },
    { href: '/admin/responses', label: 'View Responses', description: 'See all user responses to questions' },
    { href: '/admin/sessions', label: 'Manage Sessions', description: 'View newsletter sessions and generation status' }
  ];
</script>

<svelte:head>
  <title>Admin Dashboard - Nu-sletter</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="border-b border-gray-200 pb-4">
    <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
    <p class="text-gray-600 mt-2">Manage your Nu-sletter application data and settings</p>
  </div>

  {#if loading}
    <div class="text-center py-8">
      <div class="text-lg text-gray-600">Loading dashboard...</div>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="text-red-600">{error}</div>
      <button 
        onclick={loadStats}
        class="mt-2 text-sm text-red-800 hover:text-red-900 underline"
      >
        Try again
      </button>
    </div>
  {:else}
    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-2 bg-blue-100 rounded-md">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m-1.5-10.75a4 4 0 11-5 0 4 4 0 015 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Users</p>
            <p class="text-2xl font-semibold text-gray-900">{stats.users}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-2 bg-green-100 rounded-md">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Newsletters</p>
            <p class="text-2xl font-semibold text-gray-900">{stats.newsletters}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-2 bg-yellow-100 rounded-md">
            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Questions</p>
            <p class="text-2xl font-semibold text-gray-900">{stats.questions}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-2 bg-purple-100 rounded-md">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Responses</p>
            <p class="text-2xl font-semibold text-gray-900">{stats.responses}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-2 bg-red-100 rounded-md">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Sessions</p>
            <p class="text-2xl font-semibold text-gray-900">{stats.sessions}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-medium text-gray-900">Quick Actions</h2>
        <p class="text-sm text-gray-600">Access common administrative tasks</p>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each quickActions as action}
            <a 
              href={action.href}
              class="block p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all"
            >
              <h3 class="font-medium text-gray-900 mb-1">{action.label}</h3>
              <p class="text-sm text-gray-600">{action.description}</p>
            </a>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
