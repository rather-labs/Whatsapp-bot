import AuthService from './auth';

const authService = AuthService.getInstance();
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export const ApiClient = {
  async get(endpoint: string): Promise<unknown> {
    const response = await authService.makeAuthenticatedRequest(`${backendUrl}${endpoint}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  },

  async post(endpoint: string, data: unknown): Promise<unknown> {
    const response = await authService.makeAuthenticatedRequest(`${backendUrl}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  },

  async put(endpoint: string, data: unknown): Promise<unknown> {
    const response = await authService.makeAuthenticatedRequest(`${backendUrl}${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  },

  async delete(endpoint: string): Promise<unknown> {
    const response = await authService.makeAuthenticatedRequest(`${backendUrl}${endpoint}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }
};

export default ApiClient; 