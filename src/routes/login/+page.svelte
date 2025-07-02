
<script lang="ts">
  import { auth } from '$lib/firebase';
  import { signInWithEmailAndPassword } from 'firebase/auth';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let error: string | null = null;

  async function login() {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      goto('/');
    } catch (err: any) {
      error = err.message;
    }
  }
</script>

<div class="flex items-center justify-center min-h-screen bg-gray-100">
  <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
    <h2 class="text-2xl font-bold text-center">Login</h2>
    <form on:submit|preventDefault={login} class="space-y-6">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
        <input type="email" id="email" bind:value={email} class="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
        <input type="password" id="password" bind:value={password} class="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
      </div>
      {#if error}
        <p class="text-sm text-red-600">{error}</p>
      {/if}
      <div>
        <button type="submit" class="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Login
        </button>
      </div>
    </form>
  </div>
</div>
