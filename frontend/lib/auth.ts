class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private tokenExpiry: number | null = null;
  private backendUrl: string;

  constructor() {
    this.backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    
    // Initialize auth on client side only
    if (typeof window !== 'undefined') {
      this.initializeAuth();
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async initializeAuth(): Promise<void> {
    try {
      await this.getAuthToken();
      console.log('✅ Frontend authenticated with server');
    } catch (error) {
      console.error('❌ Failed to authenticate with server:', error);
    }
  }

  private async getAuthToken(): Promise<string> {
    try {
      const response = await fetch(`${this.backendUrl}/api/auth/token/frontend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: process.env.NEXT_PUBLIC_FRONTEND_SECRET
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get auth token');
      }

      const data = await response.json();
      this.token = data.token;

      // Decode token to get expiry (basic decoding, no verification needed on client)
      if (this.token) {
        const payload = JSON.parse(atob(this.token.split('.')[1]));
        this.tokenExpiry = payload.exp * 1000; // Convert to milliseconds
      }

      if (!this.token) {
        throw new Error('Failed to obtain authentication token');
      }
      return this.token;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      throw error;
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.token || (this.tokenExpiry && Date.now() >= this.tokenExpiry - 60000)) {
      // Refresh 1 minute before expiry
      await this.getAuthToken();
    }
  }

  async getAuthHeaders(): Promise<Record<string, string>> {
    await this.ensureValidToken();
    if (!this.token) {
      throw new Error('No authentication token available');
    }
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = await this.getAuthHeaders();
    
    return fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
  }
}

export default AuthService; 