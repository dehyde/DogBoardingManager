// Fix date range script
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://wzkikplsmgfnrsztlgyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6a2lrcGxzbWdmbnJzenRsZ3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MjI0NjgsImV4cCI6MjA2MDQ5ODQ2OH0.eOyQdlXn4BIhj_ugsGv_rUSMonjxkYCG_bOjbQo9Vco';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateDateRange() {
  try {
    console.log('Checking the current booking date range...');
    
    // Get all bookings ordered by start date
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .order('start_date', { ascending: true });
    
    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return;
    }
    
    if (!bookings || bookings.length === 0) {
      console.log('No bookings found to analyze.');
      return;
    }
    
    console.log(`Found ${bookings.length} bookings.`);
    
    // Find earliest and latest booking dates
    const earliestBooking = bookings[0]; // Already sorted by start_date ascending
    const latestBooking = bookings.reduce((latest, booking) => {
      return new Date(booking.end_date) > new Date(latest.end_date) ? booking : latest;
    }, bookings[0]);
    
    console.log('Earliest booking:', {
      id: earliestBooking.id,
      dogId: earliestBooking.dog_id,
      startDate: earliestBooking.start_date,
      endDate: earliestBooking.end_date
    });
    
    console.log('Latest booking:', {
      id: latestBooking.id,
      dogId: latestBooking.dog_id,
      startDate: latestBooking.start_date,
      endDate: latestBooking.end_date
    });
    
    // Calculate date span in days
    const earliestDate = new Date(earliestBooking.start_date);
    const latestDate = new Date(latestBooking.end_date);
    const daySpan = Math.ceil((latestDate - earliestDate) / (1000 * 60 * 60 * 24)) + 1;
    
    console.log(`Date span between earliest and latest booking: ${daySpan} days`);
    
    // Check if there are any bookings from before March 25, 2025 that aren't visible
    const today = new Date();
    const pastBookings = bookings.filter(booking => {
      return new Date(booking.start_date) < today;
    });
    
    if (pastBookings.length > 0) {
      console.log(`Found ${pastBookings.length} bookings in the past that might not be visible.`);
      console.log('First past booking:', {
        id: pastBookings[0].id,
        dogId: pastBookings[0].dog_id,
        startDate: pastBookings[0].start_date,
        endDate: pastBookings[0].end_date
      });
    }
    
    // Check if there are any bookings beyond May 1, 2025 that might not be visible
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 31); // Approximately one month from now
    
    const futureBookings = bookings.filter(booking => {
      return new Date(booking.end_date) > futureDate;
    });
    
    if (futureBookings.length > 0) {
      console.log(`Found ${futureBookings.length} bookings in the future that might not be visible.`);
      console.log('Last future booking:', {
        id: futureBookings[futureBookings.length - 1].id,
        dogId: futureBookings[futureBookings.length - 1].dog_id,
        startDate: futureBookings[futureBookings.length - 1].start_date,
        endDate: futureBookings[futureBookings.length - 1].end_date
      });
    }
    
    console.log('\nPROPOSED SOLUTION:');
    console.log('1. Modify the generateDates function in app.js to consider both earliest and latest bookings');
    console.log('2. Ensure the UI displays all bookings by increasing the date range');
    console.log('3. Keep today\'s date visible if it\'s between the earliest and latest bookings');
    
    console.log('\nEDIT REQUIRED:');
    console.log('In app.js file, locate the generateDates function (around line 21) and update it to:');
    console.log(`
    function generateDates(bookingsData) {
        const dateArray = [];
        
        // Default to today's date as the start
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to beginning of day
        
        // Default to showing one month
        let startDate = today;
        let endDate = new Date(today);
        endDate.setDate(today.getDate() + 30);
        
        // If we have bookings, adjust the range to include all bookings
        if (bookingsData && bookingsData.length > 0) {
            // Find earliest booking start date
            const earliestBookingDate = bookingsData.reduce((earliest, booking) => {
                const bookingStart = new Date(booking.startDate);
                return bookingStart < earliest ? bookingStart : earliest;
            }, new Date(bookingsData[0].startDate));
            
            // Find latest booking end date
            const latestBookingDate = bookingsData.reduce((latest, booking) => {
                const bookingEnd = new Date(booking.endDate);
                return bookingEnd > latest ? bookingEnd : latest;
            }, new Date(bookingsData[0].endDate));
            
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
        
        // Generate dates from startDate to endDate
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dateArray.push(date);
        }
        
        return dateArray;
    }`);
    
    console.log('\nAfter making this change, the app will display a wider date range that includes all bookings,');
    console.log('while keeping the interface usable by centering around today when possible.');
    
  } catch (error) {
    console.error('Error in date range analysis:', error);
  }
}

// Run the script
updateDateRange(); 