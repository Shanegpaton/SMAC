/**
 * Formats odds to display with proper plus/minus signs
 * @param odds - The odds value (positive for underdog, negative for favorite)
 * @returns Formatted odds string with + or - prefix
 */
export function formatOdds(odds: number): string {
  if (odds > 0) {
    return `+${odds}`;
  } else if (odds < 0) {
    return odds.toString();
  } else {
    return '0';
  }
}
