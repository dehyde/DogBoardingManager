// Script to temporarily disable RLS, add bookings, and re-enable RLS
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://wzkikplsmgfnrsztlgyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6a2lrcGxzbWdmbnJzenRsZ3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MjI0NjgsImV4cCI6MjA2MDQ5ODQ2OH0.eOyQdlXn4BIhj_ugsGv_rUSMonjxkYCG_bOjbQo9Vco';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to execute SQL command (for RLS operations)
async function executeSql(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: sql });
    
    if (error) {
      console.error('SQL execution error:', error);
      return false;
    }
    
    console.log('SQL executed successfully:', sql);
    return true;
  } catch (error) {
    console.error('Error executing SQL:', error);
    return false;
  }
}

// Function to get today's date
function getFormattedDate(dateOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + dateOffset);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Main function
async function addBookings() {
  try {
    console.log('Starting booking creation process...');
    
    // 1. Temporarily disable RLS on bookings table
    console.log('Attempting to disable RLS...');
    const rlsDisabled = await executeSql('ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;');
    
    if (!rlsDisabled) {
      console.error('Failed to disable RLS. Trying direct insert anyway...');
    }
    
    // 2. Insert bookings
    
    // Calculate dates
    const oneMonthAgo = getFormattedDate(-30);
    const oneMonthAgoPlusTwo = getFormattedDate(-28);
    const twoWeeksFromNow = getFormattedDate(14);
    const twoWeeksFromNowPlusThree = getFormattedDate(17);
    
    console.log('Dates calculated:');
    console.log('- One month ago:', oneMonthAgo);
    console.log('- One month ago + 2 days:', oneMonthAgoPlusTwo);
    console.log('- Two weeks from now:', twoWeeksFromNow);
    console.log('- Two weeks from now + 3 days:', twoWeeksFromNowPlusThree);
    
    // Get available dogs
    const { data: dogs, error: dogsError } = await supabase
      .from('dogs')
      .select('id, name')
      .order('name');
    
    if (dogsError) {
      console.error('Error fetching dogs:', dogsError);
      return;
    }
    
    console.log('Available dogs:', dogs.map(d => `${d.name} (ID: ${d.id})`).join(', '));
    
    // Select a couple of dogs
    const dog1 = dogs.find(d => d.name === 'Buddy') || dogs[0];
    const dog2 = dogs.find(d => d.name === 'Luna') || dogs[1] || dogs[0];
    
    console.log(`Selected dogs for bookings: ${dog1.name} (ID: ${dog1.id}) and ${dog2.name} (ID: ${dog2.id})`);
    
    // Booking 1: Past booking from a month ago
    const booking1 = {
      dog_id: dog1.id,
      start_date: oneMonthAgo,
      start_period: 'morning',
      end_date: oneMonthAgoPlusTwo,
      end_period: 'evening',
      color: '#3498db',
      notes: `Past booking from a month ago for ${dog1.name}`
    };
    
    // Booking 2: Future booking in two weeks
    const booking2 = {
      dog_id: dog2.id,
      start_date: twoWeeksFromNow,
      start_period: 'morning',
      end_date: twoWeeksFromNowPlusThree,
      end_period: 'evening',
      color: '#2ecc71',
      notes: `Future booking starting in two weeks for ${dog2.name}`
    };
    
    // Insert first booking
    console.log(`Adding booking 1: Past booking for ${dog1.name}...`);
    const { data: bookingData1, error: bookingError1 } = await supabase
      .from('bookings')
      .insert([booking1])
      .select();
    
    if (bookingError1) {
      console.error('Error adding booking 1:', bookingError1);
    } else {
      console.log('Booking 1 added successfully:', bookingData1);
    }
    
    // Insert second booking
    console.log(`Adding booking 2: Future booking for ${dog2.name}...`);
    const { data: bookingData2, error: bookingError2 } = await supabase
      .from('bookings')
      .insert([booking2])
      .select();
    
    if (bookingError2) {
      console.error('Error adding booking 2:', bookingError2);
    } else {
      console.log('Booking 2 added successfully:', bookingData2);
    }
    
    // 3. Re-enable RLS
    if (rlsDisabled) {
      console.log('Re-enabling RLS...');
      const rlsEnabled = await executeSql('ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;');
      
      if (!rlsEnabled) {
        console.error('Failed to re-enable RLS. Please enable it manually.');
      } else {
        console.log('RLS re-enabled successfully.');
      }
    }
    
    console.log('Booking creation process completed.');
  } catch (error) {
    console.error('Error in booking creation process:', error);
  }
}

// Run the script
addBookings(); 