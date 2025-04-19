// supabase.js - Handles all Supabase database interactions

// Get Supabase configuration from global config or use default
const supabaseConfig = window.appConfig?.supabase || {
  url: 'YOUR_SUPABASE_URL',
  anonKey: 'YOUR_SUPABASE_ANON_KEY'
};

// Add debug logging
console.log('Supabase Config:', JSON.stringify({
  url: supabaseConfig.url,
  anonKeyFirst10Chars: supabaseConfig.anonKey.substring(0, 10) + '...',
}, null, 2));

// Initialize the Supabase client
const supabase = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
console.log('Supabase client initialized');

// Helper functions to convert between snake_case and camelCase
function toCamelCase(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {});
}

function toSnakeCase(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }
  
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {});
}

// Set Supabase auth with Auth0 token
async function setSupabaseAuth(auth0Token) {
  if (!auth0Token) {
    console.error('Missing Auth0 token');
    throw new Error('Auth0 token is required for Supabase authentication');
  }

  try {
    console.log('Setting Supabase auth with Auth0 token...');
    
    // Parse and validate the JWT
    let tokenData;
    try {
      tokenData = parseJwt(auth0Token);
      console.log('Token data:', {
        exp: tokenData.exp,
        sub: tokenData.sub,
        iss: tokenData.iss,
        aud: tokenData.aud
      });
    } catch (parseError) {
      console.error('Failed to parse Auth0 token:', parseError);
      throw new Error('Invalid Auth0 token format');
    }
    
    // Validate token expiration
    const now = Math.floor(Date.now() / 1000);
    if (tokenData.exp <= now) {
      throw new Error('Auth0 token has expired');
    }

    // Set authorization header for all future requests
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        console.log('Supabase auth state changed:', event);
      }
    });

    // Set the auth header directly
    supabase.supabaseUrl = supabaseConfig.url;
    supabase.supabaseKey = supabaseConfig.anonKey;
    supabase.headers = {
      'Authorization': `Bearer ${auth0Token}`,
      'apikey': supabaseConfig.anonKey
    };

    console.log('Supabase auth headers set successfully');
    return { user: { id: tokenData.sub, email: tokenData.email } };
  } catch (error) {
    console.error('Error setting Supabase auth:', error);
    throw error;
  }
}

// Helper function to parse JWT
function parseJwt(token) {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token format: Token must be a non-empty string');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format: JWT must have three parts');
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );

    const payload = JSON.parse(jsonPayload);
    
    // Validate required JWT claims
    if (!payload.exp) {
      throw new Error('Token payload missing expiration (exp) claim');
    }
    if (!payload.sub) {
      throw new Error('Token payload missing subject (sub) claim');
    }
    if (!payload.aud) {
      throw new Error('Token payload missing audience (aud) claim');
    }

    return payload;
  } catch (error) {
    console.error('JWT parsing error:', error);
    throw error;
  }
}

// Check connection to Supabase
async function testSupabaseConnection() {
  try {
    console.log('Supabase: Testing connection...');
    const { data, error } = await supabase
      .from('dogs')
      .select('count')
      .limit(1);
      
    if (error) throw error;
    console.log('Supabase: Connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
}

// ======= Dogs API =======
async function getAllDogs() {
  try {
    console.log('Supabase: Fetching all dogs...');
    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .order('name');
      
    if (error) throw error;
    
    console.log(`Supabase: Retrieved ${data.length} dogs`);
    return toCamelCase(data);
  } catch (error) {
    console.error('Error fetching dogs:', error);
    return [];
  }
}

async function addDog(name) {
  try {
    // Check if we have auth token from Auth0
    const authToken = await window.auth.getAuthToken();
    if (!authToken) {
      throw new Error('Not authenticated to add dogs');
    }
    
    await setSupabaseAuth(authToken);
    
    const { data, error } = await supabase
      .from('dogs')
      .insert([{ name }])
      .select();
      
    if (error) throw error;
    
    return toCamelCase(data[0]);
  } catch (error) {
    console.error('Error adding dog:', error);
    
    if (error.message.includes('Not authenticated')) {
      window.auth.login();
    }
    
    return null;
  }
}

async function updateDog(id, name) {
  try {
    // Check if we have auth token from Auth0
    const authToken = await window.auth.getAuthToken();
    if (!authToken) {
      throw new Error('Not authenticated to update dogs');
    }
    
    await setSupabaseAuth(authToken);
    
    const { data, error } = await supabase
      .from('dogs')
      .update({ name })
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    return toCamelCase(data[0]);
  } catch (error) {
    console.error('Error updating dog:', error);
    
    if (error.message.includes('Not authenticated')) {
      window.auth.login();
    }
    
    return null;
  }
}

async function deleteDog(id) {
  try {
    // Check if we have auth token from Auth0
    const authToken = await window.auth.getAuthToken();
    if (!authToken) {
      throw new Error('Not authenticated to delete dogs');
    }
    
    await setSupabaseAuth(authToken);
    
    const { error } = await supabase
      .from('dogs')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting dog:', error);
    
    if (error.message.includes('Not authenticated')) {
      window.auth.login();
    }
    
    return false;
  }
}

// ======= Bookings API =======
async function getAllBookings() {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*');
      
    if (error) throw error;
    
    return toCamelCase(data);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
}

async function getBookingsByDogId(dogId) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('dog_id', dogId);
      
    if (error) throw error;
    
    return toCamelCase(data);
  } catch (error) {
    console.error('Error fetching bookings for dog:', error);
    return [];
  }
}

async function getBookingsByDateRange(startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .or(`start_date.gte.${startDate},end_date.gte.${startDate}`)
      .or(`start_date.lte.${endDate},end_date.lte.${endDate}`);
      
    if (error) throw error;
    
    return toCamelCase(data);
  } catch (error) {
    console.error('Error fetching bookings by date range:', error);
    return [];
  }
}

async function addBooking(booking) {
  try {
    // Check if we have auth token from Auth0
    const authToken = await window.auth.getAuthToken();
    if (!authToken) {
      throw new Error('Not authenticated to add bookings');
    }
    
    await setSupabaseAuth(authToken);
    
    const snakeCaseBooking = toSnakeCase(booking);
    
    const { data, error } = await supabase
      .from('bookings')
      .insert([snakeCaseBooking])
      .select();
      
    if (error) throw error;
    
    return toCamelCase(data[0]);
  } catch (error) {
    console.error('Error adding booking:', error);
    
    if (error.message.includes('Not authenticated')) {
      window.auth.login();
    }
    
    return null;
  }
}

async function updateBooking(id, bookingData) {
  try {
    // Check if we have auth token from Auth0
    const authToken = await window.auth.getAuthToken();
    if (!authToken) {
      throw new Error('Not authenticated to update bookings');
    }
    
    await setSupabaseAuth(authToken);
    
    const snakeCaseBooking = toSnakeCase(bookingData);
    
    const { data, error } = await supabase
      .from('bookings')
      .update(snakeCaseBooking)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    
    return toCamelCase(data[0]);
  } catch (error) {
    console.error('Error updating booking:', error);
    
    if (error.message.includes('Not authenticated')) {
      window.auth.login();
    }
    
    return null;
  }
}

async function deleteBooking(id) {
  try {
    // Check if we have auth token from Auth0
    const authToken = await window.auth.getAuthToken();
    if (!authToken) {
      throw new Error('Not authenticated to delete bookings');
    }
    
    await setSupabaseAuth(authToken);
    
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting booking:', error);
    
    if (error.message.includes('Not authenticated')) {
      window.auth.login();
    }
    
    return false;
  }
}

// Export Supabase service functions
window.supabaseService = {
  supabase,
  setSupabaseAuth,
  toCamelCase,
  toSnakeCase,
  testSupabaseConnection,
  getAllDogs,
  addDog,
  updateDog,
  deleteDog,
  getAllBookings,
  getBookingsByDogId,
  getBookingsByDateRange,
  addBooking,
  updateBooking,
  deleteBooking
}; 