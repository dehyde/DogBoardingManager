// Script to insert mock data into Supabase
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://wzkikplsmgfnrsztlgyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6a2lrcGxzbWdmbnJzenRsZ3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MjI0NjgsImV4cCI6MjA2MDQ5ODQ2OH0.eOyQdlXn4BIhj_ugsGv_rUSMonjxkYCG_bOjbQo9Vco';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Dog names
const dogNames = [
  'Buddy', 'Luna', 'Max', 'Bella', 'Charlie',
  'Lucy', 'Cooper', 'Daisy', 'Rocky', 'Sadie'
];

// Function to insert dogs
async function insertDogs() {
  console.log('Inserting dogs...');
  
  // Insert all dogs
  const { data: dogs, error } = await supabase
    .from('dogs')
    .insert(dogNames.map(name => ({ name })))
    .select();
  
  if (error) {
    console.error('Error inserting dogs:', error);
    return null;
  }
  
  console.log(`Successfully inserted ${dogs.length} dogs`);
  return dogs;
}

// Helper function to create date with specific time
function createDateTime(dayOffset, hours, minutes) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

// Function to insert bookings
async function insertBookings(dogs) {
  console.log('Inserting bookings...');
  
  const dogMap = {};
  dogs.forEach(dog => {
    dogMap[dog.name] = dog.id;
  });
  
  // Create bookings data
  const bookingsData = [
    // Today's bookings
    {
      dog_id: dogMap['Buddy'],
      start_time: createDateTime(0, 9, 0),
      end_time: createDateTime(0, 12, 0),
      notes: 'Morning stay'
    },
    {
      dog_id: dogMap['Luna'],
      start_time: createDateTime(0, 10, 0),
      end_time: createDateTime(0, 14, 0),
      notes: 'Midday play session'
    },
    {
      dog_id: dogMap['Max'],
      start_time: createDateTime(0, 13, 0),
      end_time: createDateTime(0, 17, 0),
      notes: 'Afternoon care'
    },
    
    // Tomorrow's bookings
    {
      dog_id: dogMap['Bella'],
      start_time: createDateTime(1, 8, 0),
      end_time: createDateTime(1, 12, 0),
      notes: 'Early drop-off'
    },
    {
      dog_id: dogMap['Charlie'],
      start_time: createDateTime(1, 11, 0),
      end_time: createDateTime(1, 15, 0),
      notes: 'Lunch and playtime'
    },
    {
      dog_id: dogMap['Buddy'],
      start_time: createDateTime(1, 14, 0),
      end_time: createDateTime(1, 18, 0),
      notes: 'Late afternoon session'
    },
    
    // Day after tomorrow's bookings
    {
      dog_id: dogMap['Luna'],
      start_time: createDateTime(2, 9, 30),
      end_time: createDateTime(2, 13, 30),
      notes: 'Morning session with treats'
    },
    {
      dog_id: dogMap['Max'],
      start_time: createDateTime(2, 12, 30),
      end_time: createDateTime(2, 16, 30),
      notes: 'Afternoon play and nap'
    },
    {
      dog_id: dogMap['Bella'],
      start_time: createDateTime(2, 15, 0),
      end_time: createDateTime(2, 18, 0),
      notes: 'Evening care'
    },
    
    // Next week bookings
    {
      dog_id: dogMap['Charlie'],
      start_time: createDateTime(7, 10, 0),
      end_time: createDateTime(7, 16, 0),
      notes: 'Full day care'
    },
    {
      dog_id: dogMap['Buddy'],
      start_time: createDateTime(8, 9, 0),
      end_time: createDateTime(8, 17, 0),
      notes: 'Extended day care'
    }
  ];
  
  // Insert all bookings
  const { data: bookings, error } = await supabase
    .from('bookings')
    .insert(bookingsData)
    .select();
  
  if (error) {
    console.error('Error inserting bookings:', error);
    return null;
  }
  
  console.log(`Successfully inserted ${bookings.length} bookings`);
  return bookings;
}

// Main function
async function main() {
  try {
    // Step 1: Disable RLS (requires admin privileges, may not work)
    console.log('WARNING: You may need to disable Row Level Security in the Supabase dashboard first');
    
    // Step 2: Insert dogs
    const dogs = await insertDogs();
    if (!dogs) {
      console.error('Failed to insert dogs. Exiting...');
      return;
    }
    
    // Step 3: Insert bookings
    const bookings = await insertBookings(dogs);
    if (!bookings) {
      console.error('Failed to insert bookings. Exiting...');
      return;
    }
    
    console.log('Mock data insertion complete!');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the main function
main(); 