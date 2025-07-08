
<script lang="ts">
  import { auth } from '$lib/firebase';
  import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
  import { goto } from '$app/navigation';
  import { userApi } from '$lib/api';

  let email = '';
  let password = '';
  let error: string | null = null;
  let isSubmitting = false;

  async function login() {
    isSubmitting = true;
    error = null;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      goto('/');
    } catch (err: any) {
      error = err.message;
    } finally {
      isSubmitting = false;
    }
  }

  async function signInWithGoogle() {
    isSubmitting = true;
    error = null;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Try to get existing user profile first
      try {
        await userApi.getCurrentUser();
        // User profile exists, proceed to dashboard
      } catch (userError: any) {
        // User profile doesn't exist (404), create it
        if (userError.message?.includes('User not found') || userError.message?.includes('404')) {
          await userApi.create({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            preferences: {
              emailNotifications: true,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
            }
          });
        } else {
          // Some other error occurred
          throw userError;
        }
      }
      
      goto('/');
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      error = err.message || 'Failed to sign in with Google';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="flex items-center justify-center min-h-screen bg-gray-100">
  <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
    <h2 class="text-2xl font-bold text-center">Login</h2>
    <form on:submit|preventDefault={login} class="space-y-6">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
        <input type="email" id="email" bind:value={email} class="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required disabled={isSubmitting} />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
        <input type="password" id="password" bind:value={password} class="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required disabled={isSubmitting} />
      </div>
      {#if error}
        <p class="text-sm text-red-600">{error}</p>
      {/if}
      <div>
        <button type="submit" class="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </div>
    </form>
    <div class="relative">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-300"></div>
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-2 bg-white text-gray-500">Or continue with</span>
      </div>
    </div>
    <div>
      <button on:click={signInWithGoogle} class="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50" disabled={isSubmitting}>
        <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.651-3.358-11.303-8H6.306C9.656,39.663,16.318,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.089,5.571l6.19,5.238C42.022,35.28,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
        Sign in with Google
      </button>
    </div>
  </div>
</div>
