/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from '../store';

const set = useStore.setState;

// Authentication actions
export const checkAuthStatus = async () => {
  try {
    const response = await fetch('/auth/me', {
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      set({
        user: data.user,
        isAuthenticated: true,
        isCheckingAuth: false,
      });
    } else {
      set({
        user: null,
        isAuthenticated: false,
        isCheckingAuth: false,
      });
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    set({
      user: null,
      isAuthenticated: false,
      isCheckingAuth: false,
    });
  }
};

export const loginWithGoogle = async (idToken) => {
  try {
    const response = await fetch('/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ idToken }),
    });

    if (response.ok) {
      const data = await response.json();
      set({
        user: data.user,
        isAuthenticated: true,
      });
      return { success: true };
    } else {
      // Robust error parsing: try JSON first, then fallback to text
      const raw = await response.text();
      try {
        const errorData = JSON.parse(raw);
        return { success: false, error: errorData.error || raw };
      } catch (e) {
        return { success: false, error: raw || `Login failed with status ${response.status}` };
      }
    }
  } catch (error) {
    console.error('Login failed:', error);
    return { success: false, error: 'Network error during login' };
  }
};

export const logout = async () => {
  try {
    await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    set({
      user: null,
      isAuthenticated: false,
    });
  } catch (error) {
    console.error('Logout failed:', error);
    // Still clear local state even if server request fails
    set({
      user: null,
      isAuthenticated: false,
    });
  }
};
