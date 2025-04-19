export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

export function calculateDaysAndNights(startIndex, startPeriod, endIndex, endPeriod) {
  // Handle case where start and end are the same - enforce minimum 2 periods (1 day or 1 night)
  if (startIndex === endIndex && startPeriod === endPeriod) {
    return startPeriod === 'morning' ? { days: 1, nights: 0 } : { days: 0, nights: 1 };
  }

  // Convert to half-days for calculation
  const startHalfDays = startIndex * 2 + (startPeriod === 'evening' ? 1 : 0);
  const endHalfDays = endIndex * 2 + (endPeriod === 'evening' ? 1 : 0);

  // If end is before start somehow, return minimum valid booking
  if (endHalfDays <= startHalfDays) {
    return startPeriod === 'morning' ? { days: 1, nights: 0 } : { days: 0, nights: 1 };
  }

  let days = 0;
  let nights = 0;
  for (let i = startHalfDays; i < endHalfDays; i++) {
    // If i is even (morning) and i+1 is within range, count a day
    if (i % 2 === 0 && i + 1 <= endHalfDays) {
      days++;
    }
    // If i is odd (evening) and i+1 is within range, count a night
    if (i % 2 === 1 && i + 1 <= endHalfDays) {
      nights++;
    }
  }

  // Ensure at least one day or one night
  if (days === 0 && nights === 0) {
    return startPeriod === 'morning' ? { days: 1, nights: 0 } : { days: 0, nights: 1 };
  }

  return { days, nights };
}

export function formatLabelText(days, nights) {
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
  return labelText || 'Booking';
}

export function formatTooltipDate(date, period) {
  // First ensure the date is a valid Date object
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Get consistent date components
  const dayOfWeekMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayOfWeek = dayOfWeekMap[dateObj.getDay()];
  const dayOfMonth = dateObj.getDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  
  // Clearly indicate the period
  const periodLabel = period === 'evening' ? 'Evening' : 'Morning';
  
  // Format the complete date with consistent information
  return `${dayOfWeek}. ${dayOfMonth} ${monthName} ${year} - ${periodLabel}`;
} 