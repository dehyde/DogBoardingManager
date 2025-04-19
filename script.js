// Variables to store data
let dogs = [];
let bookings = [];
let dates = [];

// IMPORTANT: This file is being maintained for backward compatibility
// The main application logic has been moved to app.js which uses modules
// Do not initialize directly from this file

// Generate dates starting from either today or the earliest booking, whichever is earlier
function generateDates() {
    dates = [];
    
    // Default to today's date as the start
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day
    
    let startDate = today;
    
    // If we have bookings, check for the earliest date
    if (bookings && bookings.length > 0) {
        const earliestBookingDate = bookings.reduce((earliest, booking) => {
            const bookingStart = new Date(booking.startDate);
            return bookingStart < earliest ? bookingStart : earliest;
        }, new Date(bookings[0].startDate));
        
        // Use the earlier of today or the earliest booking date
        startDate = earliestBookingDate < today ? earliestBookingDate : today;
    }
    
    // Generate 31 days from the start date
    for (let i = 0; i < 31; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        dates.push(date);
    }
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
    daysHeader.innerHTML = ''; // Clear existing content
    
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
    dogsColumn.innerHTML = ''; // Clear existing content
    
    dogs.forEach(dog => {
        const dogRow = document.createElement('div');
        dogRow.className = 'dog-row';
        dogRow.dataset.dogId = dog.id;
        dogRow.textContent = dog.name;
        
        dogsColumn.appendChild(dogRow);
    });
}

// Function to initialize the application
async function initializeApp() {
    try {
        console.log('Legacy script.js initialization requested - deferring to app.js');
        // Let app.js handle initialization
        return;
        
        // All the legacy initialization code is kept commented out for reference
        /*
        console.log('Initializing application...');
        
        // Wait for appDragHandlers to be available (if using app.js)
        if (!window.appDragHandlers) {
            console.log('Waiting for drag handlers to be available...');
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (window.appDragHandlers) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                
                // Timeout after 3 seconds if handlers aren't available
                setTimeout(() => {
                    clearInterval(checkInterval);
                    console.warn('Drag handlers not available after timeout, proceeding without drag functionality');
                    resolve();
                }, 3000);
            });
        }
        
        // Fetch dogs from Supabase (read-only operation, no auth required)
        dogs = await supabaseService.getAllDogs();
        
        // Fetch bookings from Supabase (read-only operation, no auth required)
        bookings = await supabaseService.getAllBookings();
        
        // Generate dates AFTER loading bookings
        generateDates();
        
        // Render UI
        renderDaysHeader();
        renderDogNames();
        renderGanttChart();
        
        // Setup cell click handlers
        setupCellClickHandlers();
        
        // Add instructions
        addInstructions();
        console.log('Application initialized successfully!');
        */
    } catch (error) {
        console.error('Error initializing app:', error);
        alert('Error loading data. Please check your Supabase configuration.');
    }
}

// Expose the initialization function for Auth0 to call after authentication
window.initializeAppWithAuth = function(isAuthenticated, authToken, userProfile) {
    // Save authentication state
    window.isAuthenticated = isAuthenticated;
    window.authToken = authToken;
    window.userProfile = userProfile;
    
    // Do not initialize directly from here, defer to app.js
    console.log('Auth state received, deferring to app.js for initialization');
};

// Create a function to render the Gantt chart
function renderGanttChart() {
    const ganttChart = document.getElementById('gantt-chart');
    ganttChart.innerHTML = ''; // Clear existing content
    
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
            morningPart.dataset.dogId = dog.id;
            morningPart.dataset.date = formatDate(date);
            
            const eveningPart = document.createElement('div');
            eveningPart.className = 'cell-part evening';
            eveningPart.dataset.period = 'evening';
            eveningPart.dataset.dogId = dog.id;
            eveningPart.dataset.date = formatDate(date);
            
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

// Completely remove or comment out the initializeDemoData function
/*
async function initializeDemoData() {
    // Add demo dogs
    const demoDogs = [
        { name: '❤️ לולה' },
        { name: 'בני' },
        { name: 'צ׳רלי' },
        { name: 'לונה' },
        { name: 'קופר' },
        { name: 'יוכבד' },
        { name: 'באדי' },
        { name: 'טוסט' },
        { name: 'מילקי' },
        { name: 'אריאנה' }
    ];
    
    for (const dog of demoDogs) {
        await supabaseService.addDog(dog.name);
    }
    
    // We'll add bookings after dogs are created and IDs are assigned
    const createdDogs = await supabaseService.getAllDogs();
    
    // Create booking dates relative to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Helper function to format date as YYYY-MM-DD
    const formatDateString = (date) => {
        return date.toISOString().split('T')[0];
    };
    
    // Helper to create date with offset from today
    const createDate = (dayOffset) => {
        const date = new Date(today);
        date.setDate(today.getDate() + dayOffset);
        return formatDateString(date);
    };
    
    // Add demo bookings with dates relative to today
    const demoBookings = [
        { dogId: createdDogs[0].id, startDate: createDate(0), startPeriod: 'morning', endDate: createDate(4), endPeriod: 'evening', color: '#007bff' },
        { dogId: createdDogs[1].id, startDate: createDate(2), startPeriod: 'morning', endDate: createDate(7), endPeriod: 'evening', color: '#6f42c1' },
        { dogId: createdDogs[3].id, startDate: createDate(6), startPeriod: 'morning', endDate: createDate(11), endPeriod: 'evening', color: '#28a745' },
        { dogId: createdDogs[5].id, startDate: createDate(9), startPeriod: 'morning', endDate: createDate(14), endPeriod: 'evening', color: '#fd7e14' }
    ];
    
    for (const booking of demoBookings) {
        await supabaseService.addBooking(booking);
    }
}
*/

// Add click handler for cells to create new bookings
function setupCellClickHandlers() {
    const cellParts = document.querySelectorAll('.cell-part');
    cellParts.forEach(part => {
        part.addEventListener('click', function(e) {
            // Check if the user is authenticated before allowing booking creation
            if (!window.isAuthenticated) {
                console.log('User is not authenticated. Booking creation is disabled.');
                
                // Optionally show a message to the user
                const snackbar = document.getElementById('snackbar');
                if (snackbar) {
                    snackbar.textContent = 'Please log in to create bookings';
                    snackbar.className = 'show';
                    setTimeout(() => { snackbar.className = snackbar.className.replace('show', ''); }, 3000);
                }
                return;
            }
            
            // Get cell data
            const dogId = this.dataset.dogId;
            const date = this.dataset.date;
            const period = this.dataset.period;
            
            // Find the dog
            const dog = dogs.find(d => d.id === parseInt(dogId));
            if (!dog) {
                console.error('Dog not found:', dogId);
                return;
            }
            
            // Show modal to create a new booking
            const modal = document.getElementById('booking-modal');
            if (!modal) {
                console.warn('Booking modal not found');
                return;
            }
            
            // Set modal information
            const modalTitle = modal.querySelector('.modal-title');
            if (modalTitle) {
                modalTitle.textContent = `New Booking for ${dog.name}`;
            }
            
            // Set form values
            const form = modal.querySelector('form');
            if (form) {
                const dogInput = form.querySelector('#bookingDogId');
                const startDateInput = form.querySelector('#bookingStartDate');
                const startPeriodSelect = form.querySelector('#bookingStartPeriod');
                const endDateInput = form.querySelector('#bookingEndDate');
                const endPeriodSelect = form.querySelector('#bookingEndPeriod');
                
                if (dogInput) dogInput.value = dogId;
                if (startDateInput) startDateInput.value = date;
                if (startPeriodSelect) startPeriodSelect.value = period;
                if (endDateInput) endDateInput.value = date;
                if (endPeriodSelect) endPeriodSelect.value = period;
                
                // Show the modal
                modal.style.display = 'flex';
                
                // Handle submission
                form.onsubmit = async function(e) {
                    e.preventDefault();
                    
                    // Get form values
                    const formData = new FormData(form);
                    const bookingData = {
                        dogId: parseInt(formData.get('dogId')),
                        startDate: formData.get('startDate'),
                        startPeriod: formData.get('startPeriod'),
                        endDate: formData.get('endDate'),
                        endPeriod: formData.get('endPeriod'),
                        color: getRandomColor()
                    };
                    
                    try {
                        // Add booking to Supabase
                        const newBooking = await supabaseService.addBooking(bookingData);
                        
                        // Add booking to local data
                        bookings.push(newBooking);
                        
                        // Add booking bar to UI
                        const row = document.querySelector(`.chart-row[data-dog-id="${newBooking.dogId}"]`);
                        if (row) {
                            addBookingBar(newBooking, row);
                        }
                        
                        // Close modal
                        modal.style.display = 'none';
                    } catch (error) {
                        console.error('Error adding booking:', error);
                        alert('Failed to add booking. Please try again.');
                    }
                };
            }
        });
    });
}

// Generate a random color for new bookings
function getRandomColor() {
    const colors = ['#007bff', '#6f42c1', '#28a745', '#fd7e14', '#dc3545', '#20c997', '#6610f2', '#17a2b8'];
    return colors[Math.floor(Math.random() * colors.length)];
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
    
    // Connect with the module-based drag handlers if they exist
    if (window.appDragHandlers) {
        // Add event listeners for mouse and touch interactions
        leftHandle.addEventListener('mousedown', window.appDragHandlers.handleResizeStart);
        rightHandle.addEventListener('mousedown', window.appDragHandlers.handleResizeStart);
        leftHandle.addEventListener('touchstart', window.appDragHandlers.handleTouchResizeStart, { passive: false });
        rightHandle.addEventListener('touchstart', window.appDragHandlers.handleTouchResizeStart, { passive: false });
        
        // Add event listeners for dragging the entire booking
        bar.addEventListener('mousedown', window.appDragHandlers.handleResizeStart);
        bar.addEventListener('touchstart', window.appDragHandlers.handleTouchResizeStart, { passive: false });
    } else {
        console.warn('Drag handlers not available - dragging will not work');
    }
    
    row.appendChild(bar);
    
    // Return the created bar element
    return bar;
}

// Function to add onscreen instructions
function addInstructions() {
    // Only add instructions if they don't already exist
    if (!document.querySelector('.instructions')) {
        const instructionsDiv = document.createElement('div');
        instructionsDiv.className = 'instructions';
        instructionsDiv.innerHTML = `
            <p>Click on any cell to add a booking</p>
            <p>Drag a booking to move it</p>
            <p>Drag the edges of a booking to resize</p>
        `;
        document.body.appendChild(instructionsDiv);
        
        // Hide instructions after 5 seconds
        setTimeout(() => {
            instructionsDiv.style.opacity = '0';
            setTimeout(() => {
                instructionsDiv.remove();
            }, 1000);
        }, 5000);
    }
    
    // Update label positions for responsive display
    updateLabelPositions();
    
    // Update labels on window resize
    window.addEventListener('resize', debounce(updateLabelPositions, 100));
}

// Function to update all label positions
function updateLabelPositions() {
    console.log('Updating label positions for responsive display...');
    const bookingBars = document.querySelectorAll('.booking-bar');
    bookingBars.forEach(bar => {
        const label = bar.querySelector('span');
        if (label) {
            // Recalculate label position based on bar width
            const barWidth = bar.offsetWidth;
            if (barWidth < 80) { // If bar is too narrow
                label.style.fontSize = '0.65rem';
                // For very small bars, position label outside
                if (barWidth < 40) {
                    label.style.left = 'calc(100% + 5px)';
                    label.style.color = '#333';
                    label.style.textShadow = 'none';
                    label.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                    label.style.padding = '2px 4px';
                    label.style.borderRadius = '2px';
                    label.style.whiteSpace = 'nowrap';
                } else {
                    // For small but not tiny bars, center text but make it smaller
                    label.style.left = '50%';
                    label.style.transform = 'translateX(-50%)';
                    label.style.color = 'white';
                    label.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.3)';
                    label.style.backgroundColor = 'transparent';
                }
            } else {
                // For normal sized bars, standard styling
                label.style.fontSize = '';
                label.style.left = '10px';
                label.style.transform = '';
                label.style.color = 'white';
                label.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.3)';
                label.style.backgroundColor = 'transparent';
                label.style.padding = '';
                label.style.borderRadius = '';
                label.style.whiteSpace = '';
            }
        }
    });
}

// Debounce helper function to prevent excessive function calls
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// DOM content loaded event
document.addEventListener('DOMContentLoaded', async function() {
    // Don't initialize directly - defer to app.js
    console.log('Legacy script.js loaded - deferring initialization to app.js');
}); 