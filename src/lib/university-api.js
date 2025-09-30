/**
 * University API (CODE University Learning Platform) Integration
 * Handles authentication, token management, and GraphQL operations
 */

// University API Configuration
const UNIVERSITY_API_BASE = 'https://api.app.code.berlin';
const UNIVERSITY_GRAPHQL_ENDPOINT = `${UNIVERSITY_API_BASE}/graphql`;
const UNIVERSITY_REFRESH_ENDPOINT = `${UNIVERSITY_API_BASE}/cid_refresh`;
// Use environment variable or fallback to the University-specific client ID
const UNIVERSITY_GOOGLE_CLIENT_ID = import.meta.env?.VITE_UNIVERSITY_GOOGLE_CLIENT_ID || '358660676559-02rrefr671bdi1chqtd3l0c44mc8jt9p.apps.googleusercontent.com';

// Token storage keys
const SESSION_TOKEN_KEY = 'university_session_token';
const REFRESH_TOKEN_KEY = 'university_refresh_token';

/**
 * Decode JWT token and extract payload
 */
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired or about to expire (within 30 seconds)
 */
function isTokenExpired(token) {
  if (!token) return true;

  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;

  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const bufferTime = 30 * 1000; // 30 seconds buffer

  return currentTime >= (expirationTime - bufferTime);
}

/**
 * Store session token securely
 */
function storeSessionToken(token) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  }
}

/**
 * Get stored session token
 */
function getStoredSessionToken() {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(SESSION_TOKEN_KEY);
  }
  return null;
}

/**
 * Clear stored tokens
 */
function clearStoredTokens() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    // Note: Refresh token is HTTP-only cookie, cleared by server
  }
}

/**
 * Initialize Google Identity Services for University authentication
 */
export function initializeUniversityAuth() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Identity Services requires browser environment'));
      return;
    }

    // Load Google Identity Services script if not already loaded
    if (!window.google?.accounts?.id) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeGoogleAuth();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'));
      };
      document.head.appendChild(script);
    } else {
      initializeGoogleAuth();
    }

    function initializeGoogleAuth() {
      try {
        window.google.accounts.id.initialize({
          client_id: UNIVERSITY_GOOGLE_CLIENT_ID,
          callback: () => {}, // We'll handle this manually
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    }
  });
}

/**
 * Get Google ID token for University authentication
 * Uses server-side proxy to avoid origin_mismatch issues
 */
export function getGoogleIdToken() {
  return new Promise((resolve, reject) => {
    // Use our server-side University OAuth flow instead
    const authUrl = `/api/services/university/connect`;

    // Open popup for server-side auth
    const popup = window.open(authUrl, 'university-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for authentication.'));
      return;
    }

    // Listen for auth completion
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        reject(new Error('Authentication cancelled or failed'));
      }
    }, 1000);

    // Handle message from popup
    const messageHandler = (event) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'university-auth-success') {
        clearInterval(checkClosed);
        popup.close();
        window.removeEventListener('message', messageHandler);

        // Store the session token and resolve with it
        storeSessionToken(event.data.sessionToken);
        resolve(event.data.sessionToken);
      } else if (event.data.type === 'university-auth-error') {
        clearInterval(checkClosed);
        popup.close();
        window.removeEventListener('message', messageHandler);
        reject(new Error(event.data.error || 'Authentication failed'));
      }
    };

    window.addEventListener('message', messageHandler);
  });
}

/**
 * Authenticate with University API
 * If sessionToken is already provided, just decode it and return user info
 */
export async function authenticateWithUniversity(sessionToken) {
  try {
    // If we already have a session token (from server-side auth), just use it
    if (sessionToken && typeof sessionToken === 'string' && sessionToken.includes('.')) {
      // This looks like a JWT token already
      storeSessionToken(sessionToken);

      const user = decodeJWT(sessionToken);
      if (!user) {
        throw new Error('Invalid session token format');
      }

      return {
        sessionToken,
        user
      };
    }

    // Legacy flow: if sessionToken is actually a Google ID token, exchange it
    const response = await fetch(UNIVERSITY_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for receiving refresh token cookie
      body: JSON.stringify({
        variables: { code: sessionToken },
        operationName: 'googleSignin',
        query: 'mutation googleSignin($code: String!) { googleSignin(code: $code) { token } }'
      })
    });

    const data = await response.json();

    if (data.errors) {
      throw new Error(`Authentication failed: ${data.errors[0].message}`);
    }

    if (!data.data?.googleSignin?.token) {
      throw new Error('No session token received from University API');
    }

    const newSessionToken = data.data.googleSignin.token;
    storeSessionToken(newSessionToken);

    return {
      sessionToken: newSessionToken,
      user: decodeJWT(newSessionToken)
    };
  } catch (error) {
    console.error('University authentication failed:', error);
    throw error;
  }
}

/**
 * Refresh University session token using refresh cookie
 */
export async function refreshUniversityToken() {
  try {
    const response = await fetch(UNIVERSITY_REFRESH_ENDPOINT, {
      method: 'POST',
      credentials: 'include', // Send refresh token cookie
    });

    const data = await response.json();

    if (!data.ok || !data.token) {
      throw new Error('Token refresh failed');
    }

    storeSessionToken(data.token);
    return data.token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear stored tokens on refresh failure
    clearStoredTokens();
    throw error;
  }
}

/**
 * Get valid University session token (refresh if needed)
 */
export async function getValidUniversityToken() {
  let sessionToken = getStoredSessionToken();

  if (!sessionToken || isTokenExpired(sessionToken)) {
    try {
      sessionToken = await refreshUniversityToken();
    } catch (error) {
      // Refresh failed, need to re-authenticate
      throw new Error('Session expired. Please re-authenticate.');
    }
  }

  return sessionToken;
}

/**
 * Make authenticated GraphQL request to University API
 */
export async function universityGraphQLRequest(query, variables = {}, operationName = null) {
  try {
    const token = await getValidUniversityToken();

    const response = await fetch(UNIVERSITY_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify({
        query,
        variables,
        operationName
      })
    });

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      throw new Error(`GraphQL request failed: ${data.errors[0].message}`);
    }

    return data.data;
  } catch (error) {
    console.error('University API request failed:', error);
    throw error;
  }
}

/**
 * Get current user information
 */
export async function getCurrentUser() {
  const query = `
    query currentUser {
      me {
        firstName
        lastName
        email
        studentId
        program
        semester
      }
    }
  `;

  try {
    const data = await universityGraphQLRequest(query, {}, 'currentUser');
    return data.me;
  } catch (error) {
    console.error('Failed to get current user:', error);
    throw error;
  }
}

/**
 * Introspect University API schema
 */
export async function introspectUniversitySchema() {
  const query = `
    query IntrospectionQuery {
      __schema {
        queryType {
          fields {
            name
            description
            args {
              name
              type {
                name
                kind
              }
            }
            type {
              name
              kind
            }
          }
        }
        mutationType {
          fields {
            name
            description
            args {
              name
              type {
                name
                kind
              }
            }
          }
        }
        types {
          name
          kind
          description
          fields {
            name
            description
            type {
              name
              kind
            }
          }
        }
      }
    }
  `;

  try {
    const data = await universityGraphQLRequest(query, {}, 'IntrospectionQuery');
    return data.__schema;
  } catch (error) {
    console.error('Schema introspection failed:', error);
    throw error;
  }
}

/**
 * Get student courses and grades
 */
export async function getStudentCourses() {
  const query = `
    query studentCourses {
      me {
        enrollments {
          course {
            id
            name
            code
            credits
            semester
            instructor {
              firstName
              lastName
            }
          }
          grade
          status
        }
      }
    }
  `;

  try {
    const data = await universityGraphQLRequest(query, {}, 'studentCourses');
    return data.me?.enrollments || [];
  } catch (error) {
    console.error('Failed to get student courses:', error);
    throw error;
  }
}

/**
 * Get student assignments and submissions
 */
export async function getStudentAssignments() {
  const query = `
    query studentAssignments {
      me {
        submissions {
          assignment {
            id
            title
            description
            dueDate
            course {
              name
              code
            }
          }
          submittedAt
          grade
          feedback
          status
        }
      }
    }
  `;

  try {
    const data = await universityGraphQLRequest(query, {}, 'studentAssignments');
    return data.me?.submissions || [];
  } catch (error) {
    console.error('Failed to get student assignments:', error);
    throw error;
  }
}

/**
 * University API connection status
 */
export async function checkUniversityConnection() {
  try {
    const user = await getCurrentUser();
    return {
      connected: true,
      user: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        studentId: user.studentId,
        program: user.program,
        semester: user.semester
      }
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
}

/**
 * Sign out from University API
 */
export function signOutFromUniversity() {
  clearStoredTokens();
  // Note: Server-side logout would require additional endpoint
  return true;
}

// Export configuration for external use
export const UNIVERSITY_CONFIG = {
  API_BASE: UNIVERSITY_API_BASE,
  GRAPHQL_ENDPOINT: UNIVERSITY_GRAPHQL_ENDPOINT,
  GOOGLE_CLIENT_ID: UNIVERSITY_GOOGLE_CLIENT_ID,
};