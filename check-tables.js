// Script to check table structure in Supabase
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://wzkikplsmgfnrsztlgyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6a2lrcGxzbWdmbnJzenRsZ3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MjI0NjgsImV4cCI6MjA2MDQ5ODQ2OH0.eOyQdlXn4BIhj_ugsGv_rUSMonjxkYCG_bOjbQo9Vco';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    // Get dogs data to see structure
    const { data: dogs, error: dogsError } = await supabase
      .from('dogs')
      .select('*')
      .limit(1);
    
    if (dogsError) {
      console.error('Error fetching dogs:', dogsError);
    } else {
      console.log('Dogs table structure:', Object.keys(dogs[0]));
      console.log('Dogs sample:', dogs[0]);
    }
    
    // Try to fetch bookings structure
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);
    
    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      
      // If there's an error, try to get table info a different way
      console.log('Attempting to get bookings table info via system tables...');
      const { data: columns, error: columnsError } = await supabase
        .rpc('get_table_columns', { table_name: 'bookings' });
      
      if (columnsError) {
        console.error('Error getting columns:', columnsError);
      } else {
        console.log('Bookings table columns:', columns);
      }
    } else {
      console.log('Bookings table structure:', Object.keys(bookings[0]));
      console.log('Bookings sample:', bookings[0]);
    }
    
  } catch (error) {
    console.error('Error in checkTables:', error);
  }
}

checkTables(); 