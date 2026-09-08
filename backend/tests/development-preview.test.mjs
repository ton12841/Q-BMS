import assert from 'node:assert/strict';
import { isLoopbackAddress } from '../src/core/auth/development-preview.policy.js';

export async function run() {
  for (const value of ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost']) {
    assert.equal(isLoopbackAddress(value), true, value);
  }
  for (const value of ['192.168.1.10', '10.0.0.8', '0.0.0.0', '', null]) {
    assert.equal(isLoopbackAddress(value), false, String(value));
  }
}
