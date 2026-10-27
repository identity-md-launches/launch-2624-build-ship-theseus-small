/** Six deterministic replacements. No time, randomness, or network is involved. */
export const MATERIALS = Object.freeze([
  { id: 'receipt', name: 'A very long receipt', statement: '“Apparently I am now a business expense.”', identity: 'Mostly ship. Slightly tax-deductible.', figure: 'One questionable repair.' },
  { id: 'cheese', name: 'Load-bearing cheese', statement: '“I am developing a distinctly continental list.”', identity: 'Structurally debatable. Delicious, though.', figure: 'Please keep refrigerated.' },
  { id: 'knitting', name: 'An unfinished scarf', statement: '“Someone has knitted me a midlife crisis.”', identity: 'Half original. Entirely overthinking it.', figure: 'A warmer kind of vessel.' },
  { id: 'thursday', name: 'The concept of Thursday', statement: '“I appear to be leaking into next week.”', identity: 'The calendar has entered the hull.', figure: 'Seaworthy on weekdays.' },
  { id: 'compliment', name: 'A secondhand compliment', statement: '“They said I had good bones. I don’t have bones.”', identity: 'Held together by something nice you said.', figure: 'Emotionally reinforced.' },
  { id: 'absence', name: 'A legally binding absence', statement: '“Not a single original plank. Still getting my mail.”', identity: 'Nothing original. The paperwork disagrees.', figure: 'A ship, by administrative decision.' }
]);

export const PLANK_COUNT = MATERIALS.length;
export const STORAGE_KEY = 'theseus.experiment.v1';

/** @param {number} count */
export function nextRepair(count) {
  return Math.min(PLANK_COUNT, validCount(count) + 1);
}

/** @param {number} count */
export function undoRepair(count) {
  return Math.max(0, validCount(count) - 1);
}

/** @param {unknown} value */
function validCount(value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= PLANK_COUNT ? value : 0;
}

/** Ignore incompatible, corrupted, oversized or out-of-range saved state.
 * @param {string | null} raw
 * @returns {number}
 */
export function readRepairCount(raw) {
  if (!raw || raw.length > 200) return 0;
  try {
    const saved = JSON.parse(raw);
    return saved && saved.version === 1 ? validCount(saved.repairs) : 0;
  } catch {
    return 0;
  }
}

/** @param {number} count */
export function serializeRepairCount(count) {
  return JSON.stringify({ version: 1, repairs: validCount(count) });
}
