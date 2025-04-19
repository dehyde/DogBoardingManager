-- Re-enable Row Level Security
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for dogs table
CREATE POLICY "Allow anonymous read access" ON dogs
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON dogs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON dogs
  FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete" ON dogs
  FOR DELETE USING (true);

-- Create policies for bookings table
CREATE POLICY "Allow anonymous read access" ON bookings
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON bookings
  FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete" ON bookings
  FOR DELETE USING (true); 