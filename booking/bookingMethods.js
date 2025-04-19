import { calculateDaysAndNights, formatLabelText, formatDate } from '../utils/dateUtils.js';

// Helper function to find the index of a date string in the dates array using formatDate
function findDateIndex(dates, dateStr) {
  return dates.findIndex(d => formatDate(d) === dateStr);
}

// Helper function to determine the current cell width based on viewport
function getCellWidth() {
  if (window.innerWidth <= 480) {
    return 60; // Small mobile
  } else if (window.innerWidth <= 768) {
    return 70; // Mobile/tablet
  } else {
    return 100; // Desktop
  }
}

// Exported function to add a booking bar to a given row in the Gantt chart
// 'dates' array, and event handler functions 'handleResizeStart' and 'handleTouchResizeStart' are passed as dependencies
export function addBookingBar(booking, row, dates, handleResizeStart, handleTouchResizeStart) {
  const startIndex = findDateIndex(dates, booking.startDate);
  const endIndex = findDateIndex(dates, booking.endDate);
  if (startIndex === -1 || endIndex === -1) return null;

  const cellWidth = getCellWidth();
  const halfCellWidth = cellWidth / 2;
  
  // Simpler bar position calculation - matches exactly with cell highlighting
  // Morning = start of cell, Evening = middle of cell
  const startOffset = startIndex * cellWidth + (booking.startPeriod === 'evening' ? halfCellWidth : 0);
  
  // End calculation - morning ends at middle of cell, evening ends at end of cell
  let endOffset;
  if (booking.endPeriod === 'morning') {
    endOffset = endIndex * cellWidth + halfCellWidth;
  } else { // evening
    endOffset = (endIndex + 1) * cellWidth;
  }
  
  const width = endOffset - startOffset;

  const { days, nights } = calculateDaysAndNights(startIndex, booking.startPeriod, endIndex, booking.endPeriod);

  const bar = document.createElement('div');
  bar.className = 'booking-bar';
  bar.dataset.bookingId = booking.id;
  bar.dataset.startDate = booking.startDate;
  bar.dataset.startPeriod = booking.startPeriod;
  bar.dataset.endDate = booking.endDate;
  bar.dataset.endPeriod = booking.endPeriod;
  bar.style.backgroundColor = booking.color;
  bar.style.width = `${width}px`;
  bar.style.left = `${startOffset}px`;
  bar.dataset.originalRight = `${startOffset + width}`;

  // Add the bar label showing days and nights
  const label = document.createElement('span');
  label.textContent = formatLabelText(days, nights);
  // Add class for consistent positioning and ensure it stays at the left
  label.className = 'booking-bar-label';
  label.style.position = 'absolute';
  label.style.left = '5px';
  label.style.whiteSpace = 'nowrap';
  label.style.overflow = 'hidden';
  label.style.textOverflow = 'ellipsis';
  bar.appendChild(label);

  // Add resize handles
  const leftHandle = document.createElement('div');
  leftHandle.className = 'resize-handle left-handle';
  leftHandle.setAttribute('data-tooltip', '');
  bar.appendChild(leftHandle);

  const rightHandle = document.createElement('div');
  rightHandle.className = 'resize-handle right-handle';
  rightHandle.setAttribute('data-tooltip', '');
  bar.appendChild(rightHandle);

  // Bind event listeners for mouse and touch on resize handles only
  leftHandle.addEventListener('mousedown', handleResizeStart);
  rightHandle.addEventListener('mousedown', handleResizeStart);
  leftHandle.addEventListener('touchstart', handleTouchResizeStart, { passive: false });
  rightHandle.addEventListener('touchstart', handleTouchResizeStart, { passive: false });
  
  // Add click event listeners to show booking details modal
  // Use click instead of mousedown to distinguish from resize operations
  bar.addEventListener('click', function(e) {
    // Check if the click was on one of the resize handles - if so, ignore the click
    const target = e.target;
    if (target.classList.contains('resize-handle')) {
      return;
    }
    
    // Make sure our modalManager is available
    if (window.showBookingDetails) {
      window.showBookingDetails(booking, row);
    } else {
      console.warn('Booking detail modal handler not found');
    }
  });
  
  // Make bar look interactive
  bar.style.cursor = 'pointer';

  row.appendChild(bar);
  return bar;
}

// Exported function to update a booking bar with new dates by removing the old one and adding an updated one
// Requires the same dependencies as addBookingBar
export function updateBookingBarWithNewDates(booking, row, dates, handleResizeStart, handleTouchResizeStart) {
  const existingBar = row.querySelector(`.booking-bar[data-booking-id="${booking.id}"]`);
  if (existingBar) {
    existingBar.remove();
  }
  return addBookingBar(booking, row, dates, handleResizeStart, handleTouchResizeStart);
} 