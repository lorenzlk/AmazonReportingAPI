/**
 * Date Utilities
 * Helper functions for date formatting and manipulation
 * 
 * @module date-utils
 */

/**
 * Format date to YYYY-MM-DD
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date as YYYY-MM-DD
 * @returns {string} Today's date
 */
function getToday() {
  return formatDate(new Date());
}

/**
 * Get yesterday's date as YYYY-MM-DD
 * @returns {string} Yesterday's date
 */
function getYesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return formatDate(date);
}

/**
 * Get date N days ago as YYYY-MM-DD
 * @param {number} days - Number of days ago
 * @returns {string} Date N days ago
 */
function getDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

/**
 * Get first day of current month as YYYY-MM-DD
 * @returns {string} First day of month
 */
function getFirstDayOfMonth() {
  const date = new Date();
  date.setDate(1);
  return formatDate(date);
}

/**
 * Get last day of current month as YYYY-MM-DD
 * @returns {string} Last day of month
 */
function getLastDayOfMonth() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  return formatDate(date);
}

/**
 * Format timestamp to ISO string
 * @param {Date} date - Date to format
 * @returns {string} ISO timestamp
 */
function formatTimestamp(date = new Date()) {
  return date.toISOString();
}

/**
 * Parse date string to Date object
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Date} Date object
 */
function parseDate(dateStr) {
  return new Date(dateStr);
}

/**
 * Check if date string is valid
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid
 */
function isValidDate(dateStr) {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
}

/**
 * Get date range for last N days
 * @param {number} days - Number of days
 * @returns {Object} { startDate, endDate }
 */
function getDateRange(days) {
  return {
    startDate: getDaysAgo(days),
    endDate: getToday()
  };
}

/**
 * Format date for display (e.g., "November 3, 2025")
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateLong(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format date for display (e.g., "Nov 3, 2025")
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateShort(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get timezone abbreviation (e.g., "EST", "PST")
 * @returns {string} Timezone abbreviation
 */
function getTimezone() {
  const date = new Date();
  const tzString = date.toLocaleString('en-US', { timeZoneName: 'short' });
  const parts = tzString.split(' ');
  return parts[parts.length - 1];
}

/**
 * Convert date to specific timezone
 * @param {Date} date - Date to convert
 * @param {string} timezone - Timezone (e.g., 'America/New_York')
 * @returns {string} Formatted date string
 */
function toTimezone(date, timezone = 'America/New_York') {
  return date.toLocaleString('en-US', { timeZone: timezone });
}

module.exports = {
  formatDate,
  getToday,
  getYesterday,
  getDaysAgo,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  formatTimestamp,
  parseDate,
  isValidDate,
  getDateRange,
  formatDateLong,
  formatDateShort,
  getTimezone,
  toTimezone
};

