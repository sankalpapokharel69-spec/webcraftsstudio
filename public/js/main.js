/* ============ PRELOADER ============ */
window.addEventListener('load', () => {
  setTimeout(() => document.querySelector('.preloader')?.classList.add('hidden'), 900);
});

/* ============ NAVBAR ============ */
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 40);
});

const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger?.addEventListener('click', () => navLinks.classList.toggle('open'));
document.querySelectorAll('.nav-links a').forEach(a =>
  a.addEventListener('click', () => navLinks?.classList.remove('open')));

/* ============ TYPING EFFECT ============ */
const typingEl = document.getElementById('typing');
if (typingEl) {
  const words = ['Websites', 'Web Apps', 'E-Commerce', 'Landing Pages', 'Portfolios'];
  let w = 0, c = 0, deleting = false;
  (function type() {
    const word = words[w];
    typingEl.textContent = deleting ? word.substring(0, c--) : word.substring(0, c++);
    if (!deleting && c === word.length + 1) { deleting = true; setTimeout(type, 1400); }
    else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; setTimeout(type, 300); }
    else setTimeout(type, deleting ? 45 : 110);
  })();
}

/* ============ SCROLL REVEAL ============ */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => observer.observe(el));

/* ============ COUNTER ANIMATION ============ */
function animateCounter(el) {
  const target = +el.dataset.target;
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 60));
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = current + (el.dataset.suffix || '');
  }, 25);
}
const statObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); statObserver.unobserve(e.target); } });
}, { threshold: 0.5 });
document.querySelectorAll('.stat h3[data-target]').forEach(el => statObserver.observe(el));

/* ============ TOAST ============ */
function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return alert(msg);
  toast.textContent = msg;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* ============ NAVBAR USER STATE ============ */
async function loadUser() {
  const authBox = document.getElementById('nav-auth');
  if (!authBox) return;
  try {
    const r = await fetch('/api/me');
    const data = await r.json();
    if (data.loggedIn) {
      authBox.innerHTML = `
        <span class="user-chip">👋 ${data.username}</span>
        <button class="btn btn-outline btn-sm" onclick="logout()">Logout</button>`;
    } else {
      authBox.innerHTML = `
        <a href="login.html" class="btn btn-outline btn-sm">Login</a>
        <a href="register.html" class="btn btn-primary btn-sm">Sign Up</a>`;
    }
  } catch (e) { /* server offline */ }
}
async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  showToast('Logged out successfully');
  setTimeout(() => location.reload(), 800);
}

/* ============ PROJECTS (public — seen by everyone) ============ */
async function loadProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  try {
    const r = await fetch('/api/projects');
    const projects = await r.json();
    if (!projects.length) {
      grid.innerHTML = '<p class="empty-msg">✨ Our first projects are coming soon. Stay tuned!</p>';
      return;
    }
    grid.innerHTML = projects.map(p => `
      <div class="project-card reveal">
        ${p.image_url
          ? `<img src="${p.image_url}" alt="${p.title}" onerror="this.outerHTML='<div class=\\'project-thumb\\'>WCS</div>'">`
          : `<div class="project-thumb">WCS</div>`}
        <div class="project-body">
          <h3>${p.title}</h3>
          <p>${p.description}</p>
          ${p.link ? `<a class="project-link" href="${p.link}" target="_blank" rel="noopener">View Project →</a>` : ''}
        </div>
      </div>`).join('');
    grid.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  } catch (e) {
    grid.innerHTML = '<p class="empty-msg">⚠️ Could not load projects. Is the server running?</p>';
  }
}

/* ============ CONTACT FORM → OWNER INBOX ============ */
function bindContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Sending...';
    btn.disabled = true;
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          subject: form.subject.value.trim(),
          message: form.message.value.trim()
        })
      });
      const data = await r.json();
      if (r.ok) { showToast('✅ ' + data.message); form.reset(); }
      else showToast(data.error, true);
    } catch (err) {
      showToast('Server error — please try again', true);
    }
    btn.textContent = 'Send Message';
    btn.disabled = false;
  });
}

/* ============ ADMIN / OWNER PASSWORD GATE ============ */
function bindGate(onSuccess) {
  const gate = document.getElementById('gate');
  const panel = document.getElementById('panel');
  if (!gate) return;
  gate.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('gate-error');
    errEl.textContent = 'Checking...';
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: gate.password.value })
      });
      const data = await r.json();
      if (r.ok) {
        gate.style.display = 'none';
        panel.style.display = 'block';
        onSuccess();
      } else {
        errEl.textContent = '❌ ' + data.error;
        gate.password.value = '';
      }
    } catch (err) {
      errEl.textContent = '❌ Server error — is the backend running?';
    }
  });
}

/* ============ ADMIN: ADD PROJECT ============ */
function bindAdminPanel() {
  const form = document.getElementById('add-project-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const r = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.value.trim(),
          description: form.description.value.trim(),
          image_url: form.image_url.value.trim(),
          link: form.link.value.trim()
        })
      });
      const data = await r.json();
      if (r.ok) { showToast('✅ ' + data.message); form.reset(); loadAdminProjects(); }
      else showToast(data.error, true);
    } catch (err) { showToast('Server error', true); }
  });
}

async function loadAdminProjects() {
  const list = document.getElementById('admin-projects-list');
  if (!list) return;
  const r = await fetch('/api/projects');
  const projects = await r.json();
  if (!projects.length) { list.innerHTML = '<p style="color:var(--gray)">No projects yet. Add your first one above!</p>'; return; }
  list.innerHTML = projects.map(p => `
    <div class="admin-item">
      <div><strong>${p.title}</strong><br><small>${p.description.substring(0, 70)}...</small></div>
      <button class="btn-danger" onclick="deleteProject(${p.id})">Delete</button>
    </div>`).join('');
}

async function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  const r = await fetch('/api/projects/' + id, { method: 'DELETE' });
  if (r.ok) { showToast('Project deleted'); loadAdminProjects(); }
  else showToast('Failed to delete', true);
}

/* ============ OWNER INBOX ============ */
async function loadInbox() {
  const list = document.getElementById('messages-list');
  if (!list) return;
  const r = await fetch('/api/inbox');
  if (r.status === 403) { showToast('Access denied', true); return; }
  const messages = await r.json();
  if (!messages.length) { list.innerHTML = '<p style="color:var(--gray)">📭 Inbox is empty. Messages from the contact form will appear here.</p>'; return; }
  list.innerHTML = messages.map(m => `
    <div class="message-card">
      <div class="message-head">
        <div>
          <h3>${m.name}</h3>
          <a class="msg-email" href="mailto:${m.email}">${m.email}</a>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <small>${m.created_at}</small>
          <button class="btn-danger" onclick="deleteMessage(${m.id})">Delete</button>
        </div>
      </div>
      ${m.subject ? `<span class="msg-subject">${m.subject}</span>` : ''}
      <p class="message-body">${m.message}</p>
    </div>`).join('');
}

async function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  const r = await fetch('/api/inbox/' + id, { method: 'DELETE' });
  if (r.ok) { showToast('Message deleted'); loadInbox(); }
  else showToast('Failed to delete', true);
}

/* ============ ADMIN LOGOUT ============ */
async function adminLogout() {
  await fetch('/api/admin/logout', { method: 'POST' });
  location.reload();
}

/* ============ INIT PER PAGE ============ */
document.addEventListener('DOMContentLoaded', () => {
  loadUser();
  loadProjects();
  bindContactForm();

  // Admin page
  const isAdminPage = document.getElementById('add-project-form');
  if (isAdminPage) {
    bindGate(() => loadAdminProjects());
    bindAdminPanel();
  }

  // Inbox page
  if (document.getElementById('messages-list')) {
    bindGate(() => loadInbox());
  }
});