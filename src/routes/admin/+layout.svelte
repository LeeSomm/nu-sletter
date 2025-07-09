<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/authStore';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { userApi } from '$lib/api';

  let { children } = $props();
  
  let userProfile = $state<any>(null);
  let loading = $state(true);
  let error = $state('');

  // Check admin status on mount
  onMount(async () => {
    if (!$authStore) {
      goto('/login');
      return;
    }

    try {
      userProfile = await userApi.getCurrentUser();
      
      // Redirect if not admin
      if (!userProfile?.isAdmin) {
        goto('/');
        return;
      }
    } catch (err: any) {
      console.error('Error checking admin status:', err);
      error = 'Failed to verify admin access';
      goto('/');
    } finally {
      loading = false;
    }
  });

  // Navigation items
  const navItems = [
    { href: '/admin', label: 'Dashboard', exact: true },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/newsletters', label: 'Newsletters' },
    { href: '/admin/questions', label: 'Questions' },
    { href: '/admin/responses', label: 'Responses' },
    { href: '/admin/sessions', label: 'Sessions' }
  ];

  function isActive(item: { href: string; exact?: boolean }) {
    if (item.exact) {
      return $page.url.pathname === item.href;
    }
    return $page.url.pathname.startsWith(item.href);
  }
</script>

<svelte:head>
  <title>Admin Panel - Nu-sletter</title>
</svelte:head>

{#if loading}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-lg">Loading admin panel...</div>
  </div>
{:else if error}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-red-600">{error}</div>
  </div>
{:else if userProfile?.isAdmin}
  <div class="min-h-screen bg-gray-50">
    <!-- Admin Header -->
    <header class="bg-red-800 text-white shadow-lg">
      <div class="container mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <h1 class="text-xl font-bold">Admin Panel</h1>
            <span class="text-red-200 text-sm">Nu-sletter</span>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm">Welcome, {userProfile.displayName || userProfile.email}</span>
            <a href="/" class="bg-red-700 hover:bg-red-600 px-3 py-1 rounded text-sm">
              Back to App
            </a>
          </div>
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- Sidebar Navigation -->
      <nav class="w-64 bg-white shadow-lg min-h-screen">
        <div class="p-4">
          <ul class="space-y-2">
            {#each navItems as item}
              <li>
                <a 
                  href={item.href}
                  class="block px-4 py-2 rounded-md text-sm font-medium transition-colors {
                    isActive(item) 
                      ? 'bg-red-100 text-red-800 border-l-4 border-red-500' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }"
                >
                  {item.label}
                </a>
              </li>
            {/each}
          </ul>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="flex-1 p-6">
        {@render children()}
      </main>
    </div>
  </div>
{:else}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-red-600">Access denied. Admin privileges required.</div>
  </div>
{/if}
