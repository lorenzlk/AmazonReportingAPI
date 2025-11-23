/**
 * Duplicate Detector
 * Checks for duplicate entries before inserting into Google Sheets
 * 
 * @module duplicate-detector
 */

/**
 * Check if a record already exists in the sheet data
 * @param {Object} newRecord - New record to check
 * @param {Array} existingRecords - Existing records from sheet
 * @param {Array} uniqueKeys - Fields that make a record unique (e.g., ['date', 'accountId'])
 * @returns {boolean} True if duplicate exists
 */
function isDuplicate(newRecord, existingRecords, uniqueKeys = ['date', 'accountId']) {
  if (!existingRecords || existingRecords.length === 0) {
    return false;
  }
  
  return existingRecords.some(existing => {
    // Check if all unique keys match
    return uniqueKeys.every(key => {
      return String(existing[key]).trim() === String(newRecord[key]).trim();
    });
  });
}

/**
 * Check if a row array already exists in sheet rows
 * @param {Array} newRow - New row to check [date, accountName, ...]
 * @param {Array} existingRows - Existing rows from sheet
 * @param {Array} keyIndexes - Column indexes that make a row unique (e.g., [0, 1] for date and account)
 * @returns {boolean} True if duplicate exists
 */
function isDuplicateRow(newRow, existingRows, keyIndexes = [0, 1]) {
  if (!existingRows || existingRows.length === 0) {
    return false;
  }
  
  return existingRows.some(existing => {
    // Check if all key columns match
    return keyIndexes.every(index => {
      return String(existing[index]).trim() === String(newRow[index]).trim();
    });
  });
}

/**
 * Filter out duplicate records from a batch
 * @param {Array} newRecords - Array of new records to insert
 * @param {Array} existingRecords - Existing records from sheet
 * @param {Array} uniqueKeys - Fields that make a record unique
 * @returns {Array} Filtered records (duplicates removed)
 */
function filterDuplicates(newRecords, existingRecords, uniqueKeys = ['date', 'accountId']) {
  if (!newRecords || newRecords.length === 0) {
    return [];
  }
  
  if (!existingRecords || existingRecords.length === 0) {
    return newRecords;
  }
  
  return newRecords.filter(newRecord => {
    return !isDuplicate(newRecord, existingRecords, uniqueKeys);
  });
}

/**
 * Filter out duplicate rows from a batch
 * @param {Array} newRows - Array of new rows to insert
 * @param {Array} existingRows - Existing rows from sheet
 * @param {Array} keyIndexes - Column indexes that make a row unique
 * @returns {Object} { filtered: Array, duplicates: Array }
 */
function filterDuplicateRows(newRows, existingRows, keyIndexes = [0, 1]) {
  if (!newRows || newRows.length === 0) {
    return { filtered: [], duplicates: [] };
  }
  
  if (!existingRows || existingRows.length === 0) {
    return { filtered: newRows, duplicates: [] };
  }
  
  const filtered = [];
  const duplicates = [];
  
  newRows.forEach(newRow => {
    if (isDuplicateRow(newRow, existingRows, keyIndexes)) {
      duplicates.push(newRow);
    } else {
      filtered.push(newRow);
    }
  });
  
  return { filtered, duplicates };
}

/**
 * Create a unique key for a record
 * @param {Object} record - Record object
 * @param {Array} keys - Keys to include in unique identifier
 * @returns {string} Unique key string
 */
function createUniqueKey(record, keys = ['date', 'accountId']) {
  return keys.map(key => String(record[key]).trim()).join('|');
}

/**
 * Build a set of existing unique keys for fast lookup
 * @param {Array} existingRecords - Existing records
 * @param {Array} keys - Keys to use for uniqueness
 * @returns {Set} Set of unique keys
 */
function buildUniqueKeySet(existingRecords, keys = ['date', 'accountId']) {
  const keySet = new Set();
  
  existingRecords.forEach(record => {
    const key = createUniqueKey(record, keys);
    keySet.add(key);
  });
  
  return keySet;
}

/**
 * Fast duplicate check using pre-built key set
 * @param {Object} newRecord - Record to check
 * @param {Set} uniqueKeySet - Pre-built set of unique keys
 * @param {Array} keys - Keys used to create unique identifier
 * @returns {boolean} True if duplicate
 */
function isDuplicateFast(newRecord, uniqueKeySet, keys = ['date', 'accountId']) {
  const key = createUniqueKey(newRecord, keys);
  return uniqueKeySet.has(key);
}

/**
 * Parse Google Sheets rows into record objects
 * @param {Array} rows - Raw rows from Sheets API
 * @param {Array} headers - Column headers (first row)
 * @returns {Array} Array of record objects
 */
function parseSheetRows(rows, headers) {
  if (!rows || rows.length === 0) return [];
  if (!headers || headers.length === 0) return [];
  
  return rows.map(row => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = row[index] || '';
    });
    return record;
  });
}

/**
 * Convert record object to row array
 * @param {Object} record - Record object
 * @param {Array} headers - Column headers in order
 * @returns {Array} Row array
 */
function recordToRow(record, headers) {
  return headers.map(header => record[header] || '');
}

module.exports = {
  isDuplicate,
  isDuplicateRow,
  filterDuplicates,
  filterDuplicateRows,
  createUniqueKey,
  buildUniqueKeySet,
  isDuplicateFast,
  parseSheetRows,
  recordToRow
};

