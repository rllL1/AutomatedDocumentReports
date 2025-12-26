const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle token expiration/invalid token
      if (response.status === 401 && (data.error === 'Invalid or expired token' || data.error === 'No authorization token provided')) {
        // Clear stored auth data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        
        // Redirect to login
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      throw new Error(data.error || 'An error occurred');
    }

    return data;
  } catch (error) {
    // Network errors or parsing errors
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check if the backend is running.');
    }
    throw error;
  }
}

export async function apiClientFormData<T = unknown>(
  endpoint: string,
  formData: FormData,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle token expiration/invalid token
      if (response.status === 401 && (data.error === 'Invalid or expired token' || data.error === 'No authorization token provided')) {
        // Clear stored auth data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        
        // Redirect to login
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      throw new Error(data.error || 'An error occurred');
    }

    return data;
  } catch (error) {
    // Network errors or parsing errors
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check if the backend is running.');
    }
    throw error;
  }
}
