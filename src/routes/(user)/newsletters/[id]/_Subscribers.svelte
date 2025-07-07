<script lang="ts">
  import { onMount } from 'svelte';
  import { membersApi } from '$lib/api';

  export let newsletterId: string;

  let members: any[] = [];
  let loading = true;
  let error: string | null = null;
  let newMemberEmail = '';

  onMount(async () => {
    await loadMembers();
  });

  async function loadMembers() {
    loading = true;
    try {
      members = await membersApi.getForNewsletter(newsletterId);
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function handleAddMember() {
    if (!newMemberEmail) return;
    try {
      await membersApi.add(newsletterId, newMemberEmail, 'member');
      newMemberEmail = '';
      await loadMembers();
    } catch (err: any) {
      error = err.message;
    }
  }

  async function handleRemoveMember(userId: string) {
    try {
      await membersApi.remove(newsletterId, userId);
      await loadMembers();
    } catch (err: any) {
      error = err.message;
    }
  }
</script>

<div>
  <h2 class="text-2xl font-bold mb-4">Members</h2>

  <div class="mb-6">
    <form on:submit|preventDefault={handleAddMember} class="flex gap-2">
      <input type="email" bind:value={newMemberEmail} class="input input-bordered w-full" placeholder="new.member@example.com" />
      <button type="submit" class="btn btn-primary">Add</button>
    </form>
  </div>

  {#if loading}
    <p>Loading members...</p>
  {:else if error}
    <p class="text-red-600">{error}</p>
  {:else if members.length === 0}
    <p>This newsletter has no members yet.</p>
  {:else}
    <ul class="space-y-2">
      {#each members as member}
        <li class="flex justify-between items-center p-2 bg-base-100 rounded">
          <div>
            <span>{member.email}</span>
            <span class="badge badge-sm ml-2">{member.role}</span>
          </div>
          <button on:click={() => handleRemoveMember(member.userId)} class="btn btn-xs btn-error">Remove</button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
