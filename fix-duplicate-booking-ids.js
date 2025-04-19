// Script to fix duplicate booking IDs
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Supabase configuration
const supabaseUrl = 'https://wzkikplsmgfnrsztlgyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6a2lrcGxzbWdmbnJzenRsZ3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MjI0NjgsImV4cCI6MjA2MDQ5ODQ2OH0.eOyQdlXn4BIhj_ugsGv_rUSMonjxkYCG_bOjbQo9Vco';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDuplicateBookingIds() {
  try {
    console.log('Checking for duplicate booking IDs...');
    
    // Get all bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*');
    
    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return;
    }
    
    if (!bookings || bookings.length === 0) {
      console.log('No bookings found. Nothing to fix.');
      return;
    }
    
    console.log(`Found ${bookings.length} total bookings`);
    
    // Group bookings by ID to find duplicates
    const bookingsByID = {};
    bookings.forEach(booking => {
      if (!bookingsByID[booking.id]) {
        bookingsByID[booking.id] = [];
      }
      bookingsByID[booking.id].push(booking);
    });
    
    // Find IDs that have more than one booking
    const duplicateIds = Object.keys(bookingsByID).filter(id => 
      bookingsByID[id].length > 1
    );
    
    if (duplicateIds.length === 0) {
      console.log('No duplicate booking IDs found. Everything looks good!');
      return;
    }
    
    console.log(`Found ${duplicateIds.length} booking IDs with duplicates`);
    
    // For each ID with duplicates, update all but one to have unique IDs
    for (const id of duplicateIds) {
      const duplicateBookings = bookingsByID[id];
      console.log(`ID ${id} has ${duplicateBookings.length} bookings. Fixing...`);
      
      // Keep the first one as is, update the rest
      for (let i = 1; i < duplicateBookings.length; i++) {
        const booking = duplicateBookings[i];
        const newId = uuidv4();
        
        console.log(`Updating booking for dog ${booking.dog_id} from ID ${booking.id} to ${newId}`);
        
        // Update this booking with a new UUID
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ id: newId })
          .eq('id', booking.id)
          .eq('dog_id', booking.dog_id); // Include dog_id to make sure we update the right one
        
        if (updateError) {
          console.error(`Error updating booking ID for dog ${booking.dog_id}:`, updateError);
        } else {
          console.log(`Successfully updated booking ID for dog ${booking.dog_id}`);
        }
      }
    }
    
    // Verify the fix by checking for duplicates again
    const { data: verifyBookings, error: verifyError } = await supabase
      .from('bookings')
      .select('*');
    
    if (verifyError) {
      console.error('Error verifying fix:', verifyError);
      return;
    }
    
    // Group again to check for duplicates
    const verifyBookingsByID = {};
    verifyBookings.forEach(booking => {
      if (!verifyBookingsByID[booking.id]) {
        verifyBookingsByID[booking.id] = [];
      }
      verifyBookingsByID[booking.id].push(booking);
    });
    
    const remainingDuplicates = Object.keys(verifyBookingsByID).filter(id => 
      verifyBookingsByID[id].length > 1
    );
    
    if (remainingDuplicates.length === 0) {
      console.log('Success! All booking IDs are now unique.');
    } else {
      console.log(`Warning: Still found ${remainingDuplicates.length} IDs with duplicates.`);
      console.log('Manual inspection may be required.');
    }
    
  } catch (error) {
    console.error('Error fixing duplicate booking IDs:', error);
  }
}

fixDuplicateBookingIds(); 