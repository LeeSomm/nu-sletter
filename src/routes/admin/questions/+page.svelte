
<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$lib/firebase';
  import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
  import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

  interface Question {
    id: string;
    text: string;
    source: 'user' | 'admin' | 'llm';
    isActive: boolean;
  }

  let questions: Question[] = [];
  let isLoading = true;
  let error: string | null = null;

  async function fetchQuestions() {
    try {
      const querySnapshot = await getDocs(collection(db, 'questions'));
      questions = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text,
          source: data.source,
          isActive: data.isActive,
        };
      });
    } catch (err: any) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  onMount(fetchQuestions);

  async function toggleActive(question: Question) {
    try {
      const questionRef = doc(db, 'questions', question.id);
      await updateDoc(questionRef, { isActive: !question.isActive });
      question.isActive = !question.isActive;
      questions = questions; // Trigger reactivity
    } catch (err: any) {
      error = `Failed to update question: ${err.message}`;
    }
  }

  async function deleteQuestion(questionId: string) {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteDoc(doc(db, 'questions', questionId));
      questions = questions.filter(q => q.id !== questionId);
    } catch (err: any) {
      error = `Failed to delete question: ${err.message}`;
    }
  }

  async function addQuestion() {
    const text = prompt('Enter the new question text:');
    if (text) {
      try {
        const newQuestion = {
          text,
          source: 'admin',
          createdBy: 'admin', // Or get current admin user
          createdAt: serverTimestamp(),
          usageCount: 0,
          isActive: true,
        };
        const docRef = await addDoc(collection(db, 'questions'), newQuestion);
        questions = [...questions, { id: docRef.id, ...newQuestion }];
      } catch (err: any) {
        error = `Failed to add question: ${err.message}`;
      }
    }
  }
  
  async function editQuestion(question: Question) {
    const newText = prompt('Enter the new text for the question:', question.text);
    if (newText && newText !== question.text) {
      try {
        const questionRef = doc(db, 'questions', question.id);
        await updateDoc(questionRef, { text: newText });
        question.text = newText;
        questions = questions; // Trigger reactivity
      } catch (err: any) {
        error = `Failed to edit question: ${err.message}`;
      }
    }
  }
</script>

<div class="container mx-auto p-4">
  <div class="flex justify-between items-center mb-4">
    <h1 class="text-2xl font-bold">Question Management</h1>
    <button on:click={addQuestion} class="px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700">
      Add Question
    </button>
  </div>

  {#if isLoading}
    <p>Loading questions...</p>
  {:else if error}
    <p class="text-red-600">{error}</p>
  {:else}
    <div class="overflow-x-auto bg-white rounded-lg shadow">
      <table class="min-w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#each questions as question (question.id)}
            <tr>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{question.text}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  class:bg-green-100={question.source === 'admin'}
                  class:text-green-800={question.source === 'admin'}
                  class:bg-blue-100={question.source === 'user'}
                  class:text-blue-800={question.source === 'user'}
                  class:bg-purple-100={question.source === 'llm'}
                  class:text-purple-800={question.source === 'llm'}
                >
                  {question.source}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  class:bg-green-100={question.isActive}
                  class:text-green-800={question.isActive}
                  class:bg-red-100={!question.isActive}
                  class:text-red-800={!question.isActive}
                >
                  {question.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button on:click={() => toggleActive(question)} class="text-indigo-600 hover:text-indigo-900 mr-4">
                  {question.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button on:click={() => editQuestion(question)} class="text-yellow-600 hover:text-yellow-900 mr-4">
                  Edit
                </button>
                <button on:click={() => deleteQuestion(question.id)} class="text-red-600 hover:text-red-900">
                  Delete
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
