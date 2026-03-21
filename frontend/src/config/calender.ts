// src/config/calendar.ts

/**
 * Type definition for the Calendar Configuration
 * Writing an interface first is a TypeScript best practice. It ensures we 
 * always provide the correct data types (numbers, arrays) and helps your IDE 
 * (like VS Code) catch silly typos before the code even runs.
 */
export interface CalendarConfigType {
  workingDays: number[]; // Array of days. 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startHour: number;     // 24-hour format (e.g., 9 for 9 AM)
  endHour: number;       // 24-hour format (e.g., 17 for 5 PM)
  intervalMins: number;  // Interval between meeting slots in minutes (e.g., 30)
}

/**
 * Centralized configuration for the Availability Calendar.
 */
export const CALENDAR_CONFIG: CalendarConfigType = {
  // Default working days: Monday (1) through Friday (5)
  workingDays: [0, 1, 2, 3, 4, 5, 6], 
  
  // Starting at 9:00 AM (09:00)
  startHour: 9, 
  
  // Ending at 5:00 PM (17:00). 
  // This means the last slot generated will be BEFORE this hour (e.g. 16:30)
  endHour: 17,  
  
  // 30-minute intervals for interview/consultation slots
  intervalMins: 30, 
};
