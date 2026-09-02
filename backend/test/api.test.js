const test = require('node:test');
const assert = require('node:assert/strict');
const createApp = require('../app');

let server;
let baseUrl;

test.before(async () => {
  server = createApp().listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => new Promise(resolve => server.close(resolve)));

test('rejects invalid registration input', async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'a', email: 'invalid', password: '123' }) });
  assert.equal(response.status, 400);
});

test('validates password reset requests before attempting to send email', async () => {
  const response = await fetch(`${baseUrl}/api/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'invalid' }) });
  assert.equal(response.status, 400);
});

test('protects habits when no session is present', async () => {
  const response = await fetch(`${baseUrl}/api/habits`);
  assert.equal(response.status, 401);
});

test('exposes a health endpoint for hosting checks', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});
