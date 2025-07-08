<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/authStore';
  import { userApi } from '$lib/api';
  import { auth } from '$lib/firebase';
  import { deleteUser } from 'firebase/auth';
  import { goto } from '$app/navigation';

  let userProfile = $state<any>(null);
  let loading = $state(true);
  let saving = $state(false);
  let deleting = $state(false);
  let error = $state('');
  let success = $state('');

  // Form fields
  let displayName = $state('');
  let emailNotifications = $state(true);
  let timezone = $state('UTC');

  // Delete confirmation
  let showDeleteConfirmation = $state(false);
  let deleteConfirmationText = $state('');

  onMount(async () => {
    await loadUserProfile();
  });

  async function loadUserProfile() {
    try {
      loading = true;
      error = '';
      
      userProfile = await userApi.getCurrentUser();
      
      // Populate form fields
      if (userProfile) {
        displayName = userProfile.displayName || '';
        emailNotifications = userProfile.preferences?.emailNotifications ?? true;
        timezone = userProfile.preferences?.timezone || 'UTC';
      }
      
    } catch (err: any) {
      console.error('Error loading user profile:', err);
      error = 'Failed to load user profile';
    } finally {
      loading = false;
    }
  }

  async function saveSettings() {
    if (!$authStore?.uid) return;
    
    try {
      saving = true;
      error = '';
      success = '';

      await userApi.update($authStore.uid, {
        displayName: displayName.trim(),
        preferences: {
          emailNotifications,
          timezone
        }
      });

      success = 'Settings saved successfully!';
      
      // Reload profile to reflect changes
      await loadUserProfile();
      
    } catch (err: any) {
      console.error('Error saving settings:', err);
      error = 'Failed to save settings';
    } finally {
      saving = false;
    }
  }

  async function deleteAccount() {
    if (!$authStore?.uid || deleteConfirmationText !== 'DELETE') return;
    
    try {
      deleting = true;
      error = '';

      // Delete user from Firestore first
      await userApi.delete($authStore.uid);
      
      // Delete Firebase Auth account
      const currentUser = auth.currentUser;
      if (currentUser) {
        await deleteUser(currentUser);
      }

      // Redirect to home page
      goto('/');
      
    } catch (err: any) {
      console.error('Error deleting account:', err);
      error = 'Failed to delete account. You may need to re-authenticate and try again.';
      deleting = false;
    }
  }

  function cancelDelete() {
    showDeleteConfirmation = false;
    deleteConfirmationText = '';
  }
</script>

<svelte:head>
  <title>Account Settings - Nu-sletter</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
  <div class="bg-white shadow rounded-lg">
    <div class="px-6 py-4 border-b border-gray-200">
      <h1 class="text-2xl font-bold text-gray-900">Account Settings</h1>
      <p class="mt-1 text-sm text-gray-600">Manage your account information and preferences</p>
    </div>

    {#if loading}
      <div class="px-6 py-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="mt-2 text-gray-600">Loading your settings...</p>
      </div>
    {:else if userProfile}
      <div class="px-6 py-6 space-y-6">
        <!-- Account Information -->
        <div>
          <h2 class="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
          
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
              <input 
                type="email" 
                id="email" 
                value={userProfile.email || ''} 
                disabled
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p class="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <div>
              <label for="displayName" class="block text-sm font-medium text-gray-700">Display Name</label>
              <input 
                type="text" 
                id="displayName" 
                bind:value={displayName}
                placeholder="Your display name"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <!-- Preferences -->
        <div>
          <h2 class="text-lg font-medium text-gray-900 mb-4">Preferences</h2>
          
          <div class="space-y-4">
            <div class="flex items-center">
              <input 
                type="checkbox" 
                id="emailNotifications" 
                bind:checked={emailNotifications}
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label for="emailNotifications" class="ml-2 block text-sm text-gray-900">
                Email Notifications
              </label>
            </div>
            <p class="text-xs text-gray-500 ml-6">Receive email notifications about newsletter activities</p>

            <div>
              <label for="timezone" class="block text-sm font-medium text-gray-700">Timezone</label>
              <select 
                id="timezone" 
                bind:value={timezone}
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Australia/Sydney">Sydney</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Account Actions -->
        <div class="border-t border-gray-200 pt-6">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div>
              {#if error}
                <p class="text-sm text-red-600">{error}</p>
              {/if}
              {#if success}
                <p class="text-sm text-green-600">{success}</p>
              {/if}
            </div>
            
            <div class="flex space-x-3">
              <button 
                onclick={saveSettings}
                disabled={saving}
                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="border-t border-red-200 pt-6">
          <div class="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 class="text-lg font-medium text-red-900 mb-2">Danger Zone</h3>
            <p class="text-sm text-red-700 mb-4">
              Once you delete your account, there is no going back. This will permanently delete your account and all associated data.
            </p>
            
            {#if !showDeleteConfirmation}
              <button 
                onclick={() => showDeleteConfirmation = true}
                class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Account
              </button>
            {:else}
              <div class="space-y-3">
                <p class="text-sm font-medium text-red-900">
                  Type "DELETE" to confirm account deletion:
                </p>
                <input 
                  type="text" 
                  bind:value={deleteConfirmationText}
                  placeholder="Type DELETE here"
                  class="block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
                <div class="flex space-x-3">
                  <button 
                    onclick={deleteAccount}
                    disabled={deleteConfirmationText !== 'DELETE' || deleting}
                    class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                  <button 
                    onclick={cancelDelete}
                    disabled={deleting}
                    class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {:else}
      <div class="px-6 py-8 text-center">
        <p class="text-gray-600">Unable to load user profile</p>
        <button 
          onclick={loadUserProfile}
          class="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    {/if}
  </div>
</div>
