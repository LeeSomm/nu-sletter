
import { writable } from 'svelte/store';
import { auth } from '$lib/firebase';
import type { User } from 'firebase/auth';

function createAuthStore() {
  const { subscribe, set } = writable<User | null>(null);

  auth.onAuthStateChanged(user => {
    set(user);
  });

  return {
    subscribe,
  };
}

export const authStore = createAuthStore();
