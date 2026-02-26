const app = document.getElementById('app');
const sessionActions = document.getElementById('session-actions');

const state = {
  users: JSON.parse(localStorage.getItem('users') || '[]'),
  session: JSON.parse(localStorage.getItem('session') || 'null'),
  selectedRequestId: null,
  selectedPersonId: null
};

const generationLabels = [
  'Cliente (Topo)',
  '1ª geração',
  '2ª geração',
  '3ª geração',
  '4ª geração',
  '5ª geração'
];

function persist() {
  localStorage.setItem('users', JSON.stringify(state.users));
  localStorage.setItem('session', JSON.stringify(state.session));
}

function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function currentUser() {
  if (!state.session) return null;
  return state.users.find((user) => user.id === state.session.userId) || null;
}

function seedData(user) {
  if (user.requests.length) return;
  user.requests.push({
    id: uid('req'),
    type: 'Italiana',
    stage: 1,
    createdAt: new Date().toISOString(),
    people: generationLabels.map((label, index) => ({
      id: uid('person'),
      generation: index,
      label,
      fullName: index === 0 ? user.fullName || 'Cliente' : `Parente ${index}`,
      age: '',
      docs: []
    }))
  });
  user.notifications.push('Processo de cidadania italiana iniciado.');
}

function render() {
  app.innerHTML = '';
  sessionActions.innerHTML = '';

  if (!state.session) {
    renderAuth();
    return;
  }

  const user = currentUser();
  if (!user) {
    state.session = null;
    persist();
    renderAuth();
    return;
  }

  const logoutBtn = document.createElement('button');
  logoutBtn.textContent = `Sair (${user.role === 'staff' ? 'Funcionário' : 'Usuário'})`;
  logoutBtn.className = 'secondary';
  logoutBtn.onclick = () => {
    state.session = null;
    persist();
    render();
  };
  sessionActions.appendChild(logoutBtn);

  if (!user.requests.length) {
    renderCitizenshipSelector(user);
    return;
  }

  renderPortal(user);
}

function renderAuth() {
  const node = document.getElementById('auth-template').content.cloneNode(true);

  node.getElementById('google-login').onclick = () => {
    const email = `google_${Date.now()}@demo.com`;
    let user = state.users.find((u) => u.email === email);
    if (!user) {
      user = {
        id: uid('user'),
        email,
        cpf: '00000000000',
        password: 'social-login',
        fullName: 'Usuário Google',
        age: '',
        role: 'user',
        notifications: ['Login social Google realizado.'],
        requests: []
      };
      state.users.push(user);
    }
    state.session = { userId: user.id };
    persist();
    render();
  };

  node.getElementById('register-form').onsubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const email = form.get('email');
    if (state.users.some((u) => u.email === email)) {
      alert('Este email já está cadastrado.');
      return;
    }

    const user = {
      id: uid('user'),
      email,
      cpf: form.get('cpf'),
      password: form.get('password'),
      fullName: 'Nome não informado',
      age: '',
      role: form.get('role'),
      notifications: ['Conta criada com sucesso.'],
      requests: []
    };

    state.users.push(user);
    state.session = { userId: user.id };
    persist();
    render();
  };

  app.appendChild(node);
}

function renderCitizenshipSelector(user) {
  const node = document.getElementById('citizenship-template').content.cloneNode(true);
  node.getElementById('citizenship-form').onsubmit = (event) => {
    event.preventDefault();
    const type = new FormData(event.target).get('type');
    if (!type) return;

    const request = {
      id: uid('req'),
      type,
      stage: 1,
      createdAt: new Date().toISOString(),
      people: generationLabels.map((label, index) => ({
        id: uid('person'),
        generation: index,
        label,
        fullName: index === 0 ? user.fullName : `Parente ${index}`,
        age: '',
        docs: []
      }))
    };

    user.requests.push(request);
    user.notifications.unshift(`Processo de cidadania ${type} iniciado.`);
    persist();
    render();
  };

  app.appendChild(node);
}

function renderPortal(user) {
  if (user.role === 'staff' && !user.requests.length) seedData(user);

  const node = document.getElementById('portal-template').content.cloneNode(true);
  const requestList = node.getElementById('request-list');
  const notificationList = node.getElementById('notification-list');
  const treeGrid = node.getElementById('tree-grid');
  const docPanel = node.getElementById('document-panel');
  const personTitle = node.getElementById('person-title');
  const docList = node.getElementById('doc-list');
  const docUploadForm = node.getElementById('doc-upload-form');

  const activeRequest = user.requests.find((r) => r.id === state.selectedRequestId) || user.requests[0];
  state.selectedRequestId = activeRequest?.id || null;

  user.requests.forEach((request) => {
    const li = document.createElement('li');
    li.className = request.id === state.selectedRequestId ? 'active' : '';
    li.innerHTML = `<strong>${request.type}</strong><br/>Etapa atual: ${request.stage} de 5`;
    li.onclick = () => {
      state.selectedRequestId = request.id;
      state.selectedPersonId = null;
      render();
    };
    requestList.appendChild(li);
  });

  node.getElementById('new-request').onclick = () => {
    app.innerHTML = '';
    renderCitizenshipSelector(user);
  };

  user.notifications.slice(0, 12).forEach((note) => {
    const li = document.createElement('li');
    li.textContent = note;
    notificationList.appendChild(li);
  });

  activeRequest.people.forEach((person) => {
    const box = document.createElement('button');
    box.className = `tree-person ${state.selectedPersonId === person.id ? 'active' : ''}`;
    box.innerHTML = `<h5>${person.label}</h5><div>${person.fullName}</div><small>Idade: ${person.age || '-'}</small>`;
    box.onclick = () => {
      state.selectedPersonId = person.id;
      render();
    };
    treeGrid.appendChild(box);
  });

  const selectedPerson = activeRequest.people.find((p) => p.id === state.selectedPersonId);
  if (selectedPerson) {
    personTitle.textContent = `${selectedPerson.label} · ${selectedPerson.fullName}`;
    docPanel.classList.remove('hidden');
    selectedPerson.docs.forEach((doc) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${doc.type}</strong><br/><a href="${doc.url}" target="_blank">${doc.fileName}</a>`;
      docList.appendChild(li);
    });

    docUploadForm.onsubmit = (event) => {
      event.preventDefault();
      const form = new FormData(event.target);
      const file = form.get('file');
      if (!file || !file.name) return;
      selectedPerson.docs.push({
        id: uid('doc'),
        type: form.get('docType'),
        fileName: file.name,
        url: URL.createObjectURL(file)
      });
      user.notifications.unshift(`Novo documento (${form.get('docType')}) anexado em ${selectedPerson.label}.`);
      persist();
      render();
    };
  }

  if (user.role === 'staff') {
    const dashboard = node.getElementById('staff-dashboard');
    dashboard.classList.remove('hidden');
    renderStaffStats(user, node.getElementById('stats-grid'));
    renderStaffEditor(user, node.getElementById('staff-edit-form'), activeRequest);
  }

  app.appendChild(node);
}

function renderStaffStats(user, container) {
  const totalDocs = user.requests.flatMap((r) => r.people.flatMap((p) => p.docs)).length;
  const avgStage = Math.round(
    user.requests.reduce((acc, req) => acc + req.stage, 0) / Math.max(user.requests.length, 1)
  );
  const cards = [
    ['Solicitações ativas', user.requests.length],
    ['Documentos anexados', totalDocs],
    ['Etapa média', `${avgStage}/5`],
    ['Notificações', user.notifications.length]
  ];

  cards.forEach(([title, value]) => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.innerHTML = `<strong>${title}</strong><div>${value}</div>`;
    container.appendChild(card);
  });
}

function renderStaffEditor(user, form, activeRequest) {
  const topPerson = activeRequest.people[0];
  form.innerHTML = `
    <label>Nome completo
      <input name="fullName" value="${topPerson.fullName}" required />
    </label>
    <label>Idade
      <input type="number" name="age" min="0" value="${topPerson.age}" />
    </label>
    <label>Etapa do processo
      <select name="stage">
        ${[1, 2, 3, 4, 5]
          .map((step) => `<option value="${step}" ${step === activeRequest.stage ? 'selected' : ''}>${step}</option>`)
          .join('')}
      </select>
    </label>
    <button class="primary" type="submit">Salvar alterações</button>
  `;

  form.onsubmit = (event) => {
    event.preventDefault();
    const data = new FormData(form);
    topPerson.fullName = data.get('fullName');
    topPerson.age = data.get('age');
    activeRequest.stage = Number(data.get('stage'));
    user.fullName = topPerson.fullName;
    user.age = topPerson.age;
    user.notifications.unshift(`Funcionário atualizou os dados para etapa ${activeRequest.stage}.`);
    persist();
    render();
  };
}

render();
