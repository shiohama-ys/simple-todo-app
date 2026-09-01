(function () {
  'use strict';

  const form = document.getElementById('task-form');
  const input = document.getElementById('task-input');
  const list = document.getElementById('task-list');
  const status = document.getElementById('status');
  const addButton = form.querySelector('button');

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle('error', Boolean(isError));
  }

  async function request(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) {
      let message = 'エラーが発生しました';
      try {
        const body = await response.json();
        if (body && body.error) {
          message = body.error;
        }
      } catch (e) {
        /* レスポンスが JSON でない場合は既定のメッセージを使う */
      }
      throw new Error(message);
    }
    return response.status === 204 ? null : response.json();
  }

  function createTaskElement(task) {
    const item = document.createElement('li');
    item.className = 'task-item' + (task.completed ? ' completed' : '');
    item.dataset.id = String(task.id);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', '完了');
    checkbox.addEventListener('change', function () {
      toggleTask(task.id, checkbox.checked, item, checkbox);
    });

    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-button';
    deleteButton.textContent = '削除';
    deleteButton.addEventListener('click', function () {
      deleteTask(task.id, item);
    });

    item.append(checkbox, title, deleteButton);
    return item;
  }

  function render(tasks) {
    list.textContent = '';
    tasks.forEach(function (task) {
      list.appendChild(createTaskElement(task));
    });
    setStatus(tasks.length === 0 ? 'タスクはありません' : '', false);
  }

  async function loadTasks() {
    try {
      render(await request('/api/tasks'));
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  async function toggleTask(id, completed, item, checkbox) {
    try {
      await request('/api/tasks/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: completed }),
      });
      item.classList.toggle('completed', completed);
      setStatus('', false);
    } catch (error) {
      checkbox.checked = !completed;
      setStatus(error.message, true);
    }
  }

  async function deleteTask(id, item) {
    try {
      await request('/api/tasks/' + id, { method: 'DELETE' });
      item.remove();
      if (list.children.length === 0) {
        setStatus('タスクはありません', false);
      }
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const title = input.value.trim();
    if (!title) {
      return;
    }

    addButton.disabled = true;
    try {
      const task = await request('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title }),
      });
      list.prepend(createTaskElement(task));
      input.value = '';
      setStatus('', false);
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      addButton.disabled = false;
      input.focus();
    }
  });

  loadTasks();
})();
