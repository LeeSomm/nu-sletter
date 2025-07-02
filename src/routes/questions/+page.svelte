
<script lang="ts">
  import { db } from '$lib/firebase';
  import { collection, getDocs, query, orderBy } from 'firebase/firestore';
  import type { DocumentData } from 'firebase/firestore';

  let questions: DocumentData[] = [];
  let loading = true;

  async function loadQuestions() {
    const q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    questions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    loading = false;
  }

  loadQuestions();
</script>

<div class="max-w-2xl mx-auto">
  <div class="flex justify-between items-center mb-4">
    <h1 class="text-3xl font-bold">Questions</h1>
    <a href="/questions/submit" class="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
      Submit a Question
    </a>
  </div>

  {#if loading}
    <p>Loading questions...</p>
  {:else if questions.length === 0}
    <p>No questions have been submitted yet.</p>
  {:else}
    <ul class="space-y-4">
      {#each questions as question}
        <li class="p-4 bg-white rounded-lg shadow">
          <p class="text-lg">{question.text}</p>
          <p class="text-sm text-gray-500 mt-2">
            Submitted by: {question.source}
          </p>
        </li>
      {/each}
    </ul>
  {/if}
</div>
