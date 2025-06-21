/**
 * Utility functions for date formatting in Vietnam timezone
 */

/**
 * Get current date in Vietnam timezone (UTC+7)
 * @returns {string} Date string in format "YYYY-MM-DD HH:mm:ss"
 */
export function getCurrentVietnamTime() {
  const now = new Date();
  const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
  return vietnamTime.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Get current date in Vietnam timezone with full ISO format
 * @returns {string} ISO string in Vietnam timezone
 */
export function getCurrentVietnamTimeISO() {
  const now = new Date();
  const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
  return vietnamTime.toISOString();
}

/**
 * Format a date to Vietnam timezone
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatToVietnamTime(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const vietnamTime = new Date(dateObj.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
  return vietnamTime.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Format a date to Vietnam timezone with full ISO format
 * @param {Date|string} date - Date to format
 * @returns {string} ISO string in Vietnam timezone
 */
export function formatToVietnamTimeISO(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const vietnamTime = new Date(dateObj.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
  return vietnamTime.toISOString();
}

/**
 * Get current date in Vietnam timezone for display
 * @returns {string} Date string in format "DD/MM/YYYY HH:mm:ss"
 */
export function getCurrentVietnamTimeDisplay() {
  const now = new Date();
  const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
  const day = String(vietnamTime.getUTCDate()).padStart(2, '0');
  const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0');
  const year = vietnamTime.getUTCFullYear();
  const hours = String(vietnamTime.getUTCHours()).padStart(2, '0');
  const minutes = String(vietnamTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(vietnamTime.getUTCSeconds()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
} 