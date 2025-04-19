import { formatDate, calculateDaysAndNights, formatLabelText, formatTooltipDate } from './utils/dateUtils.js';
import { renderDaysHeader, renderDogNames, renderGanttChart } from './render/renderMethods.js';
import { addBookingBar, updateBookingBarWithNewDates } from './booking/bookingMethods.js';
import { createInteractionManager } from './events/interactionHandlers.js';
import { createModalManager } from './modals/snackbarAndPicker.js';

// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables to store data from Supabase
    let dogs = [];
    let bookings = [];
    let dates = [];
    
    // Debug logger function to keep debugging consistent
    function debugLog(section, message, data) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[DEBUG][${timestamp}][${section}] ${message}`, data ? data : '');
    }
    
    // Show loading overlay
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Helper function to generate dates starting from either today or the earliest booking, whichever is earlier
    // and including the latest booking date to ensure all bookings are visible
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
    }

    // Helper function to find date index in our dates array
    function findDateIndex(dateStr) {
        return dates.findIndex(d => formatDate(d) === dateStr);
    }

    // Helper function to sort dogs by their next upcoming event
    function sortDogsByNextEvent(dogsArray, bookingsArray) {
        if (!bookingsArray || bookingsArray.length === 0) {
            return dogsArray;
        }

        // Get current date at the beginning of the day
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        // Create a map to store the next event date for each dog
        const dogNextEventMap = new Map();
        
        // For each dog, find their next event
        dogsArray.forEach(dog => {
            const dogBookings = bookingsArray.filter(b => b.dogId === dog.id);
            
            if (dogBookings.length === 0) {
                // No bookings for this dog, set to far future
                dogNextEventMap.set(dog.id, { date: new Date(8640000000000000), period: 'morning', type: 'none' });
                return;
            }
            
            // Find the earliest upcoming START or END date
            let nextEvent = { date: new Date(8640000000000000), period: 'morning', type: 'none' };
            
            dogBookings.forEach(booking => {
                const startDate = new Date(booking.startDate);
                const endDate = new Date(booking.endDate);
                
                // Convert date object to timestamp for easier comparison
                const now_ts = now.getTime();
                const start_ts = startDate.getTime();
                const end_ts = endDate.getTime();
                
                // Consider START dates that are today or in the future
                if (start_ts >= now_ts) {
                    const eventDate = {
                        date: startDate,
                        period: booking.startPeriod,
                        type: 'start'
                    };
                    
                    // Compare with current nextEvent
                    const current_ts = nextEvent.date.getTime();
                    if (start_ts < current_ts || 
                       (start_ts === current_ts && 
                       (eventDate.period === 'morning' && nextEvent.period === 'evening'))) {
                        nextEvent = eventDate;
                    }
                }
                
                // Consider END dates that are today or in the future
                if (end_ts >= now_ts) {
                    const eventDate = {
                        date: endDate,
                        period: booking.endPeriod,
                        type: 'end'
                    };
                    
                    // Compare with current nextEvent
                    const current_ts = nextEvent.date.getTime();
                    if (end_ts < current_ts || 
                       (end_ts === current_ts && 
                       (eventDate.period === 'morning' && nextEvent.period === 'evening'))) {
                        nextEvent = eventDate;
                    }
                }
            });
            
            dogNextEventMap.set(dog.id, nextEvent);
        });
        
        // Sort dogs by next event date and period
        return dogsArray.sort((a, b) => {
            const aNextEvent = dogNextEventMap.get(a.id);
            const bNextEvent = dogNextEventMap.get(b.id);
            
            // Compare dates first
            const dateA = aNextEvent.date.getTime();
            const dateB = bNextEvent.date.getTime();
            
            if (dateA !== dateB) {
                return dateA - dateB;
            }
            
            // If dates are the same, morning comes before evening
            if (aNextEvent.period !== bNextEvent.period) {
                return aNextEvent.period === 'morning' ? -1 : 1;
            }
            
            // If periods are the same, start comes before end
            if (aNextEvent.type !== bNextEvent.type) {
                return aNextEvent.type === 'start' ? -1 : 1;
            }
            
            // If everything is equal, preserve original order
            return 0;
        });
    }

    // Create the interaction manager with all required dependencies
    function setupInteractionManager() {
        return createInteractionManager({
            dates,
            formatTooltipDate,
            calculateDaysAndNights,
            formatLabelText,
            updateBookingAfterResize: function(resizeInfo) {
                // This function handles what happens after resizing ends
                if (!resizeInfo.element) return;
                
                // Get the row and booking ID
                const row = resizeInfo.element.closest('.chart-row');
                const bookingId = parseInt(resizeInfo.element.dataset.bookingId);
                
                // Get the dogId from the row to ensure we're updating the correct dog's booking
                const dogId = parseInt(row.dataset.dogId);
                
                // Get the dog object for better logging
                const dog = dogs.find(d => d.id === dogId);
                const dogName = dog ? dog.name : 'Unknown';
                
                debugLog('BOOKING_UPDATE', `Starting update for booking ${bookingId} of dog ${dogName} (${dogId})`, {
                    bookingId,
                    dogId,
                    dogName,
                    resizeType: resizeInfo.type,
                    position: {
                        left: resizeInfo.currentLeft,
                        width: resizeInfo.currentWidth
                    }
                });
                
                // Find the booking with matching ID AND matching dogId
                const booking = bookings.find(b => b.id === bookingId && b.dogId === dogId);
                
                if (!booking) {
                    debugLog('BOOKING_ERROR', `Could not find booking with id ${bookingId} and dogId ${dogId}`);
                    
                    // Log all bookings that match either ID OR dogID to help diagnose the issue
                    const matchingByID = bookings.filter(b => b.id === bookingId);
                    const matchingByDog = bookings.filter(b => b.dogId === dogId);
                    
                    debugLog('BOOKING_DEBUG', `Bookings with ID ${bookingId}:`, matchingByID);
                    debugLog('BOOKING_DEBUG', `All bookings for dog ${dogName}:`, matchingByDog);
                    
                    return;
                }
                
                if (!row) {
                    debugLog('BOOKING_ERROR', 'Invalid row for resize update');
                    return;
                }
                
                // Store original booking data for potential restore
                const originalBooking = { ...booking };
                debugLog('BOOKING_STATE', 'Original booking state:', originalBooking);
                
                // Calculate new start/end based on pixel positions
                const left = resizeInfo.currentLeft;
                const width = resizeInfo.currentWidth;
                const cellWidth = getCellWidth();
                const halfCellWidth = cellWidth / 2;
                
                // Calculate indices and periods
                let newStartIndex = Math.floor(left / cellWidth);
                let newStartPeriod = (left % cellWidth < halfCellWidth) ? 'morning' : 'evening';
                
                let newEndIndex, newEndPeriod;
                if (resizeInfo.type === 'left') {
                    // When left handle was resized, keep original end
                    newEndIndex = findDateIndex(booking.endDate);
                    newEndPeriod = booking.endPeriod;
                } else if (resizeInfo.type === 'right') {
                    // When right handle was resized, calculate new end
                    const right = left + width;
                    newEndIndex = Math.floor(right / cellWidth);
                    newEndPeriod = (right % cellWidth < halfCellWidth) ? 'morning' : 'evening';
                } else if (resizeInfo.type === 'drag') {
                    // Note: Drag functionality has been removed as per new requirements
                    // This code is kept for compatibility with the existing system
                    // Calculate the original width in days
                    const originalStartIndex = findDateIndex(booking.startDate);
                    const originalEndIndex = findDateIndex(booking.endDate);
                    const daysDiff = originalEndIndex - originalStartIndex;
                    
                    // Apply the same offset to both start and end
                    newEndIndex = newStartIndex + daysDiff;
                    // Keep the same end period as the original
                    newEndPeriod = booking.endPeriod;
                }
                
                // Ensure valid indices
                newStartIndex = Math.max(0, Math.min(newStartIndex, dates.length - 1));
                newEndIndex = Math.max(0, Math.min(newEndIndex, dates.length - 1));
                
                // Ensure minimum booking size (at least 2 periods)
                const isSmallBooking = newStartIndex === newEndIndex && newStartPeriod === newEndPeriod;
                if (isSmallBooking) {
                    if (newEndPeriod === 'morning') {
                        newEndPeriod = 'evening';
                    } else {
                        newEndIndex = Math.min(newEndIndex + 1, dates.length - 1);
                        newEndPeriod = 'morning';
                    }
                }
                
                // Apply changes to booking using consistent date formatting
                booking.startDate = formatDate(dates[newStartIndex]);
                booking.startPeriod = newStartPeriod;
                booking.endDate = formatDate(dates[newEndIndex]);
                booking.endPeriod = newEndPeriod;
                
                debugLog('BOOKING_STATE', 'Updated booking state:', {
                    bookingId: booking.id,
                    dogId: booking.dogId,
                    dogName,
                    startDate: booking.startDate,
                    startPeriod: booking.startPeriod,
                    endDate: booking.endDate,
                    endPeriod: booking.endPeriod
                });
                
                // Remove old bar
                resizeInfo.element.remove();
                
                // Add updated bar - need to pass the event handlers for proper rebinding
                const newBar = addBookingBarWithDependencies(booking, row);
                
                // Show confirmation dialog for the booking change
                modalManager.showSnackbarModal(booking, originalBooking, row, newBar, resizeInfo.type);
                
                // Log the full state of all bookings after this change
                debugLog('BOOKING_UPDATE', 'Updated booking. Current booking state for all dogs:');
                dogs.forEach(dog => {
                    const dogBookings = bookings.filter(b => b.dogId === dog.id);
                    debugLog('DOG_DATA', `Dog ${dog.name} (ID: ${dog.id}) has ${dogBookings.length} bookings after update:`);
                    dogBookings.forEach(b => {
                        debugLog('BOOKING', '', {
                            dogId: dog.id, 
                            dogName: dog.name,
                            bookingId: b.id, 
                            period: `${b.startDate}(${b.startPeriod}) to ${b.endDate}(${b.endPeriod})`
                        });
                    });
                });
            }
        });
    }
    
    // Helper function that wraps addBookingBar with the necessary dependencies
    function addBookingBarWithDependencies(booking, row) {
        return addBookingBar(
            booking, 
            row, 
            dates, 
            interactionManager.handleResizeStart,
            interactionManager.handleTouchResizeStart
        );
    }
    
    // Helper function that wraps updateBookingBarWithNewDates with the necessary dependencies
    function updateBookingBarWithDependencies(booking, row) {
        return updateBookingBarWithNewDates(
            booking,
            row,
            dates,
            interactionManager.handleResizeStart,
            interactionManager.handleTouchResizeStart
        );
    }

    // Create the modal manager with its dependencies
    let modalManager;
    function setupModalManager() {
        modalManager = createModalManager({
            dates,
            updateBookingBarWithNewDates: function(booking, row) {
                return updateBookingBarWithDependencies(booking, row);
            }
        });
        
        // Register the showBookingDetails function globally so it can be accessed by the booking bars
        window.showBookingDetails = function(booking, row) {
            modalManager.showBookingDetailModal(booking, row);
        };
    }
    
    // Variable to track filtered dogs
    let filteredDogs = [];
    
    // Setup search filter functionality
    function setupSearchFilter() {
        const searchInput = document.getElementById('dog-search');
        const clearButton = document.getElementById('clear-search');
        
        // Initial set of filtered dogs is all dogs
        filteredDogs = [...dogs];
        
        if (!searchInput || !clearButton) {
            console.error('Search elements not found');
            return;
        }
        
        // Function to filter dogs by search term
        function filterDogs(searchTerm) {
            if (!searchTerm || searchTerm.trim() === '') {
                // If search is empty, show all dogs
                filteredDogs = [...dogs];
            } else {
                // Convert search term to lowercase for case-insensitive matching
                const term = searchTerm.toLowerCase();
                
                // Filter dogs by name matching the search term
                filteredDogs = dogs.filter(dog => {
                    const nameMatch = dog.name.toLowerCase().includes(term);
                    
                    // Additional filter criteria can be added here if needed
                    // For example, if dogs have other properties like breed, owner, etc.
                    // const breedMatch = dog.breed?.toLowerCase().includes(term);
                    // const ownerMatch = dog.owner?.toLowerCase().includes(term);
                    
                    // Return true if any criteria matches
                    return nameMatch; // || breedMatch || ownerMatch;
                });
            }
            
            // Re-render the UI with filtered dogs
            renderDogNames(filteredDogs);
            renderGanttChart(filteredDogs, dates, bookings, addBookingBarWithDependencies);
            
            // Update debug count
            debugLog('SEARCH', `Found ${filteredDogs.length} dogs matching criteria`, { searchTerm });
        }
        
        // Handle input events on search box
        searchInput.addEventListener('input', event => {
            const searchTerm = event.target.value;
            filterDogs(searchTerm);
            
            // Show/hide clear button based on if there's text
            if (searchTerm && searchTerm.trim() !== '') {
                clearButton.style.display = 'block';
            } else {
                clearButton.style.display = 'none';
            }
        });
        
        // Handle clear button click
        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            filterDogs('');
            clearButton.style.display = 'none';
            searchInput.focus();
        });
        
        // Handle keyboard event to clear search with ESC key
        searchInput.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                searchInput.value = '';
                filterDogs('');
                clearButton.style.display = 'none';
            }
        });
    }
    
    // Helper function to get current cell width based on viewport
    function getCellWidth() {
        if (window.innerWidth <= 480) {
            return 60; // Small mobile
        } else if (window.innerWidth <= 768) {
            return 70; // Regular mobile/tablet
        }
        return 100; // Desktop
    }
    
    let interactionManager;
    
    // Helper function that updates label positions on scroll or resize
    function updateLabelPositions() {
        document.querySelectorAll('.booking-bar').forEach(bar => {
            const barWidth = parseInt(bar.style.width);
            const label = bar.querySelector('span');
            if (label) {
                label.style.maxWidth = `${barWidth - 20}px`;
                
                // Show abbreviated label for small widths
                if (barWidth < 60) {
                    if (label.textContent !== 'Booking') {
                        label.dataset.fullText = label.textContent;
                        label.textContent = 'Booking';
                    }
                } else if (label.dataset.fullText) {
                    label.textContent = label.dataset.fullText;
                    delete label.dataset.fullText;
                }
            }
        });
    }
    
    // Initialize UI components
    function initializeUI() {
        // Validate DOM elements before initialization
        const requiredElements = [
            document.getElementById('days-header'),
            document.querySelector('.dogs-column'),
            document.getElementById('gantt-chart')
        ];
        
        if (requiredElements.some(el => !el)) {
            console.error('Required DOM elements not found.');
            return false;
        }
        
        try {
            // Set up managers
            interactionManager = setupInteractionManager();
            setupModalManager();
            
            // Set up search filter
            setupSearchFilter();
            
            // Render the UI components
            renderDaysHeader(dates);
            renderDogNames(filteredDogs);
            renderGanttChart(filteredDogs, dates, bookings, addBookingBarWithDependencies);
            
            // Set up scroll synchronization
            const ganttBody = document.querySelector('.gantt-body');
            const daysHeader = document.getElementById('days-header');
            
            if (ganttBody && daysHeader) {
                ganttBody.addEventListener('scroll', function() {
                    daysHeader.style.transform = `translateX(-${ganttBody.scrollLeft}px)`;
                    updateLabelPositions();
                });
                
                // Scroll to today's date
                scrollToToday(ganttBody);
            }
            
            // Set up window resize handler
            window.addEventListener('resize', updateLabelPositions);
            
            return true;
        } catch (error) {
            console.error('Error initializing UI:', error);
            return false;
        }
    }
    
    // Function to scroll to today's date
    function scrollToToday(ganttBody) {
        // Find today's column
        const now = new Date();
        const todayStr = formatDate(now);
        
        // Find today's index in dates array
        const todayIndex = dates.findIndex(date => formatDate(date) === todayStr);
        
        if (todayIndex >= 0) {
            // Get cell width for the calculation
            const cellWidth = getCellWidth();
            
            // Calculate how many cells can fit in the visible area
            const visibleWidth = ganttBody.clientWidth - 100; // Subtract dog column width
            const visibleCells = Math.floor(visibleWidth / cellWidth);
            
            // Calculate scroll position to center today with equal cells on each side
            // We want to position it so there are the same number of cells visible on either side
            const scrollPosition = Math.max(0, (todayIndex - Math.floor(visibleCells/2)) * cellWidth);
            
            // Set the scroll position
            ganttBody.scrollLeft = scrollPosition;
        }
    }
    
    // Helper function to update booking data for UX improvement requirements
    function updateBookingData() {
        // Check if there are any bookings to update
        if (!bookings || bookings.length === 0) {
            debugLog('BOOKING_UPDATE', 'No bookings to update');
            return;
        }
        
        debugLog('BOOKING_UPDATE', 'Starting booking data update');
        
        // First, ensure all bookings have unique IDs by checking for duplicates
        const bookingsByID = {};
        bookings.forEach(booking => {
            if (!bookingsByID[booking.id]) {
                bookingsByID[booking.id] = [];
            }
            bookingsByID[booking.id].push(booking);
        });
        
        // Check for duplicate IDs
        const duplicateIds = Object.keys(bookingsByID).filter(id => 
            bookingsByID[id].length > 1
        );
        
        if (duplicateIds.length > 0) {
            debugLog('BOOKING_WARNING', `Found ${duplicateIds.length} booking IDs with duplicates`);
            
            // For each ID with duplicates, log the details
            duplicateIds.forEach(id => {
                const duplicateBookings = bookingsByID[id];
                debugLog('BOOKING_WARNING', `Booking ID ${id} is used by ${duplicateBookings.length} bookings:`, 
                    duplicateBookings.map(b => ({
                        dogId: b.dogId,
                        startDate: b.startDate,
                        endDate: b.endDate
                    }))
                );
            });
        } else {
            debugLog('BOOKING_UPDATE', 'All booking IDs are unique');
        }
        
        // Continue with the original improvements
        // Generate date strings for today, a week ago, and 4 days from now
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        
        const fourDaysLater = new Date(today);
        fourDaysLater.setDate(today.getDate() + 4);
        
        // Format dates to match the expected format in the app
        const formattedWeekAgo = formatDate(weekAgo);
        const formattedFourDaysLater = formatDate(fourDaysLater);
        
        // 1. Make one booking start a week before today and end in 4 days
        // Find a booking to modify, preferably one with a dog that has more than one booking
        const dogBookingCounts = {};
        bookings.forEach(booking => {
            dogBookingCounts[booking.dogId] = (dogBookingCounts[booking.dogId] || 0) + 1;
        });
        
        // Find a dog with multiple bookings if possible
        const dogsWithMultipleBookings = Object.entries(dogBookingCounts)
            .filter(([_, count]) => count > 1)
            .map(([dogId, _]) => parseInt(dogId));
            
        // Select the first booking from a dog with multiple bookings or just the first booking
        const bookingToUpdate = dogsWithMultipleBookings.length > 0 
            ? bookings.find(b => b.dogId === dogsWithMultipleBookings[0])
            : bookings[0];
            
        if (bookingToUpdate) {
            // Log the booking before change
            debugLog('BOOKING_CHANGE', 'Modifying booking for long stay - BEFORE:', {
                bookingId: bookingToUpdate.id,
                dogId: bookingToUpdate.dogId,
                startDate: bookingToUpdate.startDate,
                startPeriod: bookingToUpdate.startPeriod,
                endDate: bookingToUpdate.endDate,
                endPeriod: bookingToUpdate.endPeriod
            });
            
            bookingToUpdate.startDate = formattedWeekAgo;
            bookingToUpdate.startPeriod = 'morning';
            bookingToUpdate.endDate = formattedFourDaysLater;
            bookingToUpdate.endPeriod = 'evening';
            bookingToUpdate.color = '#e67e22'; // Orange for visibility
            bookingToUpdate.notes = 'Long stay booking - 1 week+';
            
            // Log the booking after change
            debugLog('BOOKING_CHANGE', 'Modifying booking for long stay - AFTER:', {
                bookingId: bookingToUpdate.id,
                dogId: bookingToUpdate.dogId,
                startDate: bookingToUpdate.startDate,
                startPeriod: bookingToUpdate.startPeriod,
                endDate: bookingToUpdate.endDate,
                endPeriod: bookingToUpdate.endPeriod
            });
        }
        
        // 2. Change all 1-day bookings to multiple days
        bookings.forEach(booking => {
            // Skip the already modified booking
            if (booking === bookingToUpdate) return;
            
            const startDate = new Date(booking.startDate);
            const endDate = new Date(booking.endDate);
            
            // Check if this is a 1-day booking (same start and end date)
            if (formatDate(startDate) === formatDate(endDate)) {
                // Log the booking before change
                debugLog('BOOKING_CHANGE', 'Extending 1-day booking - BEFORE:', {
                    bookingId: booking.id,
                    dogId: booking.dogId,
                    startDate: booking.startDate,
                    startPeriod: booking.startPeriod,
                    endDate: booking.endDate,
                    endPeriod: booking.endPeriod
                });
                
                // Extend the booking by 2-3 days
                const daysToAdd = 2 + Math.floor(Math.random() * 2); // 2 or 3 days
                endDate.setDate(endDate.getDate() + daysToAdd);
                booking.endDate = formatDate(endDate);
                booking.endPeriod = Math.random() > 0.5 ? 'morning' : 'evening';
                booking.notes = `Extended ${daysToAdd}-day stay`;
                
                // Log the booking after change
                debugLog('BOOKING_CHANGE', 'Extending 1-day booking - AFTER:', {
                    bookingId: booking.id,
                    dogId: booking.dogId,
                    startDate: booking.startDate,
                    startPeriod: booking.startPeriod,
                    endDate: booking.endDate,
                    endPeriod: booking.endPeriod,
                    daysAdded: daysToAdd
                });
            }
        });
        
        debugLog('BOOKING_UPDATE', 'Booking data updated for UX improvements');
    }
    
    function showDataError(message) {
        if (loadingOverlay) {
            const loadingText = loadingOverlay.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = `Error: ${message}`;
                loadingText.style.color = '#dc3545';
            }
            
            const spinner = loadingOverlay.querySelector('.loading-spinner');
            if (spinner) {
                spinner.style.display = 'none';
            }
        }
    }
    
    // Expose drag handlers to window object for script.js to use
    window.appDragHandlers = {
        handleResizeStart: function() {
            // Will be replaced with actual implementation after initialization
            console.warn('Drag handlers accessed before initialization');
        },
        handleTouchResizeStart: function() {
            // Will be replaced with actual implementation after initialization
            console.warn('Touch handlers accessed before initialization');
        },
        getCellWidth: getCellWidth
    };
    
    // Helper function to initialize the application with real data from Supabase
    async function initializeWithRealData() {
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }
        
        try {
            // Wait for Supabase service to be available
            if (!window.supabaseService) {
                console.error('Supabase service not available');
                showDataError('Supabase service not initialized');
                return;
            }
            
            // Fetch dogs from Supabase
            dogs = await window.supabaseService.getAllDogs();
            
            // Fetch bookings from Supabase
            bookings = await window.supabaseService.getAllBookings();
            
            // Debug: Log each dog and its bookings
            debugLog('INIT', 'All dogs and their bookings:');
            dogs.forEach(dog => {
                const dogBookings = bookings.filter(b => b.dogId === dog.id);
                debugLog('DOG_DATA', `Dog ${dog.name} (ID: ${dog.id}) has ${dogBookings.length} bookings:`);
                dogBookings.forEach(booking => {
                    debugLog('BOOKING', '', {
                        dogId: dog.id, 
                        dogName: dog.name,
                        bookingId: booking.id, 
                        period: `${booking.startDate}(${booking.startPeriod}) to ${booking.endDate}(${booking.endPeriod})`
                    });
                });
            });
            
            // Generate dates after loading bookings
            dates = generateDates(bookings);
            
            // Sort dogs by next event
            dogs = sortDogsByNextEvent(dogs, bookings);
            
            // Initialize filtered dogs with all dogs
            filteredDogs = [...dogs];
            
            // Initialize UI with real data
            if (initializeUI()) {
                console.log('Dog daycare scheduler initialized successfully with real data.');
            } else {
                console.error('Failed to initialize the scheduler with real data.');
                showDataError('UI initialization failed');
            }
        } catch (error) {
            console.error('Error fetching real data:', error);
            showDataError('Error loading data');
        } finally {
            // Hide loading overlay
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
            }
        }
    }
    
    // Wait for page to load before initializing
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWithRealData);
    } else {
        initializeWithRealData();
    }
}); 