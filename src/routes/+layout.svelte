<script lang="ts">
  import '../app.css';
  import { authStore } from '$lib/stores/authStore';
  import { auth } from '$lib/firebase';
  import { signOut } from 'firebase/auth';
  import { goto } from '$app/navigation';
  import { userApi } from '$lib/api';

  let { children } = $props();

  async function logout() {
    await signOut(auth);
    goto('/login');
  }

  let showAdminDropdown = $state(false);
  let showUserDropdown = $state(false);
  let adminDropdownRef = $state<HTMLDivElement>();
  let userDropdownRef = $state<HTMLDivElement>();
  let userProfile = $state<any>(null);

  function toggleAdminDropdown() {
    showAdminDropdown = !showAdminDropdown;
  }

  function closeAdminDropdown() {
    showAdminDropdown = false;
  }

  function toggleUserDropdown() {
    showUserDropdown = !showUserDropdown;
  }

  function closeUserDropdown() {
    showUserDropdown = false;
  }

  function handleClickOutside(event: MouseEvent) {
    if (adminDropdownRef && !adminDropdownRef.contains(event.target as Node)) {
      showAdminDropdown = false;
    }
    if (userDropdownRef && !userDropdownRef.contains(event.target as Node)) {
      showUserDropdown = false;
    }
  }

  // Fetch user profile when authenticated
  $effect(() => {
    if ($authStore) {
      userApi.getCurrentUser()
        .then(profile => {
          userProfile = profile;
        })
        .catch(error => {
          console.error('Failed to fetch user profile:', error);
        });
    } else {
      userProfile = null;
    }
  });

  $effect(() => {
    if (showAdminDropdown || showUserDropdown) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  // Computed values for display
  let displayName = $derived(userProfile?.displayName || $authStore?.email || 'User');
  let isAdmin = $derived(userProfile?.isAdmin === true);
</script>

<header class="bg-gray-800 text-white p-4">
  <nav class="container mx-auto flex justify-between items-center">
    <a href="/" class="text-xl font-bold">Nu-sletter</a>
    <div class="flex items-center space-x-2">
      {#if $authStore}
        {#if isAdmin}
          <div class="relative" bind:this={adminDropdownRef}>
            <button 
              onclick={toggleAdminDropdown}
              class="px-3 py-2 rounded-md hover:bg-gray-700 focus:outline-none flex items-center"
            >
              Admin
              <svg class="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
            {#if showAdminDropdown}
              <div class="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                <div class="py-1" role="menu" tabindex="-1" onmouseleave={closeAdminDropdown}>
                  <a 
                    href="/admin/newsletters" 
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onclick={closeAdminDropdown}
                  >
                    Newsletters
                  </a>
                  <a 
                    href="/admin/generate" 
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onclick={closeAdminDropdown}
                  >
                    Generate
                  </a>
                  <a 
                    href="/admin/questions" 
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onclick={closeAdminDropdown}
                  >
                    Questions
                  </a>
                </div>
              </div>
            {/if}
          </div>
        {/if}
        <a href="/dashboard" class="px-3 py-2 rounded-md hover:bg-gray-700">Dashboard</a>
        <a href="/respond" class="px-3 py-2 rounded-md hover:bg-gray-700">Respond</a>
        <div class="relative" bind:this={userDropdownRef}>
          <button 
            onclick={toggleUserDropdown}
            class="px-3 py-2 rounded-md hover:bg-gray-700 focus:outline-none flex items-center ml-4"
          >
            Welcome, {displayName}
            <svg class="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
          {#if showUserDropdown}
            <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <div class="py-1" role="menu" tabindex="-1" onmouseleave={closeUserDropdown}>
                <a 
                  href="/settings" 
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onclick={closeUserDropdown}
                >
                  Settings
                </a>
                <button 
                  onclick={() => { logout(); closeUserDropdown(); }}
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            </div>
          {/if}
        </div>
      {:else}
        <a href="/login" class="px-3 py-2 rounded-md hover:bg-gray-700">Login</a>
        <a href="/signup" class="ml-2 px-3 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700">Sign Up</a>
      {/if}
    </div>
  </nav>
</header>

<main class="container mx-auto p-4">
  {@render children()}
</main>
