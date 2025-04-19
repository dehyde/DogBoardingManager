// Script to check the structure of the bookings table
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://wzkikplsmgfnrsztlgyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6a2lrcGxzbWdmbnJzenRsZ3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MjI0NjgsImV4cCI6MjA2MDQ5ODQ2OH0.eOyQdlXn4BIhj_ugsGv_rUSMonjxkYCG_bOjbQo9Vco';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBookingsTable() {
  try {
    console.log('Checking bookings table structure...');
    
    // Try to get the schema of the bookings table
    const { data: tables, error: tablesError } = await supabase.rpc('get_table_columns', {
      table_name: 'bookings'
    });
    
    if (tablesError) {
      console.error('Error getting table columns:', tablesError);
      
      // Alternative: try to query a single row
      console.log('Trying to query a single booking...');
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .limit(1);
      
      if (bookingError) {
        console.error('Error querying bookings:', bookingError);
      } else if (booking && booking.length > 0) {
        console.log('Booking columns:', Object.keys(booking[0]));
        console.log('Sample booking:', booking[0]);
      } else {
        console.log('No bookings found. Table is empty.');
      }
    } else {
      console.log('Table columns:', tables);
    }
    
    // Try to get information about constraints
    console.log('Checking enum types in database...');
    const { data: types, error: typesError } = await supabase.rpc('list_enum_types');
    
    if (typesError) {
      console.error('Error getting enum types:', typesError);
    } else {
      console.log('Enum types:', types);
    }
    
    // Try creating a sample booking with period values mapped to integers
    const dogResult = await supabase.from('dogs').select('*').limit(1);
    if (dogResult.error) {
      console.error('Error fetching a dog:', dogResult.error);
      return;
    }
    
    if (dogResult.data.length === 0) {
      console.error('No dogs found in database');
      return;
    }
    
    const dog = dogResult.data[0];
    
    // Try with integer values
    console.log('Attempting insert with integer values for period fields...');
    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          dog_id: dog.id,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
          notes: 'Testing integer period values',
          start_period: 0, // Try with integers
          end_period: 1,
          color: '#4287f5'
        }
      ])
      .select();
    
    if (error) {
      console.error('Insert with integer periods failed:', error.message);
    } else {
      console.log('Insert with integer periods succeeded:', data[0]);
    }
    
  } catch (error) {
    console.error('Error checking bookings table:', error);
  }
}

checkBookingsTable(); 