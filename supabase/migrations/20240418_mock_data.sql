-- Insert mock dogs
INSERT INTO dogs (name) VALUES 
  ('Buddy'),
  ('Luna'),
  ('Max'),
  ('Bella'),
  ('Charlie'),
  ('Lucy'),
  ('Cooper'),
  ('Daisy'),
  ('Rocky'),
  ('Sadie');

-- Insert mock bookings
-- First, let's get the IDs of the dogs we just inserted
DO $$
DECLARE
  buddy_id UUID;
  luna_id UUID;
  max_id UUID;
  bella_id UUID;
  charlie_id UUID;
BEGIN
  -- Get dog IDs
  SELECT id INTO buddy_id FROM dogs WHERE name = 'Buddy' LIMIT 1;
  SELECT id INTO luna_id FROM dogs WHERE name = 'Luna' LIMIT 1;
  SELECT id INTO max_id FROM dogs WHERE name = 'Max' LIMIT 1;
  SELECT id INTO bella_id FROM dogs WHERE name = 'Bella' LIMIT 1;
  SELECT id INTO charlie_id FROM dogs WHERE name = 'Charlie' LIMIT 1;

  -- Insert bookings
  -- Today's bookings
  INSERT INTO bookings (dog_id, start_time, end_time, notes) VALUES
    (buddy_id, NOW()::date + '9:00'::time, NOW()::date + '12:00'::time, 'Morning stay'),
    (luna_id, NOW()::date + '10:00'::time, NOW()::date + '14:00'::time, 'Midday play session'),
    (max_id, NOW()::date + '13:00'::time, NOW()::date + '17:00'::time, 'Afternoon care');

  -- Tomorrow's bookings
  INSERT INTO bookings (dog_id, start_time, end_time, notes) VALUES
    (bella_id, (NOW() + INTERVAL '1 day')::date + '8:00'::time, (NOW() + INTERVAL '1 day')::date + '12:00'::time, 'Early drop-off'),
    (charlie_id, (NOW() + INTERVAL '1 day')::date + '11:00'::time, (NOW() + INTERVAL '1 day')::date + '15:00'::time, 'Lunch and playtime'),
    (buddy_id, (NOW() + INTERVAL '1 day')::date + '14:00'::time, (NOW() + INTERVAL '1 day')::date + '18:00'::time, 'Late afternoon session');

  -- Day after tomorrow's bookings  
  INSERT INTO bookings (dog_id, start_time, end_time, notes) VALUES
    (luna_id, (NOW() + INTERVAL '2 days')::date + '9:30'::time, (NOW() + INTERVAL '2 days')::date + '13:30'::time, 'Morning session with treats'),
    (max_id, (NOW() + INTERVAL '2 days')::date + '12:30'::time, (NOW() + INTERVAL '2 days')::date + '16:30'::time, 'Afternoon play and nap'),
    (bella_id, (NOW() + INTERVAL '2 days')::date + '15:00'::time, (NOW() + INTERVAL '2 days')::date + '18:00'::time, 'Evening care');

  -- Next week bookings
  INSERT INTO bookings (dog_id, start_time, end_time, notes) VALUES
    (charlie_id, (NOW() + INTERVAL '7 days')::date + '10:00'::time, (NOW() + INTERVAL '7 days')::date + '16:00'::time, 'Full day care'),
    (buddy_id, (NOW() + INTERVAL '8 days')::date + '9:00'::time, (NOW() + INTERVAL '8 days')::date + '17:00'::time, 'Extended day care');
END $$; 