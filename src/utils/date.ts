export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateKey(value?: string | null): string {
  if (!value) return '';

  const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return `${year}-${month}-${day}`;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return toDateInputValue(parsedDate);
}

export function formatDateBR(value?: string | null, fallback = '-'): string {
  const dateKey = getDateKey(value);
  if (!dateKey) return fallback;

  const [year, month, day] = dateKey.split('-');
  return `${day}/${month}/${year}`;
}
