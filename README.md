# Dog Daycare Scheduling App

A Gantt chart-style application for scheduling dog daycare bookings, with data stored in Supabase and authentication via Auth0.

## Features

- View and manage dog bookings in a calendar-like interface
- Drag and resize bookings to adjust dates
- Data persistence with Supabase backend
- User authentication with Auth0
- Read-only mode for unauthenticated users
- Works with GitHub Pages

## Setup Instructions

### 1. Supabase Setup

1. **Create a Supabase account and project**:
   - Sign up at [Supabase](https://supabase.com/)
   - Create a new project
   - Copy your project URL and anon key from Project Settings > API

2. **Set up the database schema**:
   - Go to the SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase_migration.sql` into the SQL editor
   - Run the SQL script to create the necessary tables, functions and policies

3. **Auth Setup in Supabase**:
   - Go to Authentication > Settings > Auth Providers
   - Enable JWT Authorization
   - Set the JWT Secret to match your Auth0 application's signing secret or set to "Auto-generate JWT secret" if using an RS256 Auth0 application

4. **Update your Supabase credentials**:
   - Open `supabase.js` in this project
   - Replace `YOUR_SUPABASE_URL` with your Supabase project URL (found in Project Settings > API)
   - Replace `YOUR_SUPABASE_ANON_KEY` with your Supabase anon key

### 2. Auth0 Setup

1. **Create an Auth0 account and application**:
   - Sign up at [Auth0](https://auth0.com/)
   - Create a new Single Page Application
   - Set the application type to "Single Page Application"

2. **Configure Auth0 Application Settings**:
   - In your Auth0 Dashboard, go to Applications > Your Application
   - Set Allowed Callback URLs to your app URL (e.g., `http://localhost:3000, https://yourdomain.com`) 
   - Set Allowed Logout URLs to the same URLs
   - Set Allowed Web Origins to the same URLs
   - Enable Refresh Token Rotation and Use Refresh Tokens

3. **Configure JWT Claims**:
   - Create a new Auth0 Rule by going to Auth Pipeline > Rules > Create Rule
   - Use the "Empty Rule" template and name it "Add Role to JWT"
   - Use this template for the rule:
   ```javascript
   function (user, context, callback) {
     const namespace = 'https://dog-daycare-api';
     context.accessToken[namespace] = {
       'role': 'user'
     };
     return callback(null, user, context);
   }
   ```

4. **Configure JWT Audience (optional but recommended)**:
   - In Auth0, go to APIs and create a new API
   - Set the identifier to `https://dog-daycare-api` or a custom domain
   - Make sure this matches the `audience` value in `auth0.js`

5. **Update your Auth0 credentials**:
   - Open `auth0.js` in this project
   - Replace `YOUR_AUTH0_DOMAIN` with your Auth0 domain (e.g., `dev-xyz123.us.auth0.com`)
   - Replace `YOUR_AUTH0_CLIENT_ID` with your Auth0 client ID
   - Make sure the audience matches your API identifier if you created one

### 3. CORS Configuration

1. **Supabase CORS setup**:
   - In Supabase Dashboard, go to Project Settings > API
   - Under CORS (Cross-Origin Resource Sharing), add your application URLs to the Allowed Origins

## How to Run

The application is a static site and can be run locally or deployed to GitHub Pages:

### Local Development

1. Clone this repository
2. Open index.html in a browser or use a local server:
   ```
   npx http-server
   ```
   or
   ```
   python -m http.server
   ```

### Deploying to GitHub Pages

1. Push your code to a GitHub repository
2. Go to repository Settings > Pages
3. Select your main branch as the source
4. After deployment, update your Auth0 allowed URLs to include your GitHub Pages URL
5. Also update Supabase CORS settings to include your GitHub Pages URL

## GitHub Pages Deployment

To deploy this application on GitHub Pages:

1. Go to your GitHub repository's Settings tab
2. In the left sidebar, click on "Pages"
3. Under "Source", select "Deploy from a branch"
4. Under "Branch", select "main" and "/root" folder, then click "Save"
5. Wait a few minutes for the deployment to complete
6. Your site will be available at `https://[your-username].github.io/[repository-name]/`

Note: If you encounter authentication issues with Auth0 or Supabase after deployment, you may need to update your configuration to include the GitHub Pages URL in your allowed callback URLs and origins.

## Authentication Flow Details

1. **Initial Load**:
   - Application loads and checks for existing Auth0 session
   - If user is already authenticated, Auth0 returns a valid session
   - If not, app loads in read-only mode

2. **Login Process**:
   - User clicks "Login" button
   - Auth0 redirects to their hosted login page
   - User authenticates with email/password or social providers
   - Auth0 redirects back to the application with an authorization code
   - Application exchanges the code for access and ID tokens
   - Access token is used for Supabase authenticated operations

3. **Data Authorization**:
   - JWT token from Auth0 is passed to Supabase
   - Supabase Row Level Security (RLS) policies check the token
   - Read operations (SELECT) are allowed for all users
   - Write operations (INSERT, UPDATE, DELETE) require valid authentication

## Troubleshooting

### Auth0 Issues

1. **Redirect Loop after Login**:
   - Check that your callback URLs are correct and match your application URL
   - Ensure the Auth0 rule is properly configured and not causing errors

2. **Token Validation Errors**:
   - Make sure the audience values match in both Auth0 and your application
   - Check that you're using the correct signing algorithm (RS256 is recommended)

3. **CORS Errors**:
   - Verify that your Auth0 application has the correct origins listed

### Supabase Issues

1. **Authentication Failed**:
   - Check that your Supabase URL and anon key are correct
   - Ensure CORS is properly configured for your application domain

2. **Permission Denied for Write Operations**:
   - Check that RLS policies are properly set up
   - Verify that the Auth0 token is being properly passed to Supabase
   - Make sure you're calling `setSupabaseAuth` with a valid token

3. **No Data Appearing**:
   - Run the test database connection function `testSupabaseConnection()` in browser console
   - Check browser console for Supabase error messages

## Security Best Practices

1. **Environment Variables**:
   - For production, consider using environment variables instead of hardcoding credentials
   - Use a build process that replaces placeholders with actual values during deployment

2. **Token Management**:
   - Auth0 tokens expire - the app uses silent authentication to refresh them when possible
   - The UI updates to read-only mode if authentication fails or expires

3. **Handling Sensitive Operations**:
   - All sensitive operations require authentication
   - Supabase RLS policies provide a second layer of security

## Data Structure

The application uses two main tables in Supabase:

1. **dogs**: Stores information about dogs
   - id (auto-generated)
   - name
   - created_at

2. **bookings**: Stores booking information
   - id (auto-generated)
   - dog_id (references dogs.id)
   - start_date
   - start_period ('morning' or 'evening')
   - end_date
   - end_period ('morning' or 'evening')
   - color
   - created_at

## Running Queries in Supabase

You can use the built-in SQL function to find dogs with bookings in a specific date range:

```sql
SELECT * FROM get_dogs_with_bookings_in_period('2023-01-01', '2023-01-31');
``` 