export const formatDisplayDate = (value) => {
  if (!value) {
    return 'Not specified';
  }

  let parsedDate;

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    parsedDate = new Date(year, month - 1, day);
  } else {
    parsedDate = new Date(value);
  }

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};