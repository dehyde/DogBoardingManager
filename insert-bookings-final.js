// Script to insert bookings with updated column names
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

async function insertSingleBooking(dogId, startDate, endDate, notes, color, startPeriod, endPeriod) {
  const bookingData = {
    dog_id: dogId,
    start_date: startDate,
    end_date: endDate,
    notes: notes,
    color: color,
    // Try all combinations of start_period and end_period
    start_period: startPeriod,
    end_period: endPeriod
  };
  
  console.log(`Trying to insert booking with start_period=${startPeriod}, end_period=${endPeriod}`);
  
  const { data, error } = await supabase
    .from('bookings')
    .insert([bookingData])
    .select();
    
  if (error) {
    console.error(`Error inserting booking: ${error.message}`);
    return false;
  }
  
  console.log(`Successfully inserted booking with ID ${data[0].id}`);
  return true;
}

async function main() {
  try {
    // Get existing dogs
    const dogs = await getDogs();
    if (!dogs || dogs.length === 0) {
      console.error('No dogs found in the database');
      return;
    }
    
    // Get first dog ID for testing
    const dogId = dogs[0].id;
    
    // Try multiple combinations of period values
    const periodOptions = [
      // Try numeric values (0, 1, 2)
      { start: 0, end: 1 },
      // Try with null
      { start: null, end: null },
      // Try with different cases
      { start: "morning", end: "afternoon" },
      { start: "MORNING", end: "AFTERNOON" },
      // Try with names of time periods
      { start: "early", end: "late" },
      // Try with more specific values
      { start: "breakfast", end: "dinner" },
      // Try with period names
      { start: "first", end: "second" },
      // Try with sequential numbers as strings
      { start: "1", end: "2" },
      // Try with numeric keys
      { start: 1, end: 2 },
      // Try with abbreviations
      { start: "am", end: "pm" },
      // Try with a higher number combo
      { start: 8, end: 18 },
      // Try with decimal numbers
      { start: 8.5, end: 12.5 }
    ];
    
    // Keep track of the first successful combination
    let firstSuccess = null;
    
    // Test each combination
    for (const option of periodOptions) {
      const success = await insertSingleBooking(
        dogId,
        createDateTime(0, 9, 0),
        createDateTime(0, 12, 0),
        `Testing period values: ${option.start}-${option.end}`,
        '#4287f5',
        option.start,
        option.end
      );
      
      if (success && !firstSuccess) {
        firstSuccess = option;
      }
    }
    
    if (firstSuccess) {
      console.log(`Found working combination: start_period=${firstSuccess.start}, end_period=${firstSuccess.end}`);
      
      // Now insert multiple bookings with the working combination
      const dogMap = {};
      dogs.forEach(dog => {
        dogMap[dog.name] = dog.id;
      });
      
      function getDogId(preferredName) {
        if (dogMap[preferredName]) {
          return dogMap[preferredName];
        }
        return dogs[0].id;
      }
      
      // Create real bookings with the working period values
      const bookingsToInsert = [
        {
          dog_id: getDogId('Buddy'),
          start_date: createDateTime(0, 9, 0),
          end_date: createDateTime(0, 12, 0),
          notes: 'Morning stay',
          color: '#4287f5',
          start_period: firstSuccess.start,
          end_period: firstSuccess.end
        },
        {
          dog_id: getDogId('Luna'),
          start_date: createDateTime(0, 14, 0),
          end_date: createDateTime(0, 17, 0),
          notes: 'Afternoon play',
          color: '#f54242',
          start_period: firstSuccess.start,
          end_period: firstSuccess.end
        },
        {
          dog_id: getDogId('Max'),
          start_date: createDateTime(1, 10, 0),
          end_date: createDateTime(1, 15, 0),
          notes: 'Full day tomorrow',
          color: '#42f54e',
          start_period: firstSuccess.start,
          end_period: firstSuccess.end
        }
      ];
      
      console.log('Inserting multiple bookings with working period values...');
      
      for (const booking of bookingsToInsert) {
        await insertSingleBooking(
          booking.dog_id,
          booking.start_date,
          booking.end_date,
          booking.notes,
          booking.color,
          booking.start_period,
          booking.end_period
        );
      }
    } else {
      console.log('No working combination found for period values');
    }
    
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the main function
main(); 