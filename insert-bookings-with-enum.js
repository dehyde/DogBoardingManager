// Script to insert bookings with correct enum values
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
  
  // Create bookings data with the EXACT enum values required by the constraint
  // start_period and end_period must be one of: 'morning' or 'evening'
  const bookingsData = [
    // Morning bookings
    {
      dog_id: getDogId('Buddy'),
      start_date: createDateTime(0, 9, 0),
      end_date: createDateTime(0, 12, 0),
      notes: 'Morning stay',
      start_period: 'morning',   // Valid enum value
      end_period: 'morning',     // Valid enum value
      color: '#4287f5'           // Blue
    },
    {
      dog_id: getDogId('Luna'),
      start_date: createDateTime(0, 10, 0),
      end_date: createDateTime(0, 14, 0),
      notes: 'Midday play session',
      start_period: 'morning',
      end_period: 'evening',
      color: '#42f5b3'           // Teal
    },
    
    // Evening bookings
    {
      dog_id: getDogId('Max'),
      start_date: createDateTime(0, 15, 0),
      end_date: createDateTime(0, 18, 0),
      notes: 'Evening care',
      start_period: 'evening',
      end_period: 'evening',
      color: '#f54242'           // Red
    },
    
    // Tomorrow bookings
    {
      dog_id: getDogId('Bella'),
      start_date: createDateTime(1, 8, 0),
      end_date: createDateTime(1, 12, 0),
      notes: 'Early drop-off',
      start_period: 'morning',
      end_period: 'morning',
      color: '#f5a742'           // Orange
    },
    {
      dog_id: getDogId('Charlie'),
      start_date: createDateTime(1, 16, 0),
      end_date: createDateTime(1, 19, 0),
      notes: 'Late evening stay',
      start_period: 'evening',
      end_period: 'evening',
      color: '#9f42f5'           // Purple
    }
  ];
  
  // Insert all bookings
  console.log('Inserting bookings with valid period values...');
  
  let insertedCount = 0;
  
  // Insert each booking individually to avoid failing all if one fails
  for (const booking of bookingsData) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([booking])
        .select();
      
      if (error) {
        console.error(`Error inserting booking: ${error.message}`);
      } else {
        console.log(`✅ Successfully inserted booking: ${booking.notes}`);
        insertedCount++;
      }
    } catch (bookingError) {
      console.error(`Error during booking insert: ${bookingError}`);
    }
  }
  
  if (insertedCount > 0) {
    console.log(`Successfully inserted ${insertedCount} out of ${bookingsData.length} bookings`);
    return true;
  } else {
    console.error('Failed to insert any bookings');
    return false;
  }
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
    const success = await insertBookings(dogs);
    if (success) {
      console.log('Mock bookings created successfully!');
    } else {
      console.error('Failed to create mock bookings');
    }
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the main function
main(); 