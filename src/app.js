const path = require('path');
const express = require('express');
const { createDatabase } = require('./db');

const MAX_TITLE_LENGTH = 200;

function toTask(row) {
  return {
    id: row.id,
    title: row.title,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
  };
}

function createApp(db = createDatabase()) {
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/tasks', (req, res) => {
    const rows = db
      .prepare('SELECT id, title, completed, created_at FROM tasks ORDER BY id DESC')
      .all();
    res.json(rows.map(toTask));
  });

  app.post('/api/tasks', (req, res) => {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (title.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({ error: `title must be ${MAX_TITLE_LENGTH} characters or fewer` });
    }

    const info = db.prepare('INSERT INTO tasks (title) VALUES (?)').run(title);
    const row = db
      .prepare('SELECT id, title, completed, created_at FROM tasks WHERE id = ?')
      .get(info.lastInsertRowid);

    res.status(201).json(toTask(row));
  });

  app.patch('/api/tasks/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const row = db
      .prepare('SELECT id, title, completed, created_at FROM tasks WHERE id = ?')
      .get(id);
    if (!row) {
      return res.status(404).json({ error: 'task not found' });
    }

    const completed =
      typeof req.body?.completed === 'boolean' ? req.body.completed : !row.completed;

    db.prepare('UPDATE tasks SET completed = ? WHERE id = ?').run(completed ? 1 : 0, id);
    const updated = db
      .prepare('SELECT id, title, completed, created_at FROM tasks WHERE id = ?')
      .get(id);
    res.json(toTask(updated));
  });

  app.delete('/api/tasks/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'task not found' });
    }

    res.status(204).end();
  });

  return app;
}

module.exports = { createApp };
