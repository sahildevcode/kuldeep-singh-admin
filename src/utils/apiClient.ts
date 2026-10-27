export const getAdminAuthToken = (): string | null => {
  try {
    return sessionStorage.getItem('kuldeep_admin_token') || localStorage.getItem('kuldeep_admin_token');
  } catch {
    return null;
  }
};

export const setAdminAuthToken = (token: string | null) => {
  try {
    if (token) {
      sessionStorage.setItem('kuldeep_admin_token', token);
      localStorage.setItem('kuldeep_admin_token', token);
    } else {
      sessionStorage.removeItem('kuldeep_admin_token');
      localStorage.removeItem('kuldeep_admin_token');
    }
  } catch {}
};

/**
 * Enhanced fetch wrapper for Admin API requests:
 * 1. Always includes credentials: 'include' for HttpOnly cross-site cookies
 * 2. Attaches Authorization: Bearer <token> if available for maximum cross-origin reliability
 */
export const adminFetch = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
  const token = getAdminAuthToken();
  const headers = new Headers(init.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const modifiedInit: RequestInit = {
    ...init,
    credentials: 'include',
    headers,
  };

  return fetch(input, modifiedInit);
};
