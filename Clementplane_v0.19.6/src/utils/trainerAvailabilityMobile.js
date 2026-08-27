export function getMonthDays(refDate) {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  return Array.from(
    { length: lastDay },
    (_, index) => new Date(year, month, index + 1),
  );
}
