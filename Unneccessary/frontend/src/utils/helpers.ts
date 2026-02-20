// Utility helper functions for the BookForMe application

/**
 * Format date to Pakistani locale string
 */
export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-PK', options || {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time to 12-hour format
 */
export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format Pakistani phone number
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as +92 XXX XXXXXXX
  if (cleaned.startsWith('92')) {
    return `+92 ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  } else if (cleaned.startsWith('0')) {
    return `+92 ${cleaned.slice(1, 4)} ${cleaned.slice(4)}`;
  }
  
  return phone;
}

/**
 * Format currency in Pakistani Rupees
 */
export function formatCurrency(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`;
}

/**
 * Calculate time difference from now
 */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins} minute${diffInMins > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  return formatDate(dateString, { month: 'short', day: 'numeric' });
}

/**
 * Validate Pakistani phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  
  // Valid formats:
  // - 03XXXXXXXXX (11 digits)
  // - 923XXXXXXXXX (12 digits)
  // - +923XXXXXXXXX (with +)
  return /^(0|92)?3\d{9}$/.test(cleaned);
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate booking ID
 */
export function generateBookingId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `BK${timestamp}${random}`.toUpperCase();
}

/**
 * Check if slot is available based on current time
 */
export function isSlotAvailable(date: string, time: string): boolean {
  const slotDateTime = new Date(`${date}T${time}`);
  const now = new Date();
  
  // Slot must be in the future
  return slotDateTime > now;
}

/**
 * Get day of week from date string
 */
export function getDayOfWeek(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-PK', { weekday: 'long' }).toLowerCase();
}

/**
 * Check if venue is currently open
 */
export function isVenueOpen(operatingHours: any, currentDate?: Date): boolean {
  const now = currentDate || new Date();
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  if (!operatingHours || !operatingHours[dayOfWeek]) {
    return false;
  }
  
  const hours = operatingHours[dayOfWeek];
  if (!hours.enabled) {
    return false;
  }
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = hours.open.split(':').map(Number);
  const [closeHour, closeMin] = hours.close.split(':').map(Number);
  
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;
  
  return currentTime >= openTime && currentTime <= closeTime;
}

/**
 * Generate time slots for a given date
 */
export function generateTimeSlots(
  startTime: string = '08:00',
  endTime: string = '22:00',
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  while (currentMinutes < endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    currentMinutes += intervalMinutes;
  }
  
  return slots;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get category icon name
 */
export function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    futsal: 'ball',
    salon: 'scissors',
    gaming: 'gamepad',
    cinema: 'film',
    beach: 'umbrella',
  };
  
  return iconMap[category.toLowerCase()] || 'star';
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Convert Roman Urdu to English for NLU processing
 */
export function normalizeUrduInput(text: string): string {
  const romanUrduMap: Record<string, string> = {
    'slot hai': 'is slot available',
    'kitne baje': 'what time',
    'kitnay paise': 'how much price',
    'book karo': 'book',
    'cancel karo': 'cancel',
    'ok done': 'confirm',
    'theek hai': 'okay',
  };
  
  let normalized = text.toLowerCase();
  
  Object.entries(romanUrduMap).forEach(([urdu, english]) => {
    normalized = normalized.replace(new RegExp(urdu, 'gi'), english);
  });
  
  return normalized;
}
