// config.js - Application configuration settings
// Replace these values with your own or use environment variables in a production environment

const appConfig = {
    // Auth0 Configuration
    auth0: {
        domain: 'dev-bnmp6ylfb7d2vk74.us.auth0.com',
        clientId: 'C51pISZzFLhaJxbISNTitr6zVtfHAS7B',
        redirectUri: window.location.origin, // This will automatically use the current URL
        audience: 'https://dev-bnmp6ylfb7d2vk74.us.auth0.com/api/v2/', // Using existing Auth0 API
        scope: 'openid profile email offline_access', // Added offline_access for refresh tokens
        cacheLocation: 'localstorage'
    },
    
    // Supabase Configuration
    supabase: {
        url: 'https://wzkikplsmgfnrsztlgyw.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6a2lrcGxzbWdmbnJzenRsZ3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MjI0NjgsImV4cCI6MjA2MDQ5ODQ2OH0.eOyQdlXn4BIhj_ugsGv_rUSMonjxkYCG_bOjbQo9Vco'
    },
    
    // Application Settings
    app: {
        title: 'Dog Daycare Scheduler',
        defaultView: 'month', // 'month', 'week', or 'day'
        readOnlyMessage: 'Read-only mode (Login to make changes)',
        defaultColor: '#007bff'
    }
};

// Function to validate configuration
function validateConfig() {
    // Check if Auth0 credentials are set
    if (
        appConfig.auth0.domain === 'YOUR_AUTH0_DOMAIN' || 
        appConfig.auth0.clientId === 'YOUR_AUTH0_CLIENT_ID'
    ) {
        console.warn('⚠️ Auth0 credentials not configured. Please update config.js with your Auth0 credentials.');
    }
    
    // Check if Supabase credentials are set
    if (
        appConfig.supabase.url === 'YOUR_SUPABASE_URL' || 
        appConfig.supabase.anonKey === 'YOUR_SUPABASE_ANON_KEY'
    ) {
        console.warn('⚠️ Supabase credentials not configured. Please update config.js with your Supabase credentials.');
    }
}

// Load this configuration when the file is loaded
(function() {
    validateConfig();
    
    // Make configuration available globally
    window.appConfig = appConfig;
})(); 