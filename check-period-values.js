// Script to check valid period values
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
      .limit(1);
    
    if (error) {
      console.error('Error fetching dogs:', error);
      return null;
    }
    
    return dogs[0];
  } catch (error) {
    console.error('Error in getDogs:', error);
    return null;
  }
}

// Potential period values to try
const periodValues = [
  'MORNING', 'AFTERNOON', 'EVENING',
  'morning', 'afternoon', 'evening',
  'Morning', 'Afternoon', 'Evening',
  'AM', 'PM',
  'am', 'pm',
  'A.M.', 'P.M.',
  'early', 'mid', 'late',
  'Early', 'Mid', 'Late',
  '1', '2', '3', '4',
  'first', 'second', 'third', 'fourth'
];

async function testPeriodValuePair(startPeriod, endPeriod) {
  try {
    const dog = await getDogs();
    if (!dog) {
      console.error('No dogs found in database');
      return;
    }
    
    const bookingData = {
      dog_id: dog.id,
      start_date: createDateTime(0, 9, 0),
      end_date: createDateTime(0, 12, 0),
      notes: `Testing ${startPeriod}-${endPeriod}`,
      start_period: startPeriod,
      end_period: endPeriod,
      color: '#4287f5'
    };
    
    console.log(`Testing start_period: "${startPeriod}", end_period: "${endPeriod}"`);
    
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select();
    
    if (error) {
      console.log(`❌ FAILED: ${error.message}`);
      return false;
    } else {
      console.log(`✅ SUCCESS: Inserted booking with id ${data[0].id}`);
      return true;
    }
  } catch (error) {
    console.error('Error testing period values:', error);
    return false;
  }
}

async function main() {
  // We'll just try a few combinations first
  const combinationsToTry = [
    { start: 'morning', end: 'afternoon' },
    { start: 'MORNING', end: 'AFTERNOON' },
    { start: 'AM', end: 'PM' },
    { start: 'am', end: 'pm' },
    { start: 'early', end: 'late' },
    { start: '1', end: '2' }
  ];
  
  for (const combo of combinationsToTry) {
    const success = await testPeriodValuePair(combo.start, combo.end);
    if (success) {
      console.log(`Found working combination: start_period="${combo.start}", end_period="${combo.end}"`);
      // If we find a working pair, stop testing
      break;
    }
  }
  
  console.log('Testing complete');
}

main(); 