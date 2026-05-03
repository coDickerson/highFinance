export function getCurrentSemester(): string {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  if (month >= 8 && month <= 12) return `Fall ${year}`;
  if (month >= 1 && month <= 5) return `Spring ${year}`;
  return `Summer ${year}`;
}

export function getCalendarYear(): { year: number; label: string } {
  const year = new Date().getFullYear();
  return { year, label: String(year) };
}
