-- Drop the existing bookings table if it exists
DROP TABLE IF EXISTS bookings;

-- Create bookings table with proper column names
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  dog_id INTEGER REFERENCES dogs(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on dog_id for faster queries
CREATE INDEX IF NOT EXISTS bookings_dog_id_idx ON bookings(dog_id);

-- Create index on start_date for date range queries
CREATE INDEX IF NOT EXISTS bookings_start_date_idx ON bookings(start_date);

-- Create index on end_date for date range queries
CREATE INDEX IF NOT EXISTS bookings_end_date_idx ON bookings(end_date);

-- Disable Row Level Security temporarily for inserts
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY; 