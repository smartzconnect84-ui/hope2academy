/**
 * id-generator.ts — deterministic, sequential ID generation for HOPE2 ACADEMY
 *
 * Formats
 *   Student ID    : H2A-YYYY-NNNN   e.g. H2A-2026-0001
 *   Admission No. : ADM-YYYY-NNNN   e.g. ADM-2026-0014
 *   Staff ID      : STF-YYYY-NNNN   e.g. STF-2026-0003
 *
 * Each generator scans an array of existing IDs for the current year,
 * finds the highest sequence number, and returns the next one.
 * Thread-safe within a single JS thread; for a real DB use a serial column.
 */

function nextInSequence(existing: string[], prefix: string): string {
  const nums = existing
    .filter((id) => typeof id === "string" && id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

/** Generate the next student ID (H2A-YYYY-NNNN) given existing IDs. */
export function generateStudentId(existingIds: string[] = []): string {
  const prefix = `H2A-${new Date().getFullYear()}-`;
  return nextInSequence(existingIds, prefix);
}

/** Generate the next admission number (ADM-YYYY-NNNN) given existing numbers. */
export function generateAdmissionNo(existingNos: string[] = []): string {
  const prefix = `ADM-${new Date().getFullYear()}-`;
  return nextInSequence(existingNos, prefix);
}

/** Generate the next staff ID (STF-YYYY-NNNN) given existing IDs. */
export function generateStaffId(existingIds: string[] = []): string {
  const prefix = `STF-${new Date().getFullYear()}-`;
  return nextInSequence(existingIds, prefix);
}
