-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on dog_id for faster queries
CREATE INDEX IF NOT EXISTS bookings_dog_id_idx ON bookings(dog_id);

-- Create index on start_time for date range queries
CREATE INDEX IF NOT EXISTS bookings_start_time_idx ON bookings(start_time);

-- Create index on end_time for date range queries
CREATE INDEX IF NOT EXISTS bookings_end_time_idx ON bookings(end_time);

-- Disable Row Level Security temporarily for inserts
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY; 