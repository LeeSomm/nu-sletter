
<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/authStore.js';

  interface Question {
    id: string;
    text: string;
    source: 'user' | 'admin' | 'llm';
    createdBy: string;
    newsletterId?: string;
    isActive: boolean;
    usageCount: number;
    category?: string;
    tags?: string[];
    newsletterName?: string;
    responseCount?: number;
    createdAt: any;
  }

  let questions = $state<Question[]>([]);
  let loading = $state(true);
  let error = $state('');
  let searchTerm = $state('');
  let editingQuestion = $state<Question | null>(null);
  let showEditModal = $state(false);

  // Reactive filtered questions
  let filteredQuestions = $derived(
    questions.filter(question => 
      question.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (question.newsletterName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (question.source || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (question.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  onMount(async () => {
    await loadQuestions();
  });

  async function getAuthToken() {
    // Get the current user's ID token
    const { auth } = await import('$lib/firebase');
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return await user.getIdToken();
  }

  async function loadQuestions() {
    try {
      loading = true;
      error = '';

      const token = await getAuthToken();
      const response = await fetch('/api/admin/questions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load questions');
      }

      const data = await response.json();
      questions = data.questions || [];
    } catch (err: any) {
      console.error('Error loading questions:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function openEditModal(question: Question) {
    editingQuestion = { ...question };
    showEditModal = true;
  }

  function closeEditModal() {
    editingQuestion = null;
    showEditModal = false;
    error = '';
  }

  async function saveQuestion() {
    if (!editingQuestion) return;

    try {
      error = '';
      const token = await getAuthToken();
      
      const response = await fetch('/api/admin/questions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          questionId: editingQuestion.id,
          updates: {
            text: editingQuestion.text,
            isActive: editingQuestion.isActive,
            category: editingQuestion.category,
            tags: editingQuestion.tags
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save question');
      }

      // Update the local question
      const questionIndex = questions.findIndex(q => q.id === editingQuestion!.id);
      if (questionIndex !== -1) {
        questions[questionIndex] = { ...editingQuestion! };
      }

      closeEditModal();
    } catch (err: any) {
      console.error('Error saving question:', err);
      error = err.message;
    }
  }

  async function toggleQuestionStatus(question: Question) {
    try {
      error = '';
      const token = await getAuthToken();
      
      const response = await fetch('/api/admin/questions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          questionId: question.id,
          updates: {
            isActive: !question.isActive
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update question');
      }

      // Update the local question
      const questionIndex = questions.findIndex(q => q.id === question.id);
      if (questionIndex !== -1) {
        questions[questionIndex].isActive = !question.isActive;
      }
    } catch (err: any) {
      console.error('Error updating question:', err);
      error = err.message;
    }
  }

  function formatDate(timestamp: any) {
    if (!timestamp) return 'Unknown';
    try {
      let date: Date;
      
      if (timestamp.toDate) {
        // Firestore Timestamp (shouldn't happen after API serialization, but keep for safety)
        date = timestamp.toDate();
      } else if (typeof timestamp === 'string') {
        // ISO string from API or dummy data
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        // Already a Date object
        date = timestamp;
      } else {
        // Try to convert whatever it is
        date = new Date(timestamp);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  }
</script>

<svelte:head>
  <title>Question Management - Admin Panel</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="border-b border-gray-200 pb-4">
    <h1 class="text-3xl font-bold text-gray-900">Question Management</h1>
    <p class="text-gray-600 mt-2">Manage all questions across newsletters</p>
  </div>

  <!-- Search and Filters -->
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex-1">
        <label for="search" class="block text-sm font-medium text-gray-700 mb-2">Search Questions</label>
        <input
          id="search"
          type="text"
          bind:value={searchTerm}
          placeholder="Search by question text, newsletter, source, or category..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div class="flex items-end">
        <button 
          onclick={loadQuestions}
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Refresh
        </button>
      </div>
    </div>
  </div>

  <!-- Error Display -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <div class="mt-2 text-sm text-red-700">{error}</div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Questions Table -->
  <div class="bg-white shadow rounded-lg overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <h3 class="text-lg font-medium text-gray-900">
        Questions ({filteredQuestions.length} of {questions.length})
      </h3>
    </div>
    
    {#if loading}
      <div class="px-6 py-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-500">Loading questions...</p>
      </div>
    {:else if filteredQuestions.length === 0}
      <div class="px-6 py-8 text-center">
        <p class="text-gray-500">No questions found.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Newsletter</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responses</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each filteredQuestions as question (question.id)}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900 max-w-xs truncate" title={question.text}>
                    {question.text}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {question.newsletterName || '-'}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {
                    question.source === 'admin' ? 'bg-green-100 text-green-800' :
                    question.source === 'user' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }">
                    {question.source}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {question.category || '-'}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {question.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    {question.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {question.responseCount || 0}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {question.usageCount || 0}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(question.createdAt)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onclick={() => openEditModal(question)}
                    class="text-blue-600 hover:text-blue-900 focus:outline-none"
                  >
                    Edit
                  </button>
                  <button
                    onclick={() => toggleQuestionStatus(question)}
                    class="text-indigo-600 hover:text-indigo-900 focus:outline-none"
                  >
                    {question.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<!-- Edit Modal -->
{#if showEditModal && editingQuestion}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <h3 class="text-lg font-bold text-gray-900 mb-4">Edit Question</h3>
      
      <form onsubmit={(e) => { e.preventDefault(); saveQuestion(); }}>
        <div class="mb-4">
          <label for="questionText" class="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
          <textarea
            id="questionText"
            bind:value={editingQuestion.text}
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          ></textarea>
        </div>

        <div class="mb-4">
          <label for="questionCategory" class="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <input
            id="questionCategory"
            type="text"
            bind:value={editingQuestion.category}
            placeholder="Optional category"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div class="mb-4">
          <label for="questionTags" class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <input
            id="questionTags"
            type="text"
            value={editingQuestion.tags ? editingQuestion.tags.join(', ') : ''}
            oninput={(e) => {
              const target = e.target as HTMLInputElement;
              const value = target.value;
              if (editingQuestion) {
                editingQuestion.tags = value ? value.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [];
              }
            }}
            placeholder="Comma-separated tags"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div class="mb-6">
          <label class="flex items-center">
            <input
              type="checkbox"
              bind:checked={editingQuestion.isActive}
              class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span class="ml-2 text-sm text-gray-700">Active</span>
          </label>
        </div>

        <div class="flex justify-end space-x-3">
          <button
            type="button"
            onclick={closeEditModal}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
