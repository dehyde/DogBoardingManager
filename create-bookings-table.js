// Script to create bookings table and insert mock data
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://wzkikplsmgfnrsztlgyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6a2lrcGxzbWdmbnJzenRsZ3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MjI0NjgsImV4cCI6MjA2MDQ5ODQ2OH0.eOyQdlXn4BIhj_ugsGv_rUSMonjxkYCG_bOjbQo9Vco';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to create date with specific time
function createDateTime(dayOffset, hours, minutes) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

async function getDogs() {
  try {
    const { data: dogs, error } = await supabase
      .from('dogs')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching dogs:', error);
      return null;
    }
    
    console.log(`Retrieved ${dogs.length} dogs`);
    return dogs;
  } catch (error) {
    console.error('Error in getDogs:', error);
    return null;
  }
}

async function insertBookings(dogs) {
  console.log('Creating bookings for dogs:', dogs.map(d => d.name).join(', '));
  
  // Create a map of dog names to their IDs
  const dogMap = {};
  dogs.forEach(dog => {
    dogMap[dog.name] = dog.id;
  });
  
  // Get a list of unique dog names that we have
  const availableDogNames = Object.keys(dogMap);
  
  // Function to safely get a dog ID, using fallbacks if the specific dog isn't available
  function getDogId(preferredName) {
    if (dogMap[preferredName]) {
      return dogMap[preferredName];
    }
    // Fallback to any available dog
    return dogMap[availableDogNames[0]];
  }
  
  // Create bookings data
  const bookingsData = [
    // Today's bookings
    {
      dog_id: getDogId('Buddy'),
      start_time: createDateTime(0, 9, 0),
      end_time: createDateTime(0, 12, 0),
      notes: 'Morning stay'
    },
    {
      dog_id: getDogId('Luna'),
      start_time: createDateTime(0, 10, 0),
      end_time: createDateTime(0, 14, 0),
      notes: 'Midday play session'
    },
    {
      dog_id: getDogId('Max'),
      start_time: createDateTime(0, 13, 0),
      end_time: createDateTime(0, 17, 0),
      notes: 'Afternoon care'
    },
    
    // Tomorrow's bookings
    {
      dog_id: getDogId('Bella'),
      start_time: createDateTime(1, 8, 0),
      end_time: createDateTime(1, 12, 0),
      notes: 'Early drop-off'
    },
    {
      dog_id: getDogId('Charlie'),
      start_time: createDateTime(1, 11, 0),
      end_time: createDateTime(1, 15, 0),
      notes: 'Lunch and playtime'
    },
    {
      dog_id: getDogId('Buddy'),
      start_time: createDateTime(1, 14, 0),
      end_time: createDateTime(1, 18, 0),
      notes: 'Late afternoon session'
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
    // Get existing dogs
    const dogs = await getDogs();
    if (!dogs || dogs.length === 0) {
      console.error('No dogs found in the database');
      return;
    }
    
    // Insert bookings
    const bookings = await insertBookings(dogs);
    if (!bookings) {
      console.error('Failed to insert bookings');
      return;
    }
    
    console.log('Mock bookings created successfully!');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the main function
main(); 