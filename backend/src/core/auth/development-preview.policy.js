export function isLoopbackAddress(value) {
  const address = String(value || '').trim().toLowerCase();
  return [
    '127.0.0.1',
    '::1',
    '::ffff:127.0.0.1',
    'localhost',
  ].includes(address);
}
