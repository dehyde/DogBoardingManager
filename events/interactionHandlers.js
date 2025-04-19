import { formatDate } from '../utils/dateUtils.js';

// Module factory to create an interaction manager with proper context
export function createInteractionManager(dependencies) {
  // Validate required dependencies to prevent runtime errors
  const requiredDeps = [
    'dates', 
    'formatTooltipDate', 
    'calculateDaysAndNights', 
    'formatLabelText',
    'updateBookingAfterResize'
  ];
  
  for (const dep of requiredDeps) {
    if (!dependencies[dep]) {
      console.error(`Missing required dependency: ${dep}`);
      throw new Error(`InteractionManager requires ${dep}`);
    }
  }
  
  // Extract dependencies for cleaner access
  const { 
    dates, 
    formatTooltipDate, 
    calculateDaysAndNights, 
    formatLabelText,
    updateBookingAfterResize
  } = dependencies;
  
  // Layout constants to ensure consistent calculations
  const LAYOUT = {
    MOBILE_BREAKPOINT: 480,
    TABLET_BREAKPOINT: 768,
    MOBILE_CELL_WIDTH: 60,
    TABLET_CELL_WIDTH: 70,
    DESKTOP_CELL_WIDTH: 100,
    MINIMUM_BAR_WIDTH_RATIO: 0.95 // Slightly less than a full cell width but still ensures 2 periods
  };
  
  // Module state with proper initialization
  let state = initializeState();
  
  // Reset module state to initial values
  function initializeState() {
    return {
      resizingElement: null,
      resizeType: null, // 'left' or 'right' or 'drag'
      initialWidth: 0,
      initialLeft: 0,
      initialClientX: 0,
      lastHighlightedElement: null,
      touchOverlayAdded: false
    };
  }
  
  // Determine cell width based on current viewport
  function getCellWidth() {
    if (window.innerWidth <= LAYOUT.MOBILE_BREAKPOINT) {
      return LAYOUT.MOBILE_CELL_WIDTH;
    } else if (window.innerWidth <= LAYOUT.TABLET_BREAKPOINT) {
      return LAYOUT.TABLET_CELL_WIDTH;
    }
    return LAYOUT.DESKTOP_CELL_WIDTH;
  }
  
  // Validate DOM structure before operating on it
  function validateDOMStructure() {
    const daysHeader = document.getElementById('days-header');
    if (!daysHeader) {
      console.error('DOM structure validation failed: days-header not found');
      return false;
    }
    return true;
  }
  
  // Clear all highlighted elements and temporary DOM additions
  function clearTargetHighlights() {
    if (state.lastHighlightedElement) {
      state.lastHighlightedElement.classList.remove('target-highlight');
      state.lastHighlightedElement = null;
    }
    
    // Remove temporary containers
    document.querySelectorAll('.day-parts-container').forEach(container => {
      container.remove();
    });
    
    // Clear cell highlights
    document.querySelectorAll('.cell-part.target-highlight').forEach(part => {
      part.classList.remove('target-highlight');
    });
  }
  
  // Highlight the target position in days header and chart
  function highlightTargetPosition(position) {
    if (!validateDOMStructure() || !state.resizingElement) return;
    
    clearTargetHighlights();
    
    const cellWidth = getCellWidth();
    const halfCellWidth = cellWidth / 2;
    
    // Ensure dayIndex is within bounds of dates array
    const dayIndex = Math.floor(position / cellWidth);
    if (dayIndex < 0 || dayIndex >= dates.length) {
      console.warn('Highlight position out of date range bounds:', dayIndex);
      return;
    }
    
    const remainder = position % cellWidth;
    let targetPeriod, adjustedDayIndex = dayIndex;
    
    // Simplified 2-zone snapping logic that matches booking display logic
    if (remainder < halfCellWidth) {
      // First half of cell - morning
      targetPeriod = 'morning';
    } else {
      // Second half of cell - evening
      targetPeriod = 'evening';
    }
    
    const daysHeader = document.getElementById('days-header');
    if (!daysHeader || !daysHeader.children[adjustedDayIndex]) {
      console.warn('Days header or day cell not found:', adjustedDayIndex);
      return;
    }
    
    const dayCell = daysHeader.children[adjustedDayIndex];
    const date = dates[adjustedDayIndex];
    
    // Update tooltip on resize handle
    if (state.resizingElement && state.resizeType) {
      const tooltipText = formatTooltipDate(date, targetPeriod);
      const activeHandle = state.resizingElement.querySelector(
        state.resizeType === 'left' ? '.left-handle' : '.right-handle'
      );
      
      if (activeHandle) {
        activeHandle.setAttribute('data-tooltip', tooltipText);
      }
    }
    
    // Create day parts container if it doesn't exist
    if (!dayCell.querySelector('.day-part') && !dayCell.querySelector('.day-parts-container')) {
      const container = document.createElement('div');
      container.className = 'day-parts-container';
      Object.assign(container.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        display: 'flex',
        pointerEvents: 'none'
      });
      
      const morningPart = document.createElement('div');
      morningPart.className = 'day-part morning';
      morningPart.style.width = '50%';
      
      const eveningPart = document.createElement('div');
      eveningPart.className = 'day-part evening';
      eveningPart.style.width = '50%';
      
      container.appendChild(morningPart);
      container.appendChild(eveningPart);
      dayCell.appendChild(container);
    }
    
    // Find and highlight the target day part
    const dayPartsContainer = dayCell.querySelector('.day-parts-container') || dayCell;
    const targetDayPart = targetPeriod === 'evening'
      ? dayPartsContainer.querySelector('.evening') || dayPartsContainer.children[1]
      : dayPartsContainer.querySelector('.morning') || dayPartsContainer.children[0];
    
    if (targetDayPart) {
      targetDayPart.classList.add('target-highlight');
      state.lastHighlightedElement = targetDayPart;
    }
    
    // Also highlight cell part in the chart
    try {
      const dogId = state.resizingElement?.closest('.chart-row')?.dataset.dogId;
      if (dogId) {
        const chartRow = document.querySelector(`.chart-row[data-dog-id="${dogId}"]`);
        if (chartRow && chartRow.children[adjustedDayIndex]) {
          const chartCell = chartRow.children[adjustedDayIndex];
          const targetCellPart = targetPeriod === 'evening'
            ? chartCell.querySelector('.evening') || chartCell.children[1]
            : chartCell.querySelector('.morning') || chartCell.children[0];
          
          if (targetCellPart) {
            targetCellPart.classList.add('target-highlight');
          }
        }
      }
    } catch (error) {
      console.warn('Error highlighting chart cell:', error);
      // Non-critical error, continue without breaking
    }
  }
  
  // Update the label inside the booking bar during resizing
  function updateLabelTextDuringResize(left, right) {
    if (!state.resizingElement) return;
    
    const cellWidth = getCellWidth();
    const halfCellWidth = cellWidth / 2;
    
    // Calculate indices and periods based on pixel position with consistent logic
    let startIndex = Math.floor(left / cellWidth);
    let startPeriod = (left % cellWidth < halfCellWidth) ? 'morning' : 'evening';
    
    let endIndex = Math.floor(right / cellWidth);
    let endPeriod = (right % cellWidth < halfCellWidth) ? 'morning' : 'evening';
    
    // Ensure valid indices
    startIndex = Math.max(0, Math.min(startIndex, dates.length - 1));
    endIndex = Math.max(0, Math.min(endIndex, dates.length - 1));
    
    const { days, nights } = calculateDaysAndNights(startIndex, startPeriod, endIndex, endPeriod);
    
    // Update the label text
    const label = state.resizingElement.querySelector('span');
    if (label) {
      label.textContent = formatLabelText(days, nights);
      updateLabelPositionDuringResize(label);
    }
  }
  
  // Ensure the label remains properly positioned during resize
  function updateLabelPositionDuringResize(label) {
    if (!label || !state.resizingElement) return;
    
    const barWidth = parseInt(state.resizingElement.style.width);
    
    // Ensure the label doesn't exceed bar width
    label.style.maxWidth = `${barWidth - 20}px`;
    
    // Show abbreviated label for small widths
    if (barWidth < 60) {
      if (label.textContent !== 'Booking') {
        label.dataset.fullText = label.textContent; // Store full text
        label.textContent = 'Booking';
      }
    } else if (label.dataset.fullText) {
      // Restore the full text when there's enough space
      label.textContent = label.dataset.fullText;
      delete label.dataset.fullText;
    }
    
    // Ensure consistent left positioning
    label.style.position = 'absolute';
    label.style.left = '10px';
    label.style.right = 'auto';
    label.style.width = 'auto';
    label.style.whiteSpace = 'nowrap';
    label.style.overflow = 'hidden';
    label.style.textOverflow = 'ellipsis';
  }
  
  // Create a touch capture overlay with auto-cleanup
  function createTouchCaptureOverlay() {
    // Remove any existing overlay first
    const existingOverlay = document.getElementById('touch-capture-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    const overlay = document.createElement('div');
    overlay.id = 'touch-capture-overlay';
    
    // Set all required style properties explicitly
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: '1000',
      backgroundColor: 'transparent'
    });
    
    document.body.appendChild(overlay);
    state.touchOverlayAdded = true;
    
    // Failsafe cleanup after 60 seconds in case normal cleanup fails
    setTimeout(() => {
      const overlay = document.getElementById('touch-capture-overlay');
      if (overlay) {
        console.warn('Touch overlay failsafe cleanup triggered');
        overlay.remove();
        cleanup();
      }
    }, 60000);
    
    return overlay;
  }
  
  // Complete cleanup of all resources and event listeners
  function cleanup() {
    // Remove event listeners
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.removeEventListener('touchmove', handleTouchResizeMove);
    document.removeEventListener('touchend', handleTouchResizeEnd);
    document.removeEventListener('touchcancel', handleTouchResizeEnd);
    
    // Remove visual states
    if (state.resizingElement) {
      state.resizingElement.classList.remove('resizing');
      state.resizingElement.querySelectorAll('.resize-handle').forEach(handle => {
        handle.classList.remove('active');
      });
    }
    
    // Remove any visual highlights
    clearTargetHighlights();
    
    // Remove touch overlay if it exists
    if (state.touchOverlayAdded) {
      const overlay = document.getElementById('touch-capture-overlay');
      if (overlay) {
        overlay.remove();
      }
      state.touchOverlayAdded = false;
    }
    
    // Reset state
    state = initializeState();
  }
  
  // Handle mouse resize start
  function handleResizeStart(e) {
    // Check if the user is authenticated - prevent dragging if not
    if (window.isAuthenticated === false) {
      console.log('User is not authenticated. Dragging is disabled.');
      return;
    }

    // Prevent default browser behavior
    e.preventDefault();
    
    if (e.which !== 1) return; // Only respond to left button
    
    document.body.classList.add('no-select');
    
    // Find the booking bar element
    let target = e.target;
    let isHandleResize = target.classList.contains('resize-handle');
    let element;
    
    if (isHandleResize) {
      element = target.parentElement;
      state.resizeType = target.classList.contains('left-handle') ? 'left' : 'right';
    } else if (target.classList.contains('booking-bar')) {
      element = target;
      state.resizeType = 'drag';
    } else {
      return; // Not a resizable element
    }
    
    state.resizingElement = element;
    state.initialWidth = parseInt(element.style.width);
    state.initialLeft = parseInt(element.style.left);
    state.initialClientX = e.clientX;
    
    // Add event listeners for resize/drag movement and completion
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    
    // Add visual indication of resizing
    if (state.resizingElement) {
      state.resizingElement.classList.add('resizing');
      if (isHandleResize) {
        target.classList.add('active');
      }
    }
  }
  
  // Handle touch resize start
  function handleTouchResizeStart(e) {
    // Check if the user is authenticated - prevent dragging if not
    if (window.isAuthenticated === false) {
      console.log('User is not authenticated. Touch dragging is disabled.');
      return;
    }

    // If there's already a resize in progress, don't start another
    if (state.resizingElement) return;
    
    // Prevent default to avoid scrolling while resizing
    e.preventDefault();
    
    // Find the booking bar element
    let target = e.target;
    let isHandleResize = target.classList.contains('resize-handle');
    let element;
    
    if (isHandleResize) {
      element = target.parentElement;
      state.resizeType = target.classList.contains('left-handle') ? 'left' : 'right';
    } else if (target.classList.contains('booking-bar')) {
      element = target;
      state.resizeType = 'drag';
    } else {
      return; // Not a resizable element
    }
    
    // Get the first touch point
    const touch = e.touches[0];
    if (!touch) return;
    
    state.resizingElement = element;
    state.initialWidth = parseInt(element.style.width);
    state.initialLeft = parseInt(element.style.left);
    state.initialClientX = touch.clientX;
    
    // Add event listeners for touch movement and end
    document.addEventListener('touchmove', handleTouchResizeMove, { passive: false });
    document.addEventListener('touchend', handleTouchResizeEnd);
    document.addEventListener('touchcancel', handleTouchResizeEnd);
    
    // Add touch overlay to capture all touch events
    if (!state.touchOverlayAdded) {
      createTouchCaptureOverlay();
    }
    
    // Add visual indication of resizing
    if (state.resizingElement) {
      state.resizingElement.classList.add('resizing');
      if (isHandleResize) {
        target.classList.add('active');
      }
    }
  }
  
  // Handle mouse resize move
  function handleResizeMove(e) {
    if (!state.resizingElement) return;
    
    const deltaX = e.clientX - state.initialClientX;
    const cellWidth = getCellWidth();
    const minimumWidth = cellWidth * LAYOUT.MINIMUM_BAR_WIDTH_RATIO; // Full cell width for minimum 2 periods
    
    try {
      if (state.resizeType === 'right') {
        // Resizing from right - adjust width
        const newWidth = Math.max(minimumWidth, state.initialWidth + deltaX);
        state.resizingElement.style.width = `${newWidth}px`;
        
        const right = state.initialLeft + newWidth;
        highlightTargetPosition(right);
        updateLabelTextDuringResize(state.initialLeft, right);
      } else if (state.resizeType === 'left') {
        // Resizing from left - adjust left position and width
        // Use the original right position stored in the dataset
        const originalRight = parseInt(state.resizingElement.dataset.originalRight);
        
        // Calculate the new left position while ensuring the minimum width
        const maxLeft = originalRight - minimumWidth;
        const newLeft = Math.min(maxLeft, state.initialLeft + deltaX);
        
        // Set the left position and calculate width to preserve original right boundary
        state.resizingElement.style.left = `${newLeft}px`;
        state.resizingElement.style.width = `${originalRight - newLeft}px`;
        
        highlightTargetPosition(newLeft);
        updateLabelTextDuringResize(newLeft, originalRight);
      } else if (state.resizeType === 'drag') {
        // Dragging - move entire booking while preserving width
        const newLeft = Math.max(0, state.initialLeft + deltaX);
        
        // Set the left position while preserving width
        state.resizingElement.style.left = `${newLeft}px`;
        
        // Only highlight the start position during drag operations
        // This prevents confusion with multiple cell highlights
        highlightTargetPosition(newLeft);
        updateLabelTextDuringResize(newLeft, newLeft + state.initialWidth);
      }
    } catch (error) {
      console.error('Error during resize move:', error);
      // Attempt to recover from error rather than failing completely
      cleanup();
    }
  }
  
  // Handle touch resize move
  function handleTouchResizeMove(e) {
    if (!state.resizingElement || e.touches.length !== 1) return;
    
    e.preventDefault(); // Prevent scrolling while resizing
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - state.initialClientX;
    const cellWidth = getCellWidth();
    const minimumWidth = cellWidth * LAYOUT.MINIMUM_BAR_WIDTH_RATIO; // Full cell width for minimum 2 periods
    
    try {
      if (state.resizeType === 'right') {
        // Resizing from right - adjust width
        const newWidth = Math.max(minimumWidth, state.initialWidth + deltaX);
        state.resizingElement.style.width = `${newWidth}px`;
        
        const right = state.initialLeft + newWidth;
        highlightTargetPosition(right);
        updateLabelTextDuringResize(state.initialLeft, right);
      } else if (state.resizeType === 'left') {
        // Resizing from left - adjust left position and width
        // Use the original right position stored in the dataset
        const originalRight = parseInt(state.resizingElement.dataset.originalRight);
        
        // Calculate the new left position while ensuring the minimum width
        const maxLeft = originalRight - minimumWidth;
        const newLeft = Math.min(maxLeft, state.initialLeft + deltaX);
        
        // Set the left position and calculate width to preserve original right boundary
        state.resizingElement.style.left = `${newLeft}px`;
        state.resizingElement.style.width = `${originalRight - newLeft}px`;
        
        highlightTargetPosition(newLeft);
        updateLabelTextDuringResize(newLeft, originalRight);
      } else if (state.resizeType === 'drag') {
        // Dragging - move entire booking while preserving width
        const newLeft = Math.max(0, state.initialLeft + deltaX);
        
        // Set the left position while preserving width
        state.resizingElement.style.left = `${newLeft}px`;
        
        // Only highlight the start position during drag operations
        highlightTargetPosition(newLeft);
        updateLabelTextDuringResize(newLeft, newLeft + state.initialWidth);
      }
    } catch (error) {
      console.error('Error during touch resize move:', error);
      // Attempt to recover from error
      cleanup();
    }
  }
  
  // Handle mouse resize end
  function handleResizeEnd(e) {
    if (state.resizingElement) {
      document.body.classList.remove('no-select');
      
      // Calculate the final position and dimensions
      const currentLeft = parseInt(state.resizingElement.style.left);
      const currentWidth = parseInt(state.resizingElement.style.width);
      
      // Clean up highlighting and event listeners
      clearTargetHighlights();
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      
      // If we have less than minimum width after resize, prevent the change
      const cellWidth = getCellWidth();
      const minBarWidth = cellWidth * LAYOUT.MINIMUM_BAR_WIDTH_RATIO;
      
      // Enforce minimum booking size of two periods (1 full day)
      if (currentWidth < minBarWidth) {
        // Restore original width and position
        state.resizingElement.style.width = `${Math.max(minBarWidth, state.initialWidth)}px`;
        state.resizingElement.style.left = `${state.initialLeft}px`;
        
        state.resizingElement = null;
        state.resizeType = null;
        return;
      }

      // Snap the bar to the nearest valid position
      const halfCellWidth = cellWidth / 2;
      let snappedLeft = currentLeft;
      let snappedWidth = currentWidth;
      
      if (state.resizeType === 'left' || state.resizeType === 'drag') {
        // Snap left edge to nearest morning/evening
        const leftDayIndex = Math.floor(currentLeft / cellWidth);
        const leftRemainder = currentLeft % cellWidth;
        
        if (leftRemainder < halfCellWidth) {
          // Snap to morning
          snappedLeft = leftDayIndex * cellWidth;
        } else {
          // Snap to evening
          snappedLeft = leftDayIndex * cellWidth + halfCellWidth;
        }
      }
      
      if (state.resizeType === 'right' || state.resizeType === 'drag') {
        // Snap right edge (drag needs both left and right snapping)
        const rightPos = state.resizeType === 'drag' ? currentLeft + currentWidth : state.initialLeft + currentWidth;
        const rightDayIndex = Math.floor(rightPos / cellWidth);
        const rightRemainder = rightPos % cellWidth;
        let snappedRight;
        
        if (rightRemainder < halfCellWidth) {
          // Snap to morning
          snappedRight = rightDayIndex * cellWidth;
        } else {
          // Snap to evening
          snappedRight = rightDayIndex * cellWidth + halfCellWidth;
        }
        
        // If dragging, update width based on snapped left and right
        if (state.resizeType === 'drag') {
          snappedWidth = snappedRight - snappedLeft;
        } else {
          // If only right handle, calculate width based on original left
          snappedWidth = snappedRight - state.initialLeft;
        }
      }
      
      // Update position and width with snapped values
      state.resizingElement.style.left = `${snappedLeft}px`;
      state.resizingElement.style.width = `${snappedWidth}px`;

      // Prepare data for the callback (will be used to update database)
      const resizeInfo = {
        element: state.resizingElement,
        type: state.resizeType,
        initialLeft: state.initialLeft,
        initialWidth: state.initialWidth,
        currentLeft: snappedLeft,
        currentWidth: snappedWidth
      };
      
      // Reset state before calling callback to avoid potential issues
      state.resizingElement = null;
      state.resizeType = null;
      
      // Notify the parent component about the resize completion
      // This will update the booking object with new dates/periods
      updateBookingAfterResize(resizeInfo);
    }
  }
  
  // Handle touch resize end
  function handleTouchResizeEnd(e) {
    if (!state.resizingElement) return;
    
    // Remove visual effects
    state.resizingElement.classList.remove('resizing');
    state.resizingElement.querySelectorAll('.resize-handle').forEach(handle => {
      handle.classList.remove('active');
    });
    
    // Clear highlights
    clearTargetHighlights();
    
    // Get current dimensions
    const currentLeft = parseInt(state.resizingElement.style.left);
    const currentWidth = parseInt(state.resizingElement.style.width);
    
    // Check for minimum booking size
    const cellWidth = getCellWidth();
    const minBarWidth = cellWidth * LAYOUT.MINIMUM_BAR_WIDTH_RATIO;
    
    // Enforce minimum booking size of two periods (1 full day)
    if (currentWidth < minBarWidth) {
      // Restore original dimensions
      state.resizingElement.style.width = `${Math.max(minBarWidth, state.initialWidth)}px`;
      state.resizingElement.style.left = `${state.initialLeft}px`;
      
      // Clean up
      removeTouchOverlay();
      cleanup();
      return;
    }
    
    // Apply snapping to touch events
    const halfCellWidth = cellWidth / 2;
    let snappedLeft = currentLeft;
    let snappedWidth = currentWidth;
    
    if (state.resizeType === 'left' || state.resizeType === 'drag') {
      // Snap left edge to nearest morning/evening
      const leftDayIndex = Math.floor(currentLeft / cellWidth);
      const leftRemainder = currentLeft % cellWidth;
      
      if (leftRemainder < halfCellWidth) {
        // Snap to morning
        snappedLeft = leftDayIndex * cellWidth;
      } else {
        // Snap to evening
        snappedLeft = leftDayIndex * cellWidth + halfCellWidth;
      }
    }
    
    if (state.resizeType === 'right' || state.resizeType === 'drag') {
      // Snap right edge (drag needs both left and right snapping)
      const rightPos = state.resizeType === 'drag' ? currentLeft + currentWidth : state.initialLeft + currentWidth;
      const rightDayIndex = Math.floor(rightPos / cellWidth);
      const rightRemainder = rightPos % cellWidth;
      let snappedRight;
      
      if (rightRemainder < halfCellWidth) {
        // Snap to morning
        snappedRight = rightDayIndex * cellWidth;
      } else {
        // Snap to evening
        snappedRight = rightDayIndex * cellWidth + halfCellWidth;
      }
      
      // If dragging, update width based on snapped left and right
      if (state.resizeType === 'drag') {
        snappedWidth = snappedRight - snappedLeft;
      } else {
        // If only right handle, calculate width based on original left
        snappedWidth = snappedRight - state.initialLeft;
      }
    }
    
    // Update position and width with snapped values
    state.resizingElement.style.left = `${snappedLeft}px`;
    state.resizingElement.style.width = `${snappedWidth}px`;
    
    // Capture resizing element before cleanup
    const currentResizingElement = state.resizingElement;
    
    // Process the updated booking
    if (typeof updateBookingAfterResize === 'function') {
      // Pass the relevant info to the update function
      const resizeInfo = {
        element: currentResizingElement,
        type: state.resizeType,
        currentLeft: snappedLeft,
        currentWidth: snappedWidth
      };
      
      updateBookingAfterResize(resizeInfo);
    }
    
    // Remove the overlay
    const overlay = document.getElementById('touch-capture-overlay');
    if (overlay) {
      overlay.remove();
      state.touchOverlayAdded = false;
    }
    
    // Clean up touch event listeners
    document.removeEventListener('touchmove', handleTouchResizeMove);
    document.removeEventListener('touchend', handleTouchResizeEnd);
    document.removeEventListener('touchcancel', handleTouchResizeEnd);
    
    // Reset module state
    state = initializeState();
  }
  
  // Public API - return only what needs to be externally accessible
  return {
    handleResizeStart,
    handleTouchResizeStart,
    cleanup, // Exposed for external cleanup
    // Return current state of resize operation
    getState() {
      return { ...state }; // Return copy to prevent external mutation
    }
  };
} 

// When updating booking dates after dragging or resizing, ensure consistent date format
function getFormattedDate(dateObj) {
  // Always return in YYYY-MM-DD format to match database expectations
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
} 