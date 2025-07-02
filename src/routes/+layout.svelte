
<script lang="ts">
  import '../app.css';
  import { authStore } from '$lib/stores/authStore';
  import { auth } from '$lib/firebase';
  import { signOut } from 'firebase/auth';
  import { goto } from '$app/navigation';

  let { children } = $props();

  async function logout() {
    await signOut(auth);
    goto('/login');
  }
</script>

<header class="bg-gray-800 text-white p-4">
  <nav class="container mx-auto flex justify-between items-center">
    <a href="/" class="text-xl font-bold">Nu-sletter</a>
    <div>
      {#if $authStore}
        <a href="/admin/newsletter" class="px-3 py-2 rounded-md hover:bg-gray-700">Admin</a>
        <a href="/dashboard" class="px-3 py-2 rounded-md hover:bg-gray-700">Dashboard</a>
        <a href="/respond" class="px-3 py-2 rounded-md hover:bg-gray-700">Respond</a>
        <span class="ml-4">Welcome, {$authStore.email}</span>
        <button on:click={logout} class="ml-4 px-3 py-2 bg-red-600 rounded-md hover:bg-red-700">Logout</button>
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
