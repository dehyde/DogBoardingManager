// auth0.js - Handles user authentication with Auth0

// Get Auth0 configuration from global config
const auth0Config = window.appConfig.auth0;

// Add debug logging
console.log('Auth0 Config:', JSON.stringify({
  domain: auth0Config.domain,
  clientId: auth0Config.clientId,
  redirectUri: auth0Config.redirectUri
}, null, 2));

// Initialize Auth0 client
let auth0Client = null;
let isAuthenticated = false;
let userProfile = null;
let authToken = null;

// Helper to update loading state
function updateLoadingState(isLoading, errorMessage = null) {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (!loadingOverlay) return;
  
  if (isLoading) {
    loadingOverlay.classList.remove('hidden');
    
    // Reset any error messages
    const loadingText = loadingOverlay.querySelector('.loading-text');
    if (loadingText) {
      loadingText.textContent = 'Loading data...';
      loadingText.style.color = '#333';
    }
    
    const spinner = loadingOverlay.querySelector('.loading-spinner');
    if (spinner) {
      spinner.style.display = 'block';
    }
  } else {
    if (errorMessage) {
      const loadingText = loadingOverlay.querySelector('.loading-text');
      if (loadingText) {
        loadingText.textContent = `Error: ${errorMessage}`;
        loadingText.style.color = '#dc3545';
      }
      
      const spinner = loadingOverlay.querySelector('.loading-spinner');
      if (spinner) {
        spinner.style.display = 'none';
      }
      
      // Keep the overlay visible to show error
    } else {
      // No error, hide completely
      loadingOverlay.classList.add('hidden');
    }
  }
}

// Auth0 event handlers
const onAuth0Load = async () => {
  try {
    updateLoadingState(true);
    console.log('Auth0: Initializing client...');
    console.log('Auth0: Using configuration:', {
      domain: auth0Config.domain,
      clientId: auth0Config.clientId,
      audience: auth0Config.audience,
      scope: auth0Config.scope
    });
    
    auth0Client = await auth0.createAuth0Client({
      domain: auth0Config.domain,
      clientId: auth0Config.clientId,
      authorizationParams: {
        redirect_uri: auth0Config.redirectUri,
        audience: auth0Config.audience,
        scope: auth0Config.scope
      },
      cacheLocation: auth0Config.cacheLocation,
      useRefreshTokens: true,
      useRefreshTokensFallback: true // Enable fallback for refresh tokens
    });
    console.log('Auth0: Client initialized successfully');

    // Check for authentication on page load (handles redirect back from Auth0)
    if (window.location.search.includes('code=') && 
        window.location.search.includes('state=')) {
      console.log('Auth0: Detected authentication callback, handling redirect...');
      try {
        const result = await auth0Client.handleRedirectCallback();
        console.log('Auth0: Redirect result:', result);
      } catch (redirectError) {
        console.error('Auth0: Error handling redirect:', redirectError);
        updateLoadingState(false, 'Authentication error');
      }
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('Auth0: Redirect handled successfully');
    }

    // Check for errors in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('error')) {
      console.error('Auth0: Error in URL parameters:', {
        error: urlParams.get('error'),
        description: urlParams.get('error_description')
      });
    }

    // Update authentication state
    isAuthenticated = await auth0Client.isAuthenticated();
    console.log('Auth0: isAuthenticated =', isAuthenticated);
    
    if (isAuthenticated) {
      console.log('Auth0: Getting user profile and token...');
      try {
        // Get user profile
        userProfile = await auth0Client.getUser();
        console.log('Auth0: User profile loaded:', userProfile?.name || userProfile?.email || 'Unknown User');
        
        // Get token with specific parameters
        const tokenResponse = await auth0Client.getTokenSilently({
          authorizationParams: {
            audience: auth0Config.audience,
            scope: auth0Config.scope
          },
          detailedResponse: true
        });

        console.log('Auth0: Token retrieved:', {
          type: tokenResponse.token_type,
          scope: tokenResponse.scope,
          expiresIn: tokenResponse.expires_in
        });
        
        // Update UI to reflect authenticated state
        updateAuthUI(true);
        
        // Initialize the app with authentication
        if (window.initializeAppWithAuth) {
          window.initializeAppWithAuth(isAuthenticated, tokenResponse.access_token, userProfile);
        }
        
        // Set Supabase auth if the service is available
        if (window.supabaseService && window.supabaseService.setSupabaseAuth) {
          console.log('Auth0: Setting Supabase auth with token...');
          await window.supabaseService.setSupabaseAuth(tokenResponse.access_token);
        }
      } catch (tokenError) {
        console.error('Auth0: Error getting token or profile:', tokenError);
        updateLoadingState(false, 'Error retrieving authentication token');
        // If we can't get a token, treat as not authenticated
        isAuthenticated = false;
        updateAuthUI(false);
        
        // If there's a specific error about missing refresh token, try to re-authenticate
        if (tokenError.message?.includes('Missing Refresh Token')) {
          console.log('Auth0: Missing refresh token, redirecting to login...');
          await login();
          return;
        }
      }
    } else {
      console.log('Auth0: User not authenticated, setting read-only mode');
      updateAuthUI(false);
      
      // Initialize the app in read-only mode
      if (window.initializeAppWithAuth) {
        window.initializeAppWithAuth(false, null, null);
      }
    }
  } catch (error) {
    console.error('Auth0 initialization error:', error);
    updateLoadingState(false, 'Authentication service error');
    // Initialize app in read-only mode if auth fails
    if (window.initializeAppWithAuth) {
      window.initializeAppWithAuth(false, null, null);
    }
  }
};

// Login function - redirects to Auth0 login page
const login = async () => {
  try {
    console.log('Auth0: Starting login redirect...');
    await auth0Client.loginWithRedirect({
      authorizationParams: {
        redirect_uri: auth0Config.redirectUri,
        audience: auth0Config.audience,
        scope: auth0Config.scope
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    alert('Failed to log in. Please try again.');
  }
};

// Logout function
const logout = async () => {
  try {
    console.log('Auth0: Logging out...');
    await auth0Client.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
    isAuthenticated = false;
    userProfile = null;
    authToken = null;
    updateAuthUI(false);
    
    // Refresh the page to reset the app state
    window.location.reload();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Helper function to update the UI based on authentication state
const updateAuthUI = (isAuthenticated) => {
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userDisplay = document.getElementById('user-display');
  const readOnlyIndicator = document.querySelector('.read-only-indicator') || 
                            createReadOnlyIndicator();
  
  if (loginBtn && logoutBtn && userDisplay) {
    if (isAuthenticated && userProfile) {
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-block';
      userDisplay.innerHTML = `
        ${userProfile.picture ? `<img src="${userProfile.picture}" alt="Avatar" class="avatar" />` : ''}
        <span>${userProfile.name ? userProfile.name.split(' ')[0] : (userProfile.email || 'User')}</span>
      `;
      userDisplay.style.display = 'flex';
      readOnlyIndicator.classList.remove('show');
    } else {
      loginBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'none';
      userDisplay.style.display = 'none';
      userDisplay.innerHTML = '';
      readOnlyIndicator.classList.add('show');
    }
  }
};

// Create read-only indicator element if it doesn't exist
function createReadOnlyIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'read-only-indicator';
  indicator.textContent = 'Read-only mode (Login to make changes)';
  document.body.appendChild(indicator);
  return indicator;
}

// Get current authentication token for API calls
const getAuthToken = async () => {
  if (isAuthenticated && auth0Client) {
    try {
      // Get token with specific parameters
      const tokenResponse = await auth0Client.getTokenSilently({
        authorizationParams: {
          audience: auth0Config.audience,
          scope: auth0Config.scope
        },
        detailedResponse: true
      });

      // Log token details for debugging
      console.log('Auth0: Token retrieved:', {
        type: tokenResponse.token_type,
        scope: tokenResponse.scope,
        expiresIn: tokenResponse.expires_in
      });

      return tokenResponse.access_token;
    } catch (error) {
      console.error('Error getting token:', error);
      // If token is expired and can't be refreshed, redirect to login
      if (error.error === 'login_required') {
        login();
      }
      throw error; // Propagate the error
    }
  }
  return null;
};

// Check if user is authenticated
const checkIsAuthenticated = () => {
  return isAuthenticated;
};

// Update Supabase auth when user is authenticated
async function updateSupabaseAuth() {
  try {
    const token = await getAuthToken();
    if (token) {
      await window.supabaseService.setSupabaseAuth(token);
      console.log('Supabase auth updated with Auth0 token');
    }
  } catch (error) {
    console.error('Error updating Supabase auth:', error);
  }
}

// Handle authentication state changes
async function handleAuthenticationState() {
  const isAuthenticated = await checkIsAuthenticated();
  if (isAuthenticated) {
    await updateSupabaseAuth();
    await updateUIState(true);
    await updateUserProfile();
  } else {
    await updateUIState(false);
  }
}

// Export the auth methods to be used in other files
window.auth = {
  login,
  logout,
  getAuthToken,
  checkIsAuthenticated,
  onAuth0Load
}; 