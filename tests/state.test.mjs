import test from 'node:test';
import assert from 'node:assert/strict';
import { MATERIALS, PLANK_COUNT, nextRepair, undoRepair, readRepairCount, serializeRepairCount } from '../src/assets/state.js';

test('all six repairs are reachable and cannot exceed the hull', () => {
  let repairs = 0;
  for (let index = 0; index < 6; index++) {
    repairs = nextRepair(repairs);
    assert.equal(repairs, index + 1);
    assert.ok(MATERIALS[index].name);
  }
  assert.equal(nextRepair(repairs), PLANK_COUNT);
  assert.equal(new Set(MATERIALS.map((material) => material.id)).size, 6);
});

test('undo reverses every repair and stops at zero', () => {
  let repairs = PLANK_COUNT;
  for (let index = 5; index >= 0; index--) {
    repairs = undoRepair(repairs);
    assert.equal(repairs, index);
  }
  assert.equal(undoRepair(0), 0);
});

test('saved state round trips every reachable stage', () => {
  for (let count = 0; count <= PLANK_COUNT; count++) assert.equal(readRepairCount(serializeRepairCount(count)), count);
});

test('corrupted, incompatible and out-of-range storage resets safely', () => {
  for (const value of [null, '', '{', 'null', '[]', '7', '{"version":2,"repairs":3}', '{"version":1,"repairs":-1}', '{"version":1,"repairs":7}', '{"version":1,"repairs":1.2}', '{"version":1,"repairs":"2"}', 'x'.repeat(201)]) {
    assert.equal(readRepairCount(value), 0, String(value));
  }
});
