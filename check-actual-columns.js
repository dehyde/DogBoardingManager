// Script to check actual column names in the database
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://wzkikplsmgfnrsztlgyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6a2lrcGxzbWdmbnJzenRsZ3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MjI0NjgsImV4cCI6MjA2MDQ5ODQ2OH0.eOyQdlXn4BIhj_ugsGv_rUSMonjxkYCG_bOjbQo9Vco';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableColumns() {
  try {
    // Try a direct SQL query to get column information
    const { data, error } = await supabase.rpc('check_columns', {
      p_query: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        ORDER BY ordinal_position
      `
    });
    
    if (error) {
      console.error('Error in RPC call:', error);
      
      // Fallback: try a simple query
      console.log('Trying a simple query to check bookings table...');
      const { data: sample, error: sampleError } = await supabase
        .from('bookings')
        .select('*')
        .limit(1);
        
      if (sampleError) {
        console.error('Error fetching sample:', sampleError);
        
        // Last resort: try to describe the table indirectly
        console.log('Last resort: checking if table exists...');
        const { data: tables, error: tablesError } = await supabase
          .from('pg_tables')
          .select('tablename')
          .eq('schemaname', 'public');
          
        if (tablesError) {
          console.error('Error checking tables:', tablesError);
        } else {
          console.log('Available tables:', tables);
        }
      } else if (sample && sample.length > 0) {
        console.log('Sample booking:', sample[0]);
        console.log('Column names:', Object.keys(sample[0]));
      } else {
        console.log('No bookings found, but table exists');
      }
    } else {
      console.log('Column information:', data);
    }
    
    // Try a different approach - direct SQL query
    const { data: sqlData, error: sqlError } = await supabase.from('dogs').select('*').limit(1);
    if (sqlError) {
      console.error('Error querying dogs:', sqlError);
    } else {
      console.log('Dogs sample for reference:', sqlData[0]);
      console.log('Dogs columns:', Object.keys(sqlData[0]));
    }
    
  } catch (error) {
    console.error('Error in checkTableColumns:', error);
  }
}

checkTableColumns(); 