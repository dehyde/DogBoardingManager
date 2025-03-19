document.addEventListener('DOMContentLoaded', function() {
    // Mock data
    const dogs = [
        { id: 1, name: '❤️ לולה' },
        { id: 2, name: 'בני' },
        { id: 3, name: 'צ׳רלי' },
        { id: 4, name: 'לונה' },
        { id: 5, name: 'קופר' },
        { id: 6, name: 'יוכבד' },
        { id: 7, name: 'באדי' },
        { id: 8, name: 'טוסט' },
        { id: 9, name: 'מילקי' },
        { id: 10, name: 'אריאנה' },
        { id: 11, name: 'רקסי' },
        { id: 12, name: 'ג׳ינג׳י' },
        { id: 13, name: 'בלה' },
        { id: 14, name: 'מקס' },
        { id: 15, name: 'ליאו' },
        { id: 16, name: 'סטלה' },
        { id: 17, name: 'דיזל' },
        { id: 18, name: 'לייקה' },
        { id: 19, name: 'זיו' },
        { id: 20, name: 'נובה' }
    ];

    // Mock bookings (dogId, startDate, period, endDate, period)
    // period: 'morning' or 'evening'
    const bookings = [
        { id: 1, dogId: 1, startDate: '2023-01-01', startPeriod: 'morning', endDate: '2023-01-05', endPeriod: 'evening', color: '#007bff' },
        { id: 2, dogId: 2, startDate: '2023-01-03', startPeriod: 'morning', endDate: '2023-01-08', endPeriod: 'evening', color: '#6f42c1' },
        { id: 3, dogId: 4, startDate: '2023-01-07', startPeriod: 'morning', endDate: '2023-01-12', endPeriod: 'evening', color: '#28a745' },
        { id: 4, dogId: 6, startDate: '2023-01-10', startPeriod: 'morning', endDate: '2023-01-15', endPeriod: 'evening', color: '#fd7e14' },
        { id: 5, dogId: 8, startDate: '2023-01-12', startPeriod: 'morning', endDate: '2023-01-18', endPeriod: 'evening', color: '#dc3545' },
        { id: 6, dogId: 3, startDate: '2023-01-15', startPeriod: 'morning', endDate: '2023-01-20', endPeriod: 'evening', color: '#20c997' },
        { id: 7, dogId: 5, startDate: '2023-01-18', startPeriod: 'morning', endDate: '2023-01-23', endPeriod: 'evening', color: '#6610f2' },
        { id: 8, dogId: 9, startDate: '2023-01-20', startPeriod: 'morning', endDate: '2023-01-25', endPeriod: 'evening', color: '#17a2b8' }
    ];

    // Generate dates for January 2023 (as an example)
    const dates = [];
    for (let i = 1; i <= 31; i++) {
        const date = new Date(2023, 0, i); // Month is 0-indexed in JavaScript
        dates.push(date);
    }

    // Helper function to format date as YYYY-MM-DD
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    // Helper function to find date index in our dates array
    function findDateIndex(dateStr) {
        return dates.findIndex(d => formatDate(d) === dateStr);
    }

    // Create a function to render the days header
    function renderDaysHeader() {
        const daysHeader = document.getElementById('days-header');
        
        dates.forEach(date => {
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell date-header';
            dayCell.dataset.date = formatDate(date);
            
            const dayOfMonth = date.getDate();
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = monthNames[date.getMonth()];
            
            // Create a single date header instead of morning/evening parts
            dayCell.textContent = dayOfMonth + ' ' + month;
            
            daysHeader.appendChild(dayCell);
        });
    }

    // Create a function to render dog names
    function renderDogNames() {
        const dogsColumn = document.querySelector('.dogs-column');
        
        dogs.forEach(dog => {
            const dogRow = document.createElement('div');
            dogRow.className = 'dog-row';
            dogRow.dataset.dogId = dog.id;
            dogRow.textContent = dog.name;
            
            dogsColumn.appendChild(dogRow);
        });
    }

    // Create a function to render the Gantt chart
    function renderGanttChart() {
        const ganttChart = document.getElementById('gantt-chart');
        
        dogs.forEach(dog => {
            const chartRow = document.createElement('div');
            chartRow.className = 'chart-row';
            chartRow.dataset.dogId = dog.id;
            
            // Create cell containers for each date
            dates.forEach(date => {
                const chartCell = document.createElement('div');
                chartCell.className = 'chart-cell';
                chartCell.dataset.date = formatDate(date);
                
                // Create morning and evening parts
                const morningPart = document.createElement('div');
                morningPart.className = 'cell-part morning';
                morningPart.dataset.period = 'morning';
                
                const eveningPart = document.createElement('div');
                eveningPart.className = 'cell-part evening';
                eveningPart.dataset.period = 'evening';
                
                chartCell.appendChild(morningPart);
                chartCell.appendChild(eveningPart);
                
                chartRow.appendChild(chartCell);
            });
            
            ganttChart.appendChild(chartRow);
            
            // Add the bookings as bars for this dog
            const dogBookings = bookings.filter(b => b.dogId === dog.id);
            dogBookings.forEach(booking => {
                addBookingBar(booking, chartRow);
            });
        });
    }
    
    // Extract days and nights calculation into a separate function for consistency
    function calculateDaysAndNights(startIndex, startPeriod, endIndex, endPeriod) {
        // Handle edge case where start and end are the same
        if (startIndex === endIndex && startPeriod === endPeriod) {
            return { days: 0, nights: 0 };
        }
        
        // Convert to half-days for calculation
        const startHalfDays = startIndex * 2 + (startPeriod === 'evening' ? 1 : 0);
        const endHalfDays = endIndex * 2 + (endPeriod === 'evening' ? 1 : 0);
        
        // If end is before start somehow, return zeros
        if (endHalfDays <= startHalfDays) {
            return { days: 0, nights: 0 };
        }
        
        // Calculate days and nights
        let days = 0;
        let nights = 0;
        
        for (let i = startHalfDays; i < endHalfDays; i++) {
            // If i is even (morning) and i+1 is within range, count a day (morning to evening)
            if (i % 2 === 0 && i + 1 <= endHalfDays) {
                days++;
            }
            
            // If i is odd (evening) and i+1 is within range, count a night (evening to morning)
            if (i % 2 === 1 && i + 1 <= endHalfDays) {
                nights++;
            }
        }
        
        return { days, nights };
    }

    // Function to format label text based on days and nights
    function formatLabelText(days, nights) {
        let labelText = '';
        if (days > 0) {
            labelText += `${days} day${days !== 1 ? 's' : ''}`;
        }
        if (days > 0 && nights > 0) {
            labelText += ', ';
        }
        if (nights > 0) {
            labelText += `${nights} night${nights !== 1 ? 's' : ''}`;
        }
        
        // Only return 'Booking' for very short stays (less than half a day)
        return labelText || 'Booking';
    }

    // Function to add a booking bar to a row
    function addBookingBar(booking, row) {
        const startIndex = findDateIndex(booking.startDate);
        const endIndex = findDateIndex(booking.endDate);
        
        if (startIndex === -1 || endIndex === -1) return null;
        
        // Calculate position based on date and period (morning/evening)
        const halfCellWidth = getCellWidth() / 2; // Each half (morning/evening) is half the cell width
        const cellWidth = getCellWidth();
        const startOffset = startIndex * cellWidth + (booking.startPeriod === 'evening' ? halfCellWidth : 0);
        const endOffset = endIndex * cellWidth + (booking.endPeriod === 'evening' ? halfCellWidth * 2 : halfCellWidth);
        const width = endOffset - startOffset;
        
        // Use the common calculation function
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
        bar.dataset.originalRight = `${startOffset + width}`; // Store original right position for left handle resizing
        
        // Add the bar label showing days and nights
        const label = document.createElement('span');
        label.textContent = formatLabelText(days, nights);
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
        
        // Add mouse and touch event listeners
        leftHandle.addEventListener('mousedown', handleResizeStart);
        rightHandle.addEventListener('mousedown', handleResizeStart);
        
        // Add touch events for mobile
        leftHandle.addEventListener('touchstart', handleTouchResizeStart, { passive: false });
        rightHandle.addEventListener('touchstart', handleTouchResizeStart, { passive: false });
        
        row.appendChild(bar);
        
        // Return the created bar element
        return bar;
    }
    
    // Helper function to get the current cell width based on viewport
    function getCellWidth() {
        // Check if we're on mobile
        if (window.innerWidth <= 480) {
            return 60; // Small mobile
        } else if (window.innerWidth <= 768) {
            return 70; // Regular mobile/tablet
        } else {
            return 100; // Desktop
        }
    }
    
    // Resize functionality
    let resizingElement = null;
    let resizeType = null; // 'left' or 'right'
    let initialWidth = 0;
    let initialLeft = 0;
    let initialClientX = 0;
    let lastHighlightedElement = null; // Keep track of last highlighted element
    
    function handleResizeStart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        resizingElement = e.target.parentElement;
        resizeType = e.target.classList.contains('left-handle') ? 'left' : 'right';
        
        // Add resizing class to apply visual effect
        resizingElement.classList.add('resizing');
        
        // Add active class to the handle
        e.target.classList.add('active');
        
        const rect = resizingElement.getBoundingClientRect();
        initialWidth = rect.width;
        initialLeft = parseInt(resizingElement.style.left);
        initialClientX = e.clientX;
        
        // Make sure originalRight is set for left handle dragging
        if (resizeType === 'left' && !resizingElement.dataset.originalRight) {
            resizingElement.dataset.originalRight = `${initialLeft + initialWidth}`;
        }
        
        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
    }
    
    // Touch version of resize start
    function handleTouchResizeStart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.touches.length !== 1) return; // Only handle single touch
        
        resizingElement = e.target.parentElement;
        resizeType = e.target.classList.contains('left-handle') ? 'left' : 'right';
        
        // Add resizing class to apply visual effect
        resizingElement.classList.add('resizing');
        
        // Add active class to the handle
        e.target.classList.add('active');
        
        const rect = resizingElement.getBoundingClientRect();
        initialWidth = rect.width;
        initialLeft = parseInt(resizingElement.style.left);
        initialClientX = e.touches[0].clientX;
        
        // Make sure originalRight is set for left handle dragging
        if (resizeType === 'left' && !resizingElement.dataset.originalRight) {
            resizingElement.dataset.originalRight = `${initialLeft + initialWidth}`;
        }
        
        // Create a transparent overlay to capture all touch events during resize
        const overlay = document.createElement('div');
        overlay.id = 'touch-capture-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.zIndex = '1000';
        overlay.style.backgroundColor = 'transparent';
        document.body.appendChild(overlay);
        
        document.addEventListener('touchmove', handleTouchResizeMove, { passive: false });
        document.addEventListener('touchend', handleTouchResizeEnd);
        document.addEventListener('touchcancel', handleTouchResizeEnd);
    }
    
    // Helper function to highlight target position in days header
    function highlightTargetPosition(position) {
        // Remove previous highlight if exists
        clearTargetHighlights();
        
        // Calculate which day and period (morning/evening) based on position
        const cellWidth = getCellWidth();
        const halfCellWidth = cellWidth / 2;
        
        const dayIndex = Math.floor(position / cellWidth);
        const isPeriodEvening = (position % cellWidth) >= halfCellWidth;
        
        // Find the corresponding day cell in the header
        const daysHeader = document.getElementById('days-header');
        const dayCell = daysHeader.children[dayIndex];
        
        if (dayCell) {
            // Find the correct half-day element (morning or evening)
            const targetPeriod = isPeriodEvening ? 'evening' : 'morning';
            
            // Format the date using the shared function
            const date = dates[dayIndex];
            const tooltipText = formatTooltipDate(date, targetPeriod);
            
            // Update the tooltip content on the active resize handle
            if (resizingElement) {
                const activeHandle = resizingElement.querySelector(resizeType === 'left' ? '.left-handle' : '.right-handle');
                if (activeHandle) {
                    activeHandle.setAttribute('data-tooltip', tooltipText);
                }
            }
            
            // For date headers, create temporary highlight elements if they don't exist
            if (!dayCell.querySelector('.day-part')) {
                // Create container for day parts if it doesn't exist
                if (!dayCell.querySelector('.day-parts-container')) {
                    const container = document.createElement('div');
                    container.className = 'day-parts-container';
                    container.style.position = 'absolute';
                    container.style.top = '0';
                    container.style.left = '0';
                    container.style.width = '100%';
                    container.style.height = '100%';
                    container.style.display = 'flex';
                    container.style.pointerEvents = 'none';
                    
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
            }
            
            // Find the target day part
            const dayPartsContainer = dayCell.querySelector('.day-parts-container') || dayCell;
            const targetDayPart = targetPeriod === 'evening' 
                ? dayPartsContainer.children[1] || dayPartsContainer.querySelector('.evening')
                : dayPartsContainer.children[0] || dayPartsContainer.querySelector('.morning');
            
            if (targetDayPart) {
                targetDayPart.classList.add('target-highlight');
                lastHighlightedElement = targetDayPart;
            }
            
            // Also highlight the cell part in the chart
            const dogId = resizingElement?.closest('.chart-row')?.dataset.dogId;
            if (dogId) {
                const chartRow = document.querySelector(`.chart-row[data-dog-id="${dogId}"]`);
                if (chartRow) {
                    const chartCell = chartRow.children[dayIndex];
                    if (chartCell) {
                        const targetCellPart = targetPeriod === 'evening' 
                            ? chartCell.children[1] 
                            : chartCell.children[0];
                        
                        if (targetCellPart) {
                            targetCellPart.classList.add('target-highlight');
                        }
                    }
                }
            }
        }
    }
    
    function handleResizeMove(e) {
        if (!resizingElement) return;
        
        const deltaX = e.clientX - initialClientX;
        
        if (resizeType === 'right') {
            // Resizing from right - adjust width
            const cellWidth = getCellWidth();
            const minimumWidth = cellWidth / 2; // Changed from full cell to half cell to match touch behavior
            
            const newWidth = Math.max(minimumWidth, initialWidth + deltaX);
            resizingElement.style.width = `${newWidth}px`;
            
            // Highlight target position in days header
            const right = initialLeft + newWidth;
            highlightTargetPosition(right);
            
            // Update the label text in real-time
            updateLabelTextDuringResize(initialLeft, right);
        } else {
            // Resizing from left - adjust left position and width
            const cellWidth = getCellWidth();
            const minimumWidth = cellWidth / 2; // Changed to match the right side
            
            // Use the original right position stored in the dataset
            const originalRight = parseInt(resizingElement.dataset.originalRight);
            
            // Calculate the new left position while ensuring the minimum width
            const maxLeft = originalRight - cellWidth / 2; // Ensure minimum width
            const newLeft = Math.min(maxLeft, initialLeft + deltaX);
            
            // Set the left position and calculate width to preserve original right boundary
            resizingElement.style.left = `${newLeft}px`;
            resizingElement.style.width = `${originalRight - newLeft}px`;
            
            // Highlight target position in days header
            highlightTargetPosition(newLeft);
            
            // Update the label text in real-time - use exact originalRight value
            updateLabelTextDuringResize(newLeft, originalRight);
        }
    }
    
    // Touch version of resize move
    function handleTouchResizeMove(e) {
        if (!resizingElement || e.touches.length !== 1) return;
        
        e.preventDefault(); // Prevent scrolling while resizing
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - initialClientX;
        
        if (resizeType === 'right') {
            // Resizing from right - adjust width
            const newWidth = Math.max(getCellWidth() / 2, initialWidth + deltaX); // Minimum width of half cell
            resizingElement.style.width = `${newWidth}px`;
            
            // Highlight target position in days header
            const right = initialLeft + newWidth;
            highlightTargetPosition(right);
            
            // Update the label text in real-time
            updateLabelTextDuringResize(initialLeft, right);
        } else {
            // Resizing from left - adjust left position and width
            const cellWidth = getCellWidth();
            
            // Use the original right position stored in the dataset
            const originalRight = parseInt(resizingElement.dataset.originalRight);
            
            // Calculate the new left position while ensuring the minimum width
            const maxLeft = originalRight - cellWidth / 2; // Ensure minimum width
            const newLeft = Math.min(maxLeft, initialLeft + deltaX);
            
            // Set the left position and calculate width to preserve original right boundary
            resizingElement.style.left = `${newLeft}px`;
            resizingElement.style.width = `${originalRight - newLeft}px`;
            
            // Highlight target position in days header
            highlightTargetPosition(newLeft);
            
            // Update the label text in real-time - use exact originalRight value
            updateLabelTextDuringResize(newLeft, originalRight);
        }
    }
    
    // Update the label text function during resize
    function updateLabelTextDuringResize(left, right) {
        if (!resizingElement) return;
        
        // Calculate days and nights based on current position
        const cellWidth = getCellWidth();
        const halfCellWidth = cellWidth / 2;
        
        // Calculate indices and periods based on pixel position
        let startIndex = Math.floor(left / cellWidth);
        let startPeriod;
        
        // Fix the startPeriod calculation to match endPeriod logic
        if (left % cellWidth === 0) {
            // If exactly on a cell boundary, it's morning of this day
            startPeriod = 'morning';
        } else if (left % cellWidth < halfCellWidth) {
            startPeriod = 'morning';
        } else {
            startPeriod = 'evening';
        }
        
        let endIndex = Math.floor(right / cellWidth);
        // Fix the endPeriod calculation to handle the boundary case correctly
        // This is important because when exactly at a half-cell boundary, it should be morning
        // instead of evening to correctly calculate days and nights
        let endPeriod;
        if (right % cellWidth === 0) {
            // If exactly on a cell boundary, it's morning of the next day
            endPeriod = 'morning';
        } else if (right % cellWidth <= halfCellWidth) {
            endPeriod = 'morning';
        } else {
            endPeriod = 'evening';
        }
        
        // Ensure valid indices
        startIndex = Math.max(0, Math.min(startIndex, dates.length - 1));
        endIndex = Math.max(0, Math.min(endIndex, dates.length - 1));
        
        // Use the common calculation function
        const { days, nights } = calculateDaysAndNights(startIndex, startPeriod, endIndex, endPeriod);
        
        // Update the label text
        const label = resizingElement.querySelector('span');
        if (label) {
            label.textContent = formatLabelText(days, nights);
            
            // Also update the label position to ensure it stays visible
            updateLabelPositionDuringResize(label);
        }
    }
    
    // Helper function to ensure label stays properly positioned during resize
    function updateLabelPositionDuringResize(label) {
        if (!label || !resizingElement) return;
        
        const barWidth = parseInt(resizingElement.style.width);
        
        // Ensure the label doesn't exceed bar width
        label.style.maxWidth = `${barWidth - 20}px`;
        
        // Make the label text fully visible or just show 'Booking' for very small widths
        if (barWidth < 60) {
            // For very small widths, we'll use a simplified label
            const daysNightsText = label.textContent;
            if (daysNightsText !== 'Booking') {
                label.dataset.fullText = daysNightsText; // Store full text
                label.textContent = 'Booking';
            }
        } else if (label.dataset.fullText) {
            // Restore the full text when there's enough space
            label.textContent = label.dataset.fullText;
            delete label.dataset.fullText;
        }
        
        // Make sure the text has appropriate boundaries
        label.style.width = 'auto';
        label.style.left = '10px';
        label.style.right = '10px';
    }
    
    // Create a reusable function for formatting dates in tooltips
    function formatTooltipDate(date, period) {
        const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
        const dayOfMonth = date.getDate();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = monthNames[date.getMonth()];
        const periodLabel = period === 'evening' ? '- Evening' : '- Morning';
        
        // Format like "Mon. 12 Jan Eve"
        return `${dayOfWeek}. ${dayOfMonth} ${monthName} ${periodLabel}`;
    }
    
    // Helper function to clear all highlights
    function clearTargetHighlights() {
        if (lastHighlightedElement) {
            lastHighlightedElement.classList.remove('target-highlight');
            lastHighlightedElement = null;
        }
        
        // Remove any temporary day parts containers
        document.querySelectorAll('.day-parts-container').forEach(container => {
            container.remove();
        });
        
        // Clear all cell-part highlights in the chart
        document.querySelectorAll('.cell-part.target-highlight').forEach(part => {
            part.classList.remove('target-highlight');
        });
    }
    
    function handleResizeEnd(e) {
        if (!resizingElement) return;
        
        // Remove resizing class to revert visual effect
        resizingElement.classList.remove('resizing');
        
        // Remove active class from the handles
        resizingElement.querySelectorAll('.resize-handle').forEach(handle => {
            handle.classList.remove('active');
        });
        
        // Clear any target highlights
        clearTargetHighlights();
        
        // Visually update the booking bar first, without actually changing the data
        const row = resizingElement.closest('.chart-row');
        const bookingId = parseInt(resizingElement.dataset.bookingId);
        const booking = bookings.find(b => b.id === bookingId);
        
        if (booking) {
            // Continue with updateBookingAfterResize logic
            updateBookingAfterResize();
        }
        
        // Clean up mouse events
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        resizingElement = null;
    }
    
    function handleTouchResizeEnd(e) {
        if (!resizingElement) return;
        
        // Remove resizing class to revert visual effect
        resizingElement.classList.remove('resizing');
        
        // Remove active class from the handles
        resizingElement.querySelectorAll('.resize-handle').forEach(handle => {
            handle.classList.remove('active');
        });
        
        // Clear any target highlights
        clearTargetHighlights();
        
        // Remove touch capture overlay
        const overlay = document.getElementById('touch-capture-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        // Visually update the booking bar first
        const row = resizingElement.closest('.chart-row');
        const bookingId = parseInt(resizingElement.dataset.bookingId);
        const booking = bookings.find(b => b.id === bookingId);
        
        if (booking) {
            updateBookingAfterResize();
        }
        
        // Clean up touch events
        document.removeEventListener('touchmove', handleTouchResizeMove);
        document.removeEventListener('touchend', handleTouchResizeEnd);
        document.removeEventListener('touchcancel', handleTouchResizeEnd);
        resizingElement = null;
    }
    
    // Extract the common resize end logic into a separate function
    function updateBookingAfterResize() {
        // Get row and calculate new dates based on position
        const row = resizingElement.closest('.chart-row');
        const bookingId = parseInt(resizingElement.dataset.bookingId);
        const booking = bookings.find(b => b.id === bookingId);
        
        if (booking) {
            const left = parseInt(resizingElement.style.left);
            const width = parseInt(resizingElement.style.width);
            
            // Store original booking data for potential restore
            const originalBooking = { ...booking };
            
            // Calculate new dates and periods based on resize type
            const cellWidth = getCellWidth();
            const halfCellWidth = cellWidth / 2;
            
            // Calculate new start position and period
            let newStartIndex = Math.floor(left / cellWidth);
            let newStartPeriod;
            if (left % cellWidth === 0) {
                newStartPeriod = 'morning';
            } else if (left % cellWidth < halfCellWidth) {
                newStartPeriod = 'morning';
            } else {
                newStartPeriod = 'evening';
            }
            
            // Ensure valid index
            newStartIndex = Math.max(0, Math.min(newStartIndex, dates.length - 1));
            
            // For end date/period, preserve the original when resizing left handle
            let newEndIndex, newEndPeriod;
            
            if (resizeType === 'left') {
                // When resizing left handle, keep the original end date and period
                newEndIndex = findDateIndex(booking.endDate);
                newEndPeriod = booking.endPeriod;
            } else {
                // When resizing right handle, calculate new end position and period
                const right = left + width;
                newEndIndex = Math.floor(right / cellWidth);
                
                if (right % cellWidth === 0) {
                    newEndPeriod = 'morning';
                } else if (right % cellWidth <= halfCellWidth) {
                    newEndPeriod = 'morning';
                } else {
                    newEndPeriod = 'evening';
                }
                
                // Ensure valid index
                newEndIndex = Math.max(0, Math.min(newEndIndex, dates.length - 1));
            }
            
            // Apply visual changes to the booking bar (without committing to data yet)
            booking.startDate = formatDate(dates[newStartIndex]);
            booking.startPeriod = newStartPeriod;
            booking.endDate = formatDate(dates[newEndIndex]);
            booking.endPeriod = newEndPeriod;
            
            // Remove old bar and add updated one for visual feedback
            resizingElement.remove();
            const newBar = addBookingBar(booking, row);
            
            // Now show the confirmation snackbar - pass the resizeType explicitly
            showSnackbarModal(booking, originalBooking, row, newBar, resizeType);
        }
    }
    
    // Snackbar modal functionality
    function showSnackbarModal(tempBooking, originalBooking, row, barElement, currentResizeType) {
        const modal = document.getElementById('snackbar-modal');
        const overlay = document.getElementById('modal-overlay');
        const dateDisplay = document.getElementById('date-display');
        const snackbarTitle = document.getElementById('snackbar-title');
        const approveBtn = document.getElementById('approve-btn');
        const cancelBtn = document.getElementById('cancel-btn');
        
        // Format the date using the same formatting we use for tooltips
        const { days, nights } = calculateDaysAndNights(
            findDateIndex(tempBooking.startDate), 
            tempBooking.startPeriod, 
            findDateIndex(tempBooking.endDate), 
            tempBooking.endPeriod
        );
        
        // Use the exact same dates from the dates array used in the Gantt chart
        const startIndex = findDateIndex(tempBooking.startDate);
        const endIndex = findDateIndex(tempBooking.endDate);
        
        // Get the exact dates from the array
        const startDateObj = dates[startIndex];
        const endDateObj = dates[endIndex];
        
        // Use the shared tooltip formatting with the exact dates from the array
        const startDateText = formatTooltipDate(startDateObj, tempBooking.startPeriod);
        const endDateText = formatTooltipDate(endDateObj, tempBooking.endPeriod);
        
        // Use the explicitly passed resize type instead of relying on the active class
        // which might have been removed by this point
        const resizeType = currentResizeType || 'right'; // Default to right if not specified
        
        // Store which date is being edited
        dateDisplay.dataset.editingSide = resizeType === 'left' ? 'start' : 'end';
        
        // Show only the specific date that was changed
        if (dateDisplay.dataset.editingSide === 'start') {
            dateDisplay.textContent = startDateText;
        } else {
            dateDisplay.textContent = endDateText;
        }
        
        // Get the dog name from the row
        const dogId = row.dataset.dogId;
        const dogElement = document.querySelector(`.dog-row[data-dog-id="${dogId}"]`);
        const dogName = dogElement ? dogElement.textContent.trim() : `Dog #${dogId}`;
        
        // Set the title with the dog name and check-in/out text
        const actionType = dateDisplay.dataset.editingSide === 'start' ? 'Check in' : 'Check out';
        snackbarTitle.textContent = `${dogName} - ${actionType}`;
        
        // Store the date information for the date picker
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
        approveBtn.onclick = function() {
            // Changes are already applied visually and to the data
            // Just hide the modal
            hideSnackbarModal();
        };
        
        cancelBtn.onclick = function() {
            // Revert to original booking data
            Object.assign(tempBooking, originalBooking);
            
            // Remove the current bar
            if (barElement) {
                barElement.remove();
            } else {
                const existingBar = row.querySelector(`.booking-bar[data-booking-id="${originalBooking.id}"]`);
                if (existingBar) {
                    existingBar.remove();
                }
            }
            
            // Add original bar back
            addBookingBar(originalBooking, row);
            
            // Hide the modal
            hideSnackbarModal();
        };
        
        // Date picker functionality
        dateDisplay.onclick = function() {
            // Show date picker above the snackbar
            showDatePicker(this, tempBooking, row, this.dataset.editingSide);
        };
    }
    
    function showDatePicker(dateElement, booking, row, editingSide) {
        const datePicker = document.getElementById('date-picker');
        const datePickerGrid = document.getElementById('date-picker-grid');
        const datePickerClose = document.getElementById('date-picker-close');
        // Use explicitly passed editingSide or get from dataset
        editingSide = editingSide || dateElement.dataset.editingSide; // 'start' or 'end'
        
        // Position the date picker over the date display
        datePicker.style.display = 'block';
        
        // Get current date from the dates array using the index from findDateIndex
        const dateIndex = findDateIndex(editingSide === 'start' ? booking.startDate : booking.endDate);
        const currentDate = dates[dateIndex];
        
        // Get current period
        const currentPeriod = editingSide === 'start' ? 
            booking.startPeriod : 
            booking.endPeriod;
        
        // Update period selection
        const periodOptions = document.querySelectorAll('.period-option');
        periodOptions.forEach(option => {
            if (option.dataset.period === currentPeriod) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
            
            // Add click event to period options
            option.onclick = function() {
                // Remove selected class from all options
                periodOptions.forEach(opt => opt.classList.remove('selected'));
                // Add selected class to clicked option
                this.classList.add('selected');
                
                // Update the booking period
                if (editingSide === 'start') {
                    booking.startPeriod = this.dataset.period;
                } else {
                    booking.endPeriod = this.dataset.period;
                }
                
                // Update the date display
                const dateObj = new Date(editingSide === 'start' ? booking.startDate : booking.endDate);
                dateElement.textContent = formatTooltipDate(dateObj, this.dataset.period);
                
                // Update the snackbar title to match the correct check-in/out state
                const snackbarTitle = document.getElementById('snackbar-title');
                const dogId = row.dataset.dogId;
                const dogElement = document.querySelector(`.dog-row[data-dog-id="${dogId}"]`);
                const dogName = dogElement ? dogElement.textContent.trim() : `Dog #${dogId}`;
                const actionType = editingSide === 'start' ? 'Check in' : 'Check out';
                snackbarTitle.textContent = `${dogName} - ${actionType}`;
                
                // Recreate the booking bar with updated data
                updateBookingBarWithNewDates(booking, row);
            };
        });
        
        // Clear existing grid
        datePickerGrid.innerHTML = '';
        
        // Generate calendar for the current month
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Create month header
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'];
        
        // Add day headers (S M T W T F S)
        const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'date-picker-day';
            dayHeader.textContent = day;
            dayHeader.style.fontWeight = 'bold';
            dayHeader.style.color = '#6c757d';
            datePickerGrid.appendChild(dayHeader);
        });
        
        // Get first day of the month
        const firstDay = new Date(year, month, 1).getDay();
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'date-picker-day';
            datePickerGrid.appendChild(emptyDay);
        }
        
        // Get number of days in the month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'date-picker-day';
            dayElement.textContent = i;
            
            // Highlight the current date
            if (i === currentDate.getDate()) {
                dayElement.classList.add('selected');
            }
            
            // Add click event to select a date
            dayElement.onclick = function() {
                // Remove selected class from all days
                document.querySelectorAll('.date-picker-day').forEach(day => {
                    if (day.textContent && !isNaN(parseInt(day.textContent))) {
                        day.classList.remove('selected');
                    }
                });
                
                // Add selected class to clicked day
                this.classList.add('selected');
                
                // Create a date at the beginning of the day to match dates array
                const newDate = new Date(year, month, parseInt(this.textContent));
                
                // Find the closest date in our dates array
                let closestDateIndex = -1;
                let minDiff = Infinity;
                
                dates.forEach((date, index) => {
                    const diff = Math.abs(date.getTime() - newDate.getTime());
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestDateIndex = index;
                    }
                });
                
                // Use the found date from our dates array
                if (closestDateIndex >= 0) {
                    const matchingDate = dates[closestDateIndex];
                    const formattedDate = formatDate(matchingDate);
                    
                    if (editingSide === 'start') {
                        booking.startDate = formattedDate;
                    } else {
                        booking.endDate = formattedDate;
                    }
                    
                    // Update the date display
                    const selectedPeriod = document.querySelector('.period-option.selected').dataset.period;
                    if (editingSide === 'start') {
                        booking.startPeriod = selectedPeriod;
                    } else {
                        booking.endPeriod = selectedPeriod;
                    }
                    
                    dateElement.textContent = formatTooltipDate(matchingDate, selectedPeriod);
                    
                    // Update the snackbar title to ensure it stays consistent
                    const snackbarTitle = document.getElementById('snackbar-title');
                    const dogId = row.dataset.dogId;
                    const dogElement = document.querySelector(`.dog-row[data-dog-id="${dogId}"]`);
                    const dogName = dogElement ? dogElement.textContent.trim() : `Dog #${dogId}`;
                    const actionType = editingSide === 'start' ? 'Check in' : 'Check out';
                    snackbarTitle.textContent = `${dogName} - ${actionType}`;
                    
                    // Recreate the booking bar with updated data
                    updateBookingBarWithNewDates(booking, row);
                }
            };
            
            datePickerGrid.appendChild(dayElement);
        }
        
        // Close button functionality
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
    }
    
    function updateBookingBarWithNewDates(booking, row) {
        // Remove existing bar
        const existingBar = row.querySelector(`.booking-bar[data-booking-id="${booking.id}"]`);
        if (existingBar) {
            existingBar.remove();
        }
        
        // Add updated bar
        addBookingBar(booking, row);
    }
    
    function hideSnackbarModal() {
        const modal = document.getElementById('snackbar-modal');
        const overlay = document.getElementById('modal-overlay');
        const datePicker = document.getElementById('date-picker');
        
        modal.style.display = 'none';
        overlay.style.display = 'none';
        datePicker.style.display = 'none';
    }
    
    // Initialize the Gantt chart
    renderDaysHeader();
    renderDogNames();
    renderGanttChart();
    
    // Fix for sticky header on scroll
    const ganttBody = document.querySelector('.gantt-body');
    const daysHeader = document.getElementById('days-header');
    
    // Synchronize horizontal scrolling
    ganttBody.addEventListener('scroll', function() {
        daysHeader.style.transform = `translateX(-${ganttBody.scrollLeft}px)`;
        updateLabelPositions();
    });
    
    // Setup resize event listener to handle responsive adjustments
    window.addEventListener('resize', updateLabelPositions);
}); 