import axios from 'axios';

// Get API URL in a browser-safe way
// For development, default to localhost if .env value isn't available
const API_URL = window.__ENV__?.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create an axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to inject auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for global error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Clear token on auth errors
      localStorage.removeItem('authToken');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Extract error message for client
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    
    // Create an error with the message
    const enhancedError = new Error(errorMessage);
    
    // Add additional context to the error
    Object.assign(enhancedError, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });
    
    return Promise.reject(enhancedError);
  }
);

// Add TypeScript interface for window global
declare global {
  interface Window {
    __ENV__?: {
      REACT_APP_API_URL?: string;
      [key: string]: any;
    };
  }
}

// API utility class
class ApiService {
  /**
   * Perform GET request
   */
  async get<T = any>(url: string, config?: any): Promise<T> {
    const response = await axiosInstance.get(url, config);
    return response.data as T;
  }

  /**
   * Perform POST request
   */
  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await axiosInstance.post(url, data, config);
    return response.data as T;
  }

  /**
   * Perform PUT request
   */
  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await axiosInstance.put(url, data, config);
    return response.data as T;
  }

  /**
   * Perform DELETE request
   */
  async del<T = any>(url: string, config?: any): Promise<T> {
    const response = await axiosInstance.delete(url, config);
    return response.data as T;
  }

  /**
   * Upload file with form data
   */
  async uploadFile<T = any>(url: string, formData: FormData, config?: any): Promise<T> {
    const response = await axiosInstance.post(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as T;
  }
}

export default new ApiService(); 