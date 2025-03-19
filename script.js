document.addEventListener('DOMContentLoaded', function() {
    // Mock data
    const dogs = [
        { id: 1, name: 'Max' },
        { id: 2, name: 'Bella' },
        { id: 3, name: 'Charlie' },
        { id: 4, name: 'Luna' },
        { id: 5, name: 'Cooper' },
        { id: 6, name: 'Lucy' },
        { id: 7, name: 'Buddy' },
        { id: 8, name: 'Daisy' },
        { id: 9, name: 'Rocky' },
        { id: 10, name: 'Molly' }
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
    
    // Function to add a booking bar to a row
    function addBookingBar(booking, row) {
        const startIndex = findDateIndex(booking.startDate);
        const endIndex = findDateIndex(booking.endDate);
        
        if (startIndex === -1 || endIndex === -1) return;
        
        // Calculate position based on date and period (morning/evening)
        const halfCellWidth = 50; // Each half (morning/evening) is 50px
        const startOffset = startIndex * 100 + (booking.startPeriod === 'evening' ? halfCellWidth : 0);
        const endOffset = endIndex * 100 + (booking.endPeriod === 'evening' ? halfCellWidth * 2 : halfCellWidth);
        const width = endOffset - startOffset;
        
        // Calculate days and nights
        let days = 0;
        let nights = 0;
        
        // Convert to half-days for easier calculation
        const startHalfDays = startIndex * 2 + (booking.startPeriod === 'evening' ? 1 : 0);
        const endHalfDays = endIndex * 2 + (booking.endPeriod === 'evening' ? 1 : 0);
        
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
        
        // Add the bar label showing days and nights
        const label = document.createElement('span');
        
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
        
        label.textContent = labelText || 'Booking';
        bar.appendChild(label);
        
        // Add resize handles
        const leftHandle = document.createElement('div');
        leftHandle.className = 'resize-handle left-handle';
        bar.appendChild(leftHandle);
        
        const rightHandle = document.createElement('div');
        rightHandle.className = 'resize-handle right-handle';
        bar.appendChild(rightHandle);
        
        // Add resize event listeners
        leftHandle.addEventListener('mousedown', handleResizeStart);
        rightHandle.addEventListener('mousedown', handleResizeStart);
        
        row.appendChild(bar);
    }
    
    // Resize functionality
    let resizingElement = null;
    let resizeType = null; // 'left' or 'right'
    let initialWidth = 0;
    let initialLeft = 0;
    let initialClientX = 0;
    
    function handleResizeStart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        resizingElement = e.target.parentElement;
        resizeType = e.target.classList.contains('left-handle') ? 'left' : 'right';
        
        // Add resizing class to apply visual effect
        resizingElement.classList.add('resizing');
        
        const rect = resizingElement.getBoundingClientRect();
        initialWidth = rect.width;
        initialLeft = parseInt(resizingElement.style.left);
        initialClientX = e.clientX;
        
        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
    }
    
    function handleResizeMove(e) {
        if (!resizingElement) return;
        
        const deltaX = e.clientX - initialClientX;
        
        if (resizeType === 'right') {
            // Resizing from right - adjust width
            const newWidth = Math.max(100, initialWidth + deltaX); // Minimum width of 100px (1 day)
            resizingElement.style.width = `${newWidth}px`;
        } else {
            // Resizing from left - adjust left position and width
            const maxDelta = initialWidth - 100; // Ensure minimum width of 100px
            const boundedDeltaX = Math.min(maxDelta, Math.max(-initialLeft, deltaX));
            
            resizingElement.style.left = `${initialLeft + boundedDeltaX}px`;
            resizingElement.style.width = `${initialWidth - boundedDeltaX}px`;
        }
    }
    
    function handleResizeEnd(e) {
        if (!resizingElement) return;
        
        // Remove resizing class to revert visual effect
        resizingElement.classList.remove('resizing');
        
        // Get row and calculate new dates based on position
        const row = resizingElement.closest('.chart-row');
        const bookingId = parseInt(resizingElement.dataset.bookingId);
        const booking = bookings.find(b => b.id === bookingId);
        
        if (booking) {
            const left = parseInt(resizingElement.style.left);
            const width = parseInt(resizingElement.style.width);
            const right = left + width;
            
            // Calculate new dates and periods
            // Each cell is 100px, morning is first 50px, evening is second 50px
            const cellWidth = 100;
            const halfCellWidth = 50;
            
            let newStartIndex = Math.floor(left / cellWidth);
            let newStartPeriod = (left % cellWidth) < halfCellWidth ? 'morning' : 'evening';
            
            let newEndIndex = Math.floor(right / cellWidth);
            let newEndPeriod = (right % cellWidth) <= halfCellWidth ? 'morning' : 'evening';
            
            // Ensure valid indices
            newStartIndex = Math.max(0, Math.min(newStartIndex, dates.length - 1));
            newEndIndex = Math.max(0, Math.min(newEndIndex, dates.length - 1));
            
            // Update booking data
            booking.startDate = formatDate(dates[newStartIndex]);
            booking.startPeriod = newStartPeriod;
            booking.endDate = formatDate(dates[newEndIndex]);
            booking.endPeriod = newEndPeriod;
            
            // Remove old bar and add updated one
            resizingElement.remove();
            addBookingBar(booking, row);
        }
        
        // Clean up
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        resizingElement = null;
    }
    
    // Initialize the chart
    renderDaysHeader();
    renderDogNames();
    renderGanttChart();
    
    // Synchronize horizontal scrolling between header and body
    const ganttBody = document.querySelector('.gantt-body');
    const daysHeader = document.getElementById('days-header');
    const dogsColumn = document.querySelector('.dogs-column');
    
    // Function to update label positions
    function updateLabelPositions() {
        // Calculate dogs column right edge position
        const dogsColumnRightEdge = dogsColumn.getBoundingClientRect().right;
        
        // Update all booking bar labels for sticky behavior
        document.querySelectorAll('.booking-bar').forEach(bar => {
            const barLeftEdge = bar.getBoundingClientRect().left;
            const barRightEdge = bar.getBoundingClientRect().right;
            const barWidth = bar.offsetWidth;
            const label = bar.querySelector('span');
            
            // Calculate the visible portion of the bar
            const windowWidth = window.innerWidth;
            const visibleWidth = Math.min(barRightEdge, windowWidth) - Math.max(barLeftEdge, dogsColumnRightEdge);
            
            // Hide the label if the visible width is too small to display meaningful text
            if (visibleWidth < 40) { // 40px is a minimum threshold for displaying text
                label.style.display = 'none';
                return;
            } else {
                label.style.display = 'block';
            }
            
            // If bar starts before the dogs column edge
            if (barLeftEdge < dogsColumnRightEdge) {
                // Stick the label to the dogs column edge
                const newLeftPos = dogsColumnRightEdge - bar.getBoundingClientRect().left + 5;
                label.style.left = `${newLeftPos}px`;
                
                // Adjust max-width to ensure it doesn't exceed the bar's right edge
                const availableWidth = barWidth - newLeftPos - 10;
                label.style.maxWidth = availableWidth > 0 ? `${availableWidth}px` : '0';
            } else {
                // Default position at the left of the bar
                label.style.left = '10px';
                
                // Ensure label doesn't exceed bar width
                label.style.maxWidth = `${barWidth - 20}px`;
            }
            
            // Make sure the text has a right boundary to prevent it from exceeding the bar
            label.style.width = 'auto';
            label.style.right = '10px';
        });
    }
    
    // Update label positions on scroll
    ganttBody.addEventListener('scroll', function() {
        // Sync header scrolling
        daysHeader.scrollLeft = ganttBody.scrollLeft;
        
        // Update label positions
        updateLabelPositions();
    });
    
    // Update labels on initial load and window resize
    window.addEventListener('load', updateLabelPositions);
    window.addEventListener('resize', updateLabelPositions);
}); 