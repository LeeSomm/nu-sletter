import { auth } from '$lib/firebase';

/**
 * Base API client with authentication
 */
class ApiClient {
  private async getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getAuthToken();
    
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response;
  }

  async get(endpoint: string): Promise<any> {
    const response = await this.request(endpoint);
    return response.json();
  }

  async post(endpoint: string, data: any): Promise<any> {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async put(endpoint: string, data: any): Promise<any> {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async delete(endpoint: string): Promise<any> {
    const response = await this.request(endpoint, {
      method: 'DELETE',
    });
    return response.json();
  }
}

const api = new ApiClient();

/**
 * Newsletter API functions
 */
export const newsletterApi = {
  // Get all newsletters for current user
  getAll: () => api.get('/api/newsletters'),
  
  // Get specific newsletter
  get: (id: string) => api.get(`/api/newsletters/${id}`),
  
  // Create newsletter
  create: (data: {
    name: string;
    description: string;
    prompt: string;
    settings?: any;
  }) => api.post('/api/newsletters', data),
  
  // Update newsletter
  update: (id: string, data: any) => api.put(`/api/newsletters/${id}`, data),
  
  // Delete newsletter
  delete: (id: string) => api.delete(`/api/newsletters/${id}`),
};

/**
 * Questions API functions
 */
export const questionsApi = {
  // Get questions for newsletter
  getForNewsletter: (newsletterId: string) => 
    api.get(`/api/questions?newsletterId=${newsletterId}`),
  
  // Get specific question
  get: (id: string) => api.get(`/api/questions/${id}`),
  
  // Create question
  create: (data: {
    newsletterId: string;
    text: string;
    source?: 'user' | 'admin' | 'llm';
    category?: string;
    tags?: string[];
  }) => api.post('/api/questions', data),
  
  // Update question
  update: (id: string, data: any) => api.put(`/api/questions/${id}`, data),
  
  // Delete question
  delete: (id: string) => api.delete(`/api/questions/${id}`),
};

/**
 * Responses API functions
 */
export const responsesApi = {
  // Get responses for session
  getForSession: (sessionId: string, userId?: string) => {
    const params = userId ? `?sessionId=${sessionId}&userId=${userId}` : `?sessionId=${sessionId}`;
    return api.get(`/api/responses${params}`);
  },
  
  // Submit response
  submit: (data: {
    newsletterId: string;
    sessionId: string;
    questionId: string;
    response: string;
    isPublic?: boolean;
    submittedQuestion?: string;
  }) => api.post('/api/responses', data),
};

/**
 * Sessions API functions
 */
export const sessionsApi = {
  // Get active session for newsletter
  getActive: (newsletterId: string) => 
    api.get(`/api/sessions?newsletterId=${newsletterId}`),
  
  // Create session
  create: (data: {
    newsletterId: string;
    weekIdentifier: string;
    weekStart?: Date;
    weekEnd?: Date;
  }) => api.post('/api/sessions', data),
};

/**
 * Question assignments API functions
 */
export const assignmentsApi = {
  // Get assignments for user in session
  getForUser: (sessionId: string, userId?: string) => {
    const params = userId ? `?sessionId=${sessionId}&userId=${userId}` : `?sessionId=${sessionId}`;
    return api.get(`/api/assignments${params}`);
  },
  
  // Assign question to user
  create: (data: {
    sessionId: string;
    newsletterId: string;
    userId: string;
    questionId: string;
  }) => api.post('/api/assignments', data),
};

/**
 * Members API functions
 */
export const membersApi = {
  // Get members for a newsletter
  getForNewsletter: (newsletterId: string) => api.get(`/api/newsletters/${newsletterId}/members`),
  
  // Add member to newsletter
  add: (newsletterId: string, email: string, role: string = 'member') => 
    api.post(`/api/newsletters/${newsletterId}/members`, { email, role }),
  
  // Remove member from newsletter
  remove: (newsletterId: string, userId: string) => 
    api.delete(`/api/newsletters/${newsletterId}/members?userId=${userId}`),
};
