import axios, { AxiosInstance, AxiosError } from 'axios';

const AUTH_SERVICE = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL!;
const APPOINTMENT_SERVICE = process.env.NEXT_PUBLIC_APPOINTMENT_SERVICE_URL!;
const NOTIFICATION_SERVICE = process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL!;

const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Only handle 401 in browser, not during SSR
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        // Clear token and redirect - but do it only once
        const hasRedirected = sessionStorage.getItem('auth_redirect');
        
        if (!hasRedirected) {
          sessionStorage.setItem('auth_redirect', 'true');
          
          // Clear the cookie
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict';
          
          // Redirect after a brief delay
          setTimeout(() => {
            sessionStorage.removeItem('auth_redirect');
            window.location.href = '/login';
          }, 100);
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const authApi = createApiClient(AUTH_SERVICE);
export const appointmentApi = createApiClient(APPOINTMENT_SERVICE);
export const notificationApi = createApiClient(NOTIFICATION_SERVICE);

export default authApi;