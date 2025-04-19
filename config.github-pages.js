// config.github-pages.js - Configuration for GitHub Pages deployment
// Replace these with your GitHub Pages URL once deployed

const appConfig = {
    // Auth0 Configuration
    auth0: {
        domain: 'dev-bnmp6ylfb7d2vk74.us.auth0.com',
        clientId: 'C51pISZzFLhaJxbISNTitr6zVtfHAS7B',
        redirectUri: 'https://[your-username].github.io/[repository-name]', // Update with your GitHub Pages URL
        audience: 'https://dev-bnmp6ylfb7d2vk74.us.auth0.com/api/v2/',
        scope: 'openid profile email offline_access',
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
        defaultView: 'month',
        readOnlyMessage: 'Read-only mode (Login to make changes)',
        defaultColor: '#007bff'
    }
};

// Function to validate configuration
function validateConfig() {
    // Check if Auth0 credentials are set
    if (
        appConfig.auth0.redirectUri === 'https://[your-username].github.io/[repository-name]'
    ) {
        console.warn('⚠️ GitHub Pages URL not configured. Please update config.github-pages.js with your actual GitHub Pages URL.');
    }
}

// Load this configuration when the file is loaded
(function() {
    validateConfig();
    
    // Make configuration available globally
    window.appConfig = appConfig;
})(); 