import { EventEmitter } from 'node:events';
import { expect, test, vi } from 'vitest';
import {
  childIsRunning,
  signalProcessGroup,
  stopManagedPreview,
  waitForChildEnd,
} from '../../scripts/verify-local-preview.mjs';

test('managed preview treats exit signals and missing process groups as stopped', async () => {
  expect(childIsRunning({ exitCode: null, signalCode: null })).toBe(true);
  expect(childIsRunning({ exitCode: 0, signalCode: null })).toBe(false);
  expect(childIsRunning({ exitCode: null, signalCode: 'SIGTERM' })).toBe(false);

  const missing = Object.assign(new Error('gone'), { code: 'ESRCH' });
  const kill = vi.fn(() => {
    throw missing;
  });
  expect(signalProcessGroup(321, 'SIGTERM', kill)).toBe(false);

  const child = Object.assign(new EventEmitter(), {
    pid: 321,
    exitCode: null as number | null,
    signalCode: null as NodeJS.Signals | null,
  });
  await expect(stopManagedPreview(child, kill)).resolves.toBeUndefined();
  expect(kill).toHaveBeenCalledTimes(2);
});

test('managed preview wait removes child listeners after its timeout', async () => {
  const child = new EventEmitter();

  await waitForChildEnd(child, 0);

  expect(child.listenerCount('exit')).toBe(0);
  expect(child.listenerCount('error')).toBe(0);
});
