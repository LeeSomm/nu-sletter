
<script lang="ts">
  import { auth } from '$lib/firebase';
  import { createUserWithEmailAndPassword } from 'firebase/auth';
  import { goto } from '$app/navigation';
  import { userApi } from '$lib/api';

  let email = '';
  let password = '';
  let displayName = '';
  let error: string | null = null;
  let loading = false;

  async function signup() {
    if (loading) return;
    
    try {
      loading = true;
      error = null;

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      await userApi.create({
        uid: user.uid,
        email: user.email || email,
        displayName: displayName.trim() || undefined,
        preferences: {
          emailNotifications: true,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        }
      });

      goto('/');
    } catch (err: any) {
      console.error('Signup error:', err);
      error = err.message || 'Failed to create account';
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex items-center justify-center min-h-screen bg-gray-100">
  <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
    <h2 class="text-2xl font-bold text-center">Sign Up</h2>
    <form on:submit|preventDefault={signup} class="space-y-6">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
        <input 
          type="email" 
          id="email" 
          bind:value={email} 
          disabled={loading}
          class="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed" 
          required 
        />
      </div>
      <div>
        <label for="displayName" class="block text-sm font-medium text-gray-700">Display Name (Optional)</label>
        <input 
          type="text" 
          id="displayName" 
          bind:value={displayName} 
          disabled={loading}
          class="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed" 
          placeholder="Your name"
        />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
        <input 
          type="password" 
          id="password" 
          bind:value={password} 
          disabled={loading}
          class="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed" 
          required 
        />
      </div>
      {#if error}
        <p class="text-sm text-red-600">{error}</p>
      {/if}
      <div>
        <button 
          type="submit" 
          disabled={loading}
          class="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </div>
    </form>
  </div>
</div>
