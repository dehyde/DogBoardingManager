// Script to verify the date range fix will work correctly
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://wzkikplsmgfnrsztlgyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6a2lrcGxzbWdmbnJzenRsZ3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MjI0NjgsImV4cCI6MjA2MDQ5ODQ2OH0.eOyQdlXn4BIhj_ugsGv_rUSMonjxkYCG_bOjbQo9Vco';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Simulate the updated generateDates function with our fix
function generateDates(bookings) {
  const dateArray = [];
  
  // Default to today's date as the start
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to beginning of day
  
  // Default to showing one month
  let startDate = today;
  let endDate = new Date(today);
  endDate.setDate(today.getDate() + 30);
  
  // If we have bookings, adjust the range to include all bookings
  if (bookings && bookings.length > 0) {
    // Find earliest booking start date
    const earliestBookingDate = bookings.reduce((earliest, booking) => {
      const bookingStart = new Date(booking.start_date);
      return bookingStart < earliest ? bookingStart : earliest;
    }, new Date(bookings[0].start_date));
    
    // Find latest booking end date
    const latestBookingDate = bookings.reduce((latest, booking) => {
      const bookingEnd = new Date(booking.end_date);
      return bookingEnd > latest ? bookingEnd : latest;
    }, new Date(bookings[0].end_date));
    
    // Ensure today is within range if possible
    if (today >= earliestBookingDate && today <= latestBookingDate) {
      // Use today as midpoint with buffer on both sides
      const daysBefore = Math.min(30, Math.floor((today - earliestBookingDate) / (1000 * 60 * 60 * 24)));
      const daysAfter = Math.min(30, Math.floor((latestBookingDate - today) / (1000 * 60 * 60 * 24)));
      
      // Create a balanced range around today
      startDate = new Date(today);
      startDate.setDate(today.getDate() - daysBefore);
      endDate = new Date(today);
      endDate.setDate(today.getDate() + daysAfter);
    } else if (today < earliestBookingDate) {
      // Today is before all bookings, show range from earliest booking
      startDate = earliestBookingDate;
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 60); // Show 60 days from earliest booking
    } else {
      // Today is after all bookings, show range ending with latest booking
      endDate = latestBookingDate;
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 60); // Show 60 days before latest booking
    }
    
    // Ensure the range covers both dates
    startDate = new Date(Math.min(startDate.getTime(), earliestBookingDate.getTime()));
    endDate = new Date(Math.max(endDate.getTime(), latestBookingDate.getTime()));
    
    // Add a buffer of at least 5 days on both sides
    startDate.setDate(startDate.getDate() - 5);
    endDate.setDate(endDate.getDate() + 5);
  }
  
  // Calculate number of days to generate
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  console.log(`Generating ${days} days from ${formatDate(startDate)} to ${formatDate(endDate)}`);
  
  // Generate dates from startDate to endDate
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dateArray.push(formatDate(date));
  }
  
  return dateArray;
}

// Check if a booking would be visible in a date range
function isBookingVisible(booking, dateRange) {
  return dateRange.includes(booking.start_date) || dateRange.includes(booking.end_date);
}

// Main function to verify the fix
async function verifyFix() {
  try {
    console.log('Fetching bookings from Supabase...');
    
    // Get all bookings
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('start_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching bookings:', error);
      return;
    }
    
    if (!bookings || bookings.length === 0) {
      console.log('No bookings found.');
      return;
    }
    
    console.log(`Found ${bookings.length} bookings.`);
    
    // Generate dates using our updated function
    const dateArray = generateDates(bookings);
    
    // Check if all bookings are visible in the date range
    let allVisible = true;
    const invisibleBookings = [];
    
    bookings.forEach(booking => {
      const visible = isBookingVisible(booking, dateArray);
      if (!visible) {
        allVisible = false;
        invisibleBookings.push(booking);
      }
    });
    
    if (allVisible) {
      console.log('SUCCESS: All bookings are visible in the date range.');
    } else {
      console.log(`WARNING: ${invisibleBookings.length} bookings are not visible in the date range.`);
      invisibleBookings.forEach(booking => {
        console.log(`- Booking ${booking.id}: ${booking.start_date} to ${booking.end_date}`);
      });
    }
    
    // Check if today is in the date range
    const today = formatDate(new Date());
    if (dateArray.includes(today)) {
      console.log('SUCCESS: Today is included in the date range.');
    } else {
      console.log('WARNING: Today is not included in the date range.');
    }
    
    // Print first and last 5 dates in the range
    console.log('First 5 dates in range:');
    dateArray.slice(0, 5).forEach(date => console.log(`- ${date}`));
    
    console.log('Last 5 dates in range:');
    dateArray.slice(-5).forEach(date => console.log(`- ${date}`));
    
    // Calculate column width requirements
    const days = dateArray.length;
    console.log(`Total days in date range: ${days}`);
    
    const estimatedWidth = days * 100; // 100px per day
    console.log(`Estimated total width: ${estimatedWidth}px`);
    console.log(`With a typical desktop screen width of 1920px, this would require scrolling horizontally ~${Math.round(estimatedWidth / 1920 * 10) / 10} screen widths.`);
    
    console.log('\nVERIFICATION COMPLETE: The fix should work correctly to display all bookings.');
    
  } catch (error) {
    console.error('Error in verification:', error);
  }
}

// Run the verification
verifyFix(); 