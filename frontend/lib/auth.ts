'use server';

import { cookies } from 'next/headers';

const getBackendUrl = () => {
  return process.env.BACKEND_URL || '';
};

async function getAuthToken(): Promise<string> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/auth/token/frontend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: process.env.FRONTEND_SECRET
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get auth token');
    }

    const data = await response.json();
    const token = data.token;

    if (!token) {
      throw new Error('Failed to obtain authentication token');
    }

    // Decode token to get expiry
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const expiresAt = payload.exp * 1000; // Convert to milliseconds

    // Store token in cookies for server-side access
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(expiresAt - 60000) // Expire 1 minute before actual expiry
    });

    return token;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    throw error;
  }
}

async function getStoredToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('auth-token');
    return tokenCookie?.value || null;
  } catch (error) {
    console.error('Failed to get stored token:', error);
    return null;
  }
}

async function isTokenValid(token: string): Promise<boolean> {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const expiresAt = payload.exp * 1000;
    return Date.now() < expiresAt - 60000; // Check if expires in more than 1 minute
  } catch (error) {
    return false;
  }
}

export async function getValidToken(): Promise<string> {
  const storedToken = await getStoredToken();
  
  if (storedToken && await isTokenValid(storedToken)) {
    return storedToken;
  }

  // Token is invalid or doesn't exist, get a new one
  return await getAuthToken();
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getValidToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = await getAuthHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
} 