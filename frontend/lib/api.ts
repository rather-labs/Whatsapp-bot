'use server';

import { makeAuthenticatedRequest } from './auth';

const backendUrl =  process.env.NEXT_PUBLIC_BACKEND_URL;

// Server action for GET requests
export async function apiGet(endpoint: string): Promise<unknown> {
  const response = await makeAuthenticatedRequest(`${backendUrl}${endpoint}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

// Server action for POST requests
export async function apiPost(endpoint: string, data: unknown): Promise<unknown> {
  const response = await makeAuthenticatedRequest(`${backendUrl}${endpoint}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

// Server action for PUT requests
export async function apiPut(endpoint: string, data: unknown): Promise<unknown> {
  const response = await makeAuthenticatedRequest(`${backendUrl}${endpoint}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

// Server action for DELETE requests
export async function apiDelete(endpoint: string): Promise<unknown> {
  const response = await makeAuthenticatedRequest(`${backendUrl}${endpoint}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
} 