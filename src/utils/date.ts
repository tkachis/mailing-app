export const isSameDay = (date1: Date, date2: Date): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  return d1.toISOString().split('T')[0] === d2.toISOString().split('T')[0];
};
