import { formatDate } from '../utils/dateUtils.js';

export function renderDaysHeader(dates) {
  const daysHeader = document.getElementById('days-header');
  // Clear existing content if any
  daysHeader.innerHTML = '';
  
  // Get today's date and current time for comparison
  const now = new Date();
  const todayStr = formatDate(now);
  const isAfternoon = now.getHours() >= 12;
  
  dates.forEach(date => {
    const dayCell = document.createElement('div');
    dayCell.className = 'day-cell date-header';
    const dateStr = formatDate(date);
    dayCell.dataset.date = dateStr;
    
    // Check if this cell represents today
    if (dateStr === todayStr) {
      dayCell.classList.add('today-column');
    }
    
    const dayOfMonth = date.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    
    dayCell.textContent = dayOfMonth + ' ' + month;
    daysHeader.appendChild(dayCell);
  });
}

export function renderDogNames(dogs) {
  const dogsColumn = document.querySelector('.dogs-column');
  // Clear existing content if any
  dogsColumn.innerHTML = '';
  
  // Get current date for comparing next events
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  dogs.forEach(dog => {
    const dogRow = document.createElement('div');
    dogRow.className = 'dog-row';
    dogRow.dataset.dogId = dog.id;
    
    // Create a container for dog info (name + chips)
    const dogInfoContainer = document.createElement('div');
    dogInfoContainer.className = 'dog-info-container';
    
    // Create dog name span
    const nameSpan = document.createElement('span');
    nameSpan.className = 'dog-name';
    nameSpan.textContent = dog.name;
    dogInfoContainer.appendChild(nameSpan);
    
    // Create chips container
    const chipsContainer = document.createElement('div');
    chipsContainer.className = 'chips-container';
    
    // Add a chip to indicate if the dog has ongoing booking (priority display)
    if (dog.ongoingBooking) {
      const ongoingChip = document.createElement('span');
      ongoingChip.className = 'event-chip ongoing';
      ongoingChip.textContent = 'Active';
      chipsContainer.appendChild(ongoingChip);
    }
    
    // Create next event indicator (if provided in dog.nextEvent)
    if (dog.nextEvent) {
      const eventDate = new Date(dog.nextEvent);
      const nextEventChip = document.createElement('span');
      nextEventChip.className = 'event-chip';
      
      // Calculate difference in days
      const diffTime = Math.abs(eventDate - now);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Format the display differently depending on the timeframe
      let timeText;
      if (diffDays === 0) {
        timeText = 'Today';
        nextEventChip.classList.add('today');
      } else if (diffDays === 1) {
        timeText = 'Tomorrow';
        nextEventChip.classList.add('soon');
      } else if (diffDays <= 7) {
        timeText = `In ${diffDays} days`;
        nextEventChip.classList.add('upcoming');
      } else {
        timeText = `In ${diffDays} days`;
      }
      
      nextEventChip.textContent = timeText;
      chipsContainer.appendChild(nextEventChip);
    }
    
    // Add chips container to dog info container
    dogInfoContainer.appendChild(chipsContainer);
    
    // Add dog info container to row
    dogRow.appendChild(dogInfoContainer);
    
    dogsColumn.appendChild(dogRow);
  });
}

export function renderGanttChart(dogs, dates, bookings, addBookingBar) {
  const ganttChart = document.getElementById('gantt-chart');
  // Clear existing content if any
  ganttChart.innerHTML = '';
  
  // Get today's date and current time for comparison
  const now = new Date();
  const todayStr = formatDate(now);
  const isAfternoon = now.getHours() >= 12;
  
  dogs.forEach(dog => {
    const chartRow = document.createElement('div');
    chartRow.className = 'chart-row';
    chartRow.dataset.dogId = dog.id;
    
    // Create cell containers for each date
    dates.forEach(date => {
      const chartCell = document.createElement('div');
      chartCell.className = 'chart-cell';
      const dateStr = formatDate(date);
      chartCell.dataset.date = dateStr;
      
      // Check if this cell represents today
      if (dateStr === todayStr) {
        chartCell.classList.add('today-column');
      }
      
      // Create morning and evening parts
      const morningPart = document.createElement('div');
      morningPart.className = 'cell-part morning';
      morningPart.dataset.period = 'morning';
      
      // Add current-period class to the appropriate half-day
      if (dateStr === todayStr && !isAfternoon) {
        morningPart.classList.add('current-period');
      }
      
      const eveningPart = document.createElement('div');
      eveningPart.className = 'cell-part evening';
      eveningPart.dataset.period = 'evening';
      
      // Add current-period class to the appropriate half-day
      if (dateStr === todayStr && isAfternoon) {
        eveningPart.classList.add('current-period');
      }
      
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