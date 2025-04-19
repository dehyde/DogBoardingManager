-- Enable Row Level Security
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create a function to validate Auth0 JWT token
CREATE OR REPLACE FUNCTION auth.check_auth0_jwt() RETURNS boolean AS $$
DECLARE
  header_jwt text;
BEGIN
  -- Get the JWT from request headers
  header_jwt := current_setting('request.headers', true)::json->>'authorization';
  
  -- Check if there's a Bearer token
  IF header_jwt IS NOT NULL AND header_jwt LIKE 'Bearer %' THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for dogs table
CREATE POLICY "Allow anonymous read access" ON dogs
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON dogs
  FOR INSERT WITH CHECK (auth.check_auth0_jwt());

CREATE POLICY "Allow authenticated update" ON dogs
  FOR UPDATE USING (auth.check_auth0_jwt());

CREATE POLICY "Allow authenticated delete" ON dogs
  FOR DELETE USING (auth.check_auth0_jwt());

-- Create policies for bookings table
CREATE POLICY "Allow anonymous read access" ON bookings
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON bookings
  FOR INSERT WITH CHECK (auth.check_auth0_jwt());

CREATE POLICY "Allow authenticated update" ON bookings
  FOR UPDATE USING (auth.check_auth0_jwt());

CREATE POLICY "Allow authenticated delete" ON bookings
  FOR DELETE USING (auth.check_auth0_jwt()); 