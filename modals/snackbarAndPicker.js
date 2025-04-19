import { formatTooltipDate, formatDate, calculateDaysAndNights, formatLabelText } from '../utils/dateUtils.js';

/**
 * Creates and manages the modal and date picker functionality
 * @param {Object} dependencies - Required dependencies
 * @returns {Object} - Public API for modal and date picker functions
 */
export function createModalManager(dependencies) {
  // Validate dependencies
  const requiredDeps = ['dates', 'updateBookingBarWithNewDates'];
  for (const dep of requiredDeps) {
    if (!dependencies[dep]) {
      console.error(`Missing required dependency: ${dep}`);
      throw new Error(`ModalManager requires ${dep}`);
    }
  }
  
  const { dates, updateBookingBarWithNewDates } = dependencies;
  
  /**
   * Shows the booking details modal with all information about a booking
   * @param {Object} booking - The booking to display
   * @param {HTMLElement} row - The chart row element for the dog
   */
  function showBookingDetailModal(booking, row) {
    try {
      // Get required DOM elements
      const modal = document.getElementById('booking-detail-modal');
      const overlay = document.getElementById('modal-overlay');
      const dogNameElement = document.getElementById('booking-dog-name');
      const startDateElement = document.getElementById('booking-start-date');
      const endDateElement = document.getElementById('booking-end-date');
      const durationElement = document.getElementById('booking-duration');
      const notesElement = document.getElementById('booking-notes');
      const closeBtn = document.getElementById('booking-detail-close');
      const closeBtnFooter = document.getElementById('booking-detail-close-btn');
      const editBtn = document.getElementById('booking-detail-edit');
      
      if (!modal || !overlay) {
        console.error('Required modal elements not found');
        return;
      }
      
      // Get the dog name
      let dogName = `Dog #${row.dataset.dogId}`;
      try {
        const dogId = row.dataset.dogId;
        const dogElement = document.querySelector(`.dog-row[data-dog-id="${dogId}"]`);
        if (dogElement) {
          dogName = dogElement.textContent.trim();
        }
      } catch (error) {
        console.warn('Error getting dog name:', error);
        // Continue with default dogName
      }
      
      // Find date indices and get date objects for better formatting
      const startIndex = dates.findIndex(d => formatDate(d) === booking.startDate);
      const endIndex = dates.findIndex(d => formatDate(d) === booking.endDate);
      
      // Safety check for valid indices
      if (startIndex === -1 || endIndex === -1 || startIndex >= dates.length || endIndex >= dates.length) {
        console.error('Invalid date indices:', startIndex, endIndex);
        return;
      }
      
      // Get date objects
      const startDateObj = dates[startIndex];
      const endDateObj = dates[endIndex];
      
      // Format dates for display
      const startDateText = formatTooltipDate(startDateObj, booking.startPeriod);
      const endDateText = formatTooltipDate(endDateObj, booking.endPeriod);
      
      // Set title and dog name
      dogNameElement.textContent = dogName;
      
      // Set booking details
      startDateElement.textContent = startDateText;
      endDateElement.textContent = endDateText;
      
      // Calculate and display duration
      const { days, nights } = calculateDaysAndNights(startIndex, booking.startPeriod, endIndex, booking.endPeriod);
      durationElement.textContent = formatLabelText(days, nights);
      
      // Set notes (if available)
      if (booking.notes) {
        notesElement.textContent = booking.notes;
      } else {
        notesElement.textContent = 'No notes available';
      }
      
      // Show the modal
      modal.style.display = 'flex';
      overlay.style.display = 'block';
      
      // Attach event listeners for closing
      const closeModal = () => {
        modal.style.display = 'none';
        overlay.style.display = 'none';
      };
      
      closeBtn.onclick = closeModal;
      closeBtnFooter.onclick = closeModal;
      
      // Handle edit button click
      editBtn.onclick = function() {
        // Close details modal
        closeModal();
        
        // Determine which date is being edited (default to end date)
        const resizeType = 'right';
        
        // Store original booking for potential restore
        const originalBooking = { ...booking };
        
        // Show the edit modal
        showSnackbarModal(booking, originalBooking, row, null, resizeType);
      };
      
    } catch (error) {
      console.error('Error showing booking detail modal:', error);
    }
  }
  
  /**
   * Shows the snackbar modal with booking information
   * @param {Object} tempBooking - The current/modified booking
   * @param {Object} originalBooking - The original booking before modification
   * @param {HTMLElement} row - The chart row element
   * @param {HTMLElement} barElement - The booking bar element
   * @param {string} currentResizeType - The type of resize ('left' or 'right')
   */
  function showSnackbarModal(tempBooking, originalBooking, row, barElement, currentResizeType) {
    try {
      // Get required DOM elements
      const modal = document.getElementById('snackbar-modal');
      const overlay = document.getElementById('modal-overlay');
      const dateDisplay = document.getElementById('date-display');
      const snackbarTitle = document.getElementById('snackbar-title');
      const approveBtn = document.getElementById('approve-btn');
      const cancelBtn = document.getElementById('cancel-btn');
      
      if (!modal || !overlay || !dateDisplay || !snackbarTitle || !approveBtn || !cancelBtn) {
        console.error('Required modal elements not found');
        return;
      }
      
      // Get the dog name
      let dogName = `Dog #${row.dataset.dogId}`;
      try {
        const dogId = row.dataset.dogId;
        const dogElement = document.querySelector(`.dog-row[data-dog-id="${dogId}"]`);
        if (dogElement) {
          dogName = dogElement.textContent.trim();
        }
      } catch (error) {
        console.warn('Error getting dog name:', error);
        // Continue with default dogName
      }
      
      // Determine which date is being edited based on resize type
      const resizeType = currentResizeType || 'right';
      dateDisplay.dataset.editingSide = resizeType === 'left' ? 'start' : 'end';
      
      // Find date indices
      const startIndex = dates.findIndex(d => formatDate(d) === tempBooking.startDate);
      const endIndex = dates.findIndex(d => formatDate(d) === tempBooking.endDate);
      
      // Safety check for valid indices
      if (startIndex === -1 || endIndex === -1 || startIndex >= dates.length || endIndex >= dates.length) {
        console.error('Invalid date indices:', startIndex, endIndex);
        hideSnackbarModal();
        return;
      }
      
      // Get date objects
      const startDateObj = dates[startIndex];
      const endDateObj = dates[endIndex];
      
      // Format dates for display
      const startDateText = formatTooltipDate(startDateObj, tempBooking.startPeriod);
      const endDateText = formatTooltipDate(endDateObj, tempBooking.endPeriod);
      
      // Update display text based on which side is being edited
      dateDisplay.textContent = dateDisplay.dataset.editingSide === 'start' ? startDateText : endDateText;
      
      // Set title
      const actionType = dateDisplay.dataset.editingSide === 'start' ? 'Check in' : 'Check out';
      snackbarTitle.textContent = `${dogName} - ${actionType}`;
      
      // Store date information for the date picker
      dateDisplay.dataset.startDate = tempBooking.startDate;
      dateDisplay.dataset.startPeriod = tempBooking.startPeriod;
      dateDisplay.dataset.endDate = tempBooking.endDate;
      dateDisplay.dataset.endPeriod = tempBooking.endPeriod;
      dateDisplay.dataset.originalStartDate = originalBooking.startDate;
      dateDisplay.dataset.originalStartPeriod = originalBooking.startPeriod;
      dateDisplay.dataset.originalEndDate = originalBooking.endDate;
      dateDisplay.dataset.originalEndPeriod = originalBooking.endPeriod;
      
      // Show the modal
      modal.style.display = 'flex';
      overlay.style.display = 'block';
      
      // Attach event listeners
      approveBtn.onclick = async function() {
        try {
          // Show loading state on button
          approveBtn.disabled = true;
          approveBtn.classList.add('loading');
          
          // Check if we have the Supabase service available
          if (!window.supabaseService || !window.supabaseService.updateBooking) {
            throw new Error('Database service not available');
          }
          
          // Save the booking changes to the database
          const result = await window.supabaseService.updateBooking(tempBooking.id, tempBooking);
          
          if (result) {
            // Show success notification
            showNotification('Booking updated successfully', 'success');
            hideSnackbarModal();
          } else {
            throw new Error('Failed to update booking');
          }
        } catch (error) {
          console.error('Error updating booking in database:', error);
          
          // Show error notification
          showNotification('Error saving changes. Please try again.', 'error');
          
          // Revert to original booking data since save failed
          Object.assign(tempBooking, originalBooking);
          
          // Remove current bar
          if (barElement) {
            barElement.remove();
          } else {
            const existingBar = row.querySelector(`.booking-bar[data-booking-id="${originalBooking.id}"]`);
            if (existingBar) {
              existingBar.remove();
            }
          }
          
          // Add original bar back
          updateBookingBarWithNewDates(originalBooking, row);
          
          hideSnackbarModal();
        } finally {
          // Reset button state
          approveBtn.disabled = false;
          approveBtn.classList.remove('loading');
        }
      };
      
      cancelBtn.onclick = function() {
        // Revert to original booking data
        Object.assign(tempBooking, originalBooking);
        
        // Remove current bar
        if (barElement) {
          barElement.remove();
        } else {
          const existingBar = row.querySelector(`.booking-bar[data-booking-id="${originalBooking.id}"]`);
          if (existingBar) {
            existingBar.remove();
          }
        }
        
        // Add original bar back (passing required dependencies)
        updateBookingBarWithNewDates(originalBooking, row);
        
        hideSnackbarModal();
      };
      
      // Date picker functionality
      dateDisplay.onclick = function() {
        showDatePicker(this, tempBooking, row, this.dataset.editingSide);
      };
    } catch (error) {
      console.error('Error showing snackbar modal:', error);
      // Attempt recovery
      hideSnackbarModal();
    }
  }
  
  /**
   * Shows a notification to the user
   * @param {string} message - Message to display
   * @param {string} type - Type of notification ('success' or 'error')
   */
  function showNotification(message, type) {
    // Check if notification element exists, create if not
    let notification = document.getElementById('notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'notification';
      notification.style.position = 'fixed';
      notification.style.top = '20px';
      notification.style.right = '20px';
      notification.style.padding = '10px 20px';
      notification.style.borderRadius = '4px';
      notification.style.fontWeight = '500';
      notification.style.zIndex = '2000';
      notification.style.transition = 'opacity 0.3s ease';
      document.body.appendChild(notification);
    }
    
    // Set styles based on type
    if (type === 'success') {
      notification.style.backgroundColor = '#d4edda';
      notification.style.color = '#155724';
      notification.style.border = '1px solid #c3e6cb';
    } else {
      notification.style.backgroundColor = '#f8d7da';
      notification.style.color = '#721c24';
      notification.style.border = '1px solid #f5c6cb';
    }
    
    // Set message and show notification
    notification.textContent = message;
    notification.style.opacity = '1';
    
    // Hide after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
    }, 3000);
  }
  
  /**
   * Shows the date picker for selecting a date
   * @param {HTMLElement} dateElement - The date display element
   * @param {Object} booking - The booking being modified
   * @param {HTMLElement} row - The chart row element
   * @param {string} editingSide - Which side is being edited ('start' or 'end')
   */
  function showDatePicker(dateElement, booking, row, editingSide) {
    try {
      const datePicker = document.getElementById('date-picker');
      const datePickerGrid = document.getElementById('date-picker-grid');
      const datePickerClose = document.getElementById('date-picker-close');
      
      if (!datePicker || !datePickerGrid || !datePickerClose) {
        console.error('Required date picker elements not found');
        return;
      }
      
      // Ensure we have a valid editing side
      editingSide = editingSide || dateElement.dataset.editingSide;
      if (editingSide !== 'start' && editingSide !== 'end') {
        console.error('Invalid editing side:', editingSide);
        return;
      }
      
      // Position and show the date picker
      datePicker.style.display = 'block';
      
      // Get current date index
      const dateIndex = dates.findIndex(d => 
        formatDate(d) === (editingSide === 'start' ? booking.startDate : booking.endDate)
      );
      
      if (dateIndex === -1 || dateIndex >= dates.length) {
        console.error('Invalid date index:', dateIndex);
        datePicker.style.display = 'none';
        return;
      }
      
      const currentDate = dates[dateIndex];
      const currentPeriod = editingSide === 'start' ? booking.startPeriod : booking.endPeriod;
      
      // Handle period selection
      const periodOptions = document.querySelectorAll('.period-option');
      periodOptions.forEach(option => {
        option.classList.toggle('selected', option.dataset.period === currentPeriod);
        
        // Add click event
        option.onclick = function() {
          // Remove selected class from all options
          periodOptions.forEach(opt => opt.classList.remove('selected'));
          
          // Add selected class to clicked option
          this.classList.add('selected');
          
          // Update booking period
          if (editingSide === 'start') {
            booking.startPeriod = this.dataset.period;
          } else {
            booking.endPeriod = this.dataset.period;
          }
          
          // Update display
          const dateObj = new Date(editingSide === 'start' ? booking.startDate : booking.endDate);
          dateElement.textContent = formatTooltipDate(dateObj, this.dataset.period);
          
          // Update title
          updateSnackbarTitle(row, editingSide);
          
          // Update booking bar
          updateBookingBarWithNewDates(booking, row);
        };
      });
      
      // Clear existing grid
      datePickerGrid.innerHTML = '';
      
      // Generate calendar for current month
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Add day headers
      const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'date-picker-day';
        dayHeader.textContent = day;
        dayHeader.style.fontWeight = 'bold';
        dayHeader.style.color = '#6c757d';
        datePickerGrid.appendChild(dayHeader);
      });
      
      // Get first day of month and fill empty cells
      const firstDay = new Date(year, month, 1).getDay();
      for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'date-picker-day';
        datePickerGrid.appendChild(emptyDay);
      }
      
      // Get days in month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // Add days
      for (let i = 1; i <= daysInMonth; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'date-picker-day';
        dayElement.textContent = i;
        
        // Highlight current date
        if (i === currentDate.getDate()) {
          dayElement.classList.add('selected');
        }
        
        // Add click event
        dayElement.onclick = function() {
          // Remove selected class from all days
          document.querySelectorAll('.date-picker-day').forEach(day => {
            if (day.textContent && !isNaN(parseInt(day.textContent))) {
              day.classList.remove('selected');
            }
          });
          
          // Add selected class to clicked day
          this.classList.add('selected');
          
          // Create date for selected day
          const newDate = new Date(year, month, parseInt(this.textContent));
          
          // Find closest date in our dates array
          let closestDateIndex = -1;
          let minDiff = Infinity;
          
          dates.forEach((date, index) => {
            const diff = Math.abs(date.getTime() - newDate.getTime());
            if (diff < minDiff) {
              minDiff = diff;
              closestDateIndex = index;
            }
          });
          
          // Use found date
          if (closestDateIndex >= 0) {
            const matchingDate = dates[closestDateIndex];
            const formattedDate = formatDate(matchingDate);
            
            // Update booking date
            if (editingSide === 'start') {
              booking.startDate = formattedDate;
            } else {
              booking.endDate = formattedDate;
            }
            
            // Get selected period
            const selectedPeriod = document.querySelector('.period-option.selected')?.dataset.period;
            if (selectedPeriod) {
              if (editingSide === 'start') {
                booking.startPeriod = selectedPeriod;
              } else {
                booking.endPeriod = selectedPeriod;
              }
            }
            
            // Update display
            dateElement.textContent = formatTooltipDate(matchingDate, editingSide === 'start' ? booking.startPeriod : booking.endPeriod);
            
            // Update title
            updateSnackbarTitle(row, editingSide);
            
            // Update booking bar
            updateBookingBarWithNewDates(booking, row);
          }
        };
        
        datePickerGrid.appendChild(dayElement);
      }
      
      // Close button
      datePickerClose.onclick = function() {
        datePicker.style.display = 'none';
      };
      
      // Close when clicking outside
      document.addEventListener('click', function closeOnClickOutside(e) {
        if (!datePicker.contains(e.target) && e.target !== dateElement) {
          datePicker.style.display = 'none';
          document.removeEventListener('click', closeOnClickOutside);
        }
      });
    } catch (error) {
      console.error('Error showing date picker:', error);
      // Hide date picker on error
      const datePicker = document.getElementById('date-picker');
      if (datePicker) {
        datePicker.style.display = 'none';
      }
    }
  }
  
  /**
   * Helper function to format a date as YYYY-MM-DD
   * @param {Date} date - The date to format
   * @returns {string} - Formatted date
   */
  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }
  
  /**
   * Updates the snackbar title based on dog name and action type
   * @param {HTMLElement} row - The chart row element
   * @param {string} editingSide - Which side is being edited ('start' or 'end')
   */
  function updateSnackbarTitle(row, editingSide) {
    const snackbarTitle = document.getElementById('snackbar-title');
    if (!snackbarTitle) return;
    
    // Get dog name
    let dogName = `Dog #${row.dataset.dogId}`;
    try {
      const dogId = row.dataset.dogId;
      const dogElement = document.querySelector(`.dog-row[data-dog-id="${dogId}"]`);
      if (dogElement) {
        dogName = dogElement.textContent.trim();
      }
    } catch (error) {
      // Continue with default dogName
    }
    
    const actionType = editingSide === 'start' ? 'Check in' : 'Check out';
    snackbarTitle.textContent = `${dogName} - ${actionType}`;
  }
  
  /**
   * Hides the snackbar modal and date picker
   */
  function hideSnackbarModal() {
    try {
      const modal = document.getElementById('snackbar-modal');
      const overlay = document.getElementById('modal-overlay');
      const datePicker = document.getElementById('date-picker');
      
      if (modal) modal.style.display = 'none';
      if (overlay) overlay.style.display = 'none';
      if (datePicker) datePicker.style.display = 'none';
    } catch (error) {
      console.error('Error hiding snackbar modal:', error);
    }
  }
  
  // Return public API
  return {
    showSnackbarModal,
    showBookingDetailModal,
    hideSnackbarModal,
    showDatePicker
  };
} 