import { MATERIALS, PLANK_COUNT, STORAGE_KEY, nextRepair, undoRepair, readRepairCount, serializeRepairCount } from './state.js';

/** @template {HTMLElement | SVGElement} T
 * @param {string} selector
 * @returns {T}
 */
function element(selector) {
  const result = document.querySelector(selector);
  if (!result) throw new Error(`Missing ship element: ${selector}`);
  return /** @type {T} */ (result);
}

const replace = /** @type {HTMLButtonElement} */ (element('#replace'));
const undo = /** @type {HTMLButtonElement} */ (element('#undo'));
const reset = /** @type {HTMLButtonElement} */ (element('#reset'));
const announcement = element('#repair-announcement');
const saveNote = element('#save-note');
const planks = document.querySelectorAll('[data-plank]');
const inventory = document.querySelectorAll('#plank-list li');
let count = 0;
let canSave = true;

try {
  count = readRepairCount(localStorage.getItem(STORAGE_KEY));
} catch {
  canSave = false;
}

function render() {
  planks.forEach((plank, index) => {
    plank.setAttribute('data-material', index < count ? MATERIALS[index].id : 'wood');
  });
  inventory.forEach((row, index) => {
    const material = index < count ? MATERIALS[index] : { id: 'wood', name: 'Perfectly ordinary wood' };
    const swatch = row.querySelector('.material-swatch');
    const name = row.querySelector('[data-material-name]');
    if (swatch && name) {
      swatch.setAttribute('data-material', material.id);
      name.textContent = material.name;
    }
  });
  const latest = MATERIALS[count - 1];
  element('#original-count').textContent = String(PLANK_COUNT - count);
  element('#repair-count').textContent = count === 0 ? 'No repairs yet' : `${count} of ${PLANK_COUNT} replaced`;
  element('#identity-label').textContent = latest?.identity ?? 'Identity intact. No one has asked questions.';
  element('#ship-statement').textContent = latest?.statement ?? '“I would prefer we didn’t make this philosophical.”';
  element('#figure-state').textContent = latest?.figure ?? 'A ship, for now.';
  element('#ship-title').textContent = count === 0 ? 'The Ship of Theseus, before repairs' : `The Ship of Theseus, after ${count} ${count === 1 ? 'repair' : 'repairs'}`;
  const materials = MATERIALS.slice(0, count).map((material) => material.name.toLowerCase());
  element('#ship-description').textContent = count === 0
    ? 'A sailing ship with six wooden hull planks, a watchful eye on its sail, and a question mark on its flag.'
    : `A sailing ship with ${PLANK_COUNT - count} original wooden planks. Replacement materials: ${materials.join(', ')}. The eye and question-mark flag remain.`;
  replace.disabled = count === PLANK_COUNT;
  // Keep the label stable so a visitor never loses the primary action's name.
  element('#replace-hint').textContent = count === PLANK_COUNT ? 'All six replaced. Undo a repair or start over below.' : 'One repair. One very reasonable substitution.';
  undo.disabled = count === 0;
  reset.disabled = count === 0;
  saveNote.textContent = canSave ? 'Your experiment stays in this browser.' : 'Browser storage is unavailable. Repairs last until you leave this page.';
}

/** @param {string} message */
function update(message) {
  if (canSave) {
    try {
      localStorage.setItem(STORAGE_KEY, serializeRepairCount(count));
    } catch {
      canSave = false;
    }
  }
  render();
  announcement.textContent = message;
}

replace.addEventListener('click', () => {
  if (count >= PLANK_COUNT) return;
  count = nextRepair(count);
  const material = MATERIALS[count - 1];
  update(`Plank ${count} replaced with ${material.name.toLowerCase()}. ${PLANK_COUNT - count} original planks remain. ${material.statement}`);
});

undo.addEventListener('click', () => {
  if (count === 0) return;
  const restored = count;
  count = undoRepair(count);
  update(`Repair undone. Plank ${restored} is wood again. ${PLANK_COUNT - count} original planks remain.`);
  if (count === 0) replace.focus();
});

reset.addEventListener('click', () => {
  count = 0;
  update('Experiment reset. All six original wooden planks are back. The ship would like to forget this happened.');
  replace.focus();
});

// Another tab's changes are reflected without announcing an action this visitor did not take.
window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  count = event.key === null ? 0 : readRepairCount(event.newValue);
  render();
});

render();
