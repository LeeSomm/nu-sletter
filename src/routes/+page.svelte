
<script lang="ts">
  import { authStore } from '$lib/stores/authStore';
</script>

<div class="text-center">
  <h1 class="text-4xl font-bold">Welcome to Nu-sletter</h1>
  {#if $authStore}
    <p class="mt-4 text-lg">You are logged in as {$authStore.email}</p>
  {:else}
    <p class="mt-4 text-lg">Please log in to continue.</p>
  {/if}
</div>

