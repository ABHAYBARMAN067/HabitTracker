import { format } from 'date-fns';

// Habit entries represent a calendar date, not an instant in a timezone.
export const entryDateKey = (value) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  return format(new Date(value), 'yyyy-MM-dd');
};
