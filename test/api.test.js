const test = require('node:test');
const assert = require('node:assert');
const { createDatabase } = require('../src/db');
const { createApp } = require('../src/app');

function startServer() {
  const db = createDatabase(':memory:');
  const server = createApp(db).listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  return { server, baseUrl };
}

async function withServer(fn) {
  const { server, baseUrl } = startServer();
  try {
    await fn(baseUrl);
  } finally {
    server.close();
  }
}

function postTask(baseUrl, title) {
  return fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
}

test('creates and lists tasks', async () => {
  await withServer(async (baseUrl) => {
    const created = await (await postTask(baseUrl, 'buy milk')).json();
    assert.strictEqual(created.title, 'buy milk');
    assert.strictEqual(created.completed, false);

    const tasks = await (await fetch(`${baseUrl}/api/tasks`)).json();
    assert.deepStrictEqual(
      tasks.map((task) => task.title),
      ['buy milk']
    );
  });
});

test('rejects an empty title', async () => {
  await withServer(async (baseUrl) => {
    const response = await postTask(baseUrl, '   ');
    assert.strictEqual(response.status, 400);
  });
});

test('toggles completion', async () => {
  await withServer(async (baseUrl) => {
    const created = await (await postTask(baseUrl, 'walk')).json();

    const toggled = await (
      await fetch(`${baseUrl}/api/tasks/${created.id}`, { method: 'PATCH' })
    ).json();
    assert.strictEqual(toggled.completed, true);

    const back = await (
      await fetch(`${baseUrl}/api/tasks/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: false }),
      })
    ).json();
    assert.strictEqual(back.completed, false);
  });
});

test('deletes a task', async () => {
  await withServer(async (baseUrl) => {
    const created = await (await postTask(baseUrl, 'delete me')).json();

    const response = await fetch(`${baseUrl}/api/tasks/${created.id}`, { method: 'DELETE' });
    assert.strictEqual(response.status, 204);

    const tasks = await (await fetch(`${baseUrl}/api/tasks`)).json();
    assert.deepStrictEqual(tasks, []);
  });
});

test('returns 404 for unknown tasks', async () => {
  await withServer(async (baseUrl) => {
    const patched = await fetch(`${baseUrl}/api/tasks/999`, { method: 'PATCH' });
    assert.strictEqual(patched.status, 404);

    const deleted = await fetch(`${baseUrl}/api/tasks/999`, { method: 'DELETE' });
    assert.strictEqual(deleted.status, 404);
  });
});
