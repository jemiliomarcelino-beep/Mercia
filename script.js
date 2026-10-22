const $ = (selector) => document.querySelector(selector);
const STORAGE = {
  date: 'nossoCantinho.relationshipDate',
  letters: 'nossoCantinho.letters',
  photos: 'nossoCantinho.photos',
  moments: 'nossoCantinho.moments'
};
const defaultDate = '2022-10-22';
let relationshipDate = localStorage.getItem(STORAGE.date) || defaultDate;
let letters = read(STORAGE.letters, []);
let photos = read(STORAGE.photos, []);
let moments = read(STORAGE.moments, [
  {date: relationshipDate, title: 'O começo da nossa história'},
  {date: '2023-02-14', title: 'Mais um motivo para sorrir juntos'},
  {date: '2024-10-22', title: 'Mais um ano de amor e cumplicidade'},
  {date: '2026-10-22', title: '4 anos de nós ❤️'}
]);

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function persist(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { showToast('O armazenamento está cheio. Remove algumas fotos e tenta novamente.'); return false; }
}
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}
function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString + 'T12:00:00').toLocaleDateString('pt-PT', {day:'2-digit', month:'long', year:'numeric'});
}
function updateCounter() {
  const start = new Date(relationshipDate + 'T12:00:00');
  const now = new Date();
  if (Number.isNaN(start.getTime()) || start > now) {
    $('#years').textContent = '0'; $('#months').textContent = '0'; $('#days').textContent = '0';
    $('#startDateLabel').textContent = relationshipDate;
    return;
  }
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  if (days < 0) {
    months--;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) { years--; months += 12; }
  $('#years').textContent = years;
  $('#months').textContent = months;
  $('#days').textContent = days;
  $('#startDateLabel').textContent = new Date(relationshipDate + 'T12:00:00').toLocaleDateString('pt-PT');
}
function renderPhotos() {
  const gallery = $('#photoGallery');
  gallery.innerHTML = '';
  if (!photos.length) {
    gallery.innerHTML = '<div class="empty-state"><span>♡</span><p>As vossas memórias começam aqui.</p><small>Adiciona fotografias para encher este espaço de amor.</small></div>';
    return;
  }
  photos.forEach((photo, index) => {
    const card = document.createElement('div'); card.className = 'photo-card';
    const img = document.createElement('img'); img.src = photo.data; img.alt = photo.name || `Memória ${index + 1}`;
    const remove = document.createElement('button'); remove.className = 'remove-photo'; remove.type = 'button'; remove.textContent = '×'; remove.title = 'Remover fotografia';
    remove.addEventListener('click', () => { photos.splice(index, 1); if (persist(STORAGE.photos, photos)) { renderPhotos(); showToast('Fotografia removida.'); } });
    card.append(img, remove); gallery.append(card);
  });
}
$('#photoInput').addEventListener('change', async (event) => {
  const files = Array.from(event.target.files || []).filter(file => file.type.startsWith('image/'));
  for (const file of files) {
    if (file.size > 1.8 * 1024 * 1024) { showToast(`${file.name} é grande. Escolhe uma imagem com menos de 1,8 MB.`); continue; }
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file);
    }).catch(() => null);
    if (data) photos.push({name:file.name, data});
  }
  if (persist(STORAGE.photos, photos)) { renderPhotos(); if (files.length) showToast('As tuas memórias foram adicionadas 💗'); }
  event.target.value = '';
});
function renderLetters() {
  const list = $('#lettersList'); list.innerHTML = '';
  if (!letters.length) { list.innerHTML = '<p class="muted">Ainda não guardaste nenhuma carta.</p>'; return; }
  [...letters].reverse().forEach(letter => {
    const item = document.createElement('article'); item.className = 'letter-item';
    const title = document.createElement('h4'); title.textContent = letter.title;
    const body = document.createElement('p'); body.textContent = letter.body;
    const meta = document.createElement('div'); meta.className = 'letter-meta';
    const date = document.createElement('span'); date.textContent = letter.date;
    const remove = document.createElement('button'); remove.className = 'text-button'; remove.textContent = 'Apagar carta';
    remove.addEventListener('click', () => { letters = letters.filter(entry => entry.id !== letter.id); if (persist(STORAGE.letters, letters)) { renderLetters(); showToast('Carta apagada.'); } });
    meta.append(date, remove); item.append(title, body, meta); list.append(item);
  });
}
$('#letterForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const title = $('#letterTitle').value.trim(), body = $('#letterText').value.trim();
  if (!title || !body) return;
  letters.push({id: `${Date.now()}-${Math.random()}`, title, body, date: new Date().toLocaleDateString('pt-PT')});
  if (persist(STORAGE.letters, letters)) { renderLetters(); $('#letterForm').reset(); showToast('Carta guardada com carinho 💌'); }
});
function renderTimeline() {
  const root = $('#timeline'); root.innerHTML = '';
  [...moments].sort((a,b) => a.date.localeCompare(b.date)).forEach((moment, index) => {
    const item = document.createElement('article'); item.className = 'timeline-item';
    const date = document.createElement('time'); date.textContent = formatDate(moment.date);
    const title = document.createElement('h3'); title.textContent = moment.title;
    item.append(date, title);
    if (moment.custom) {
      const remove = document.createElement('button'); remove.className = 'text-button'; remove.textContent = 'Remover momento';
      remove.addEventListener('click', () => { moments.splice(moments.indexOf(moment), 1); persist(STORAGE.moments, moments); renderTimeline(); });
      item.append(remove);
    }
    root.append(item);
  });
}
$('#momentForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const date = $('#momentDate').value, title = $('#momentTitle').value.trim();
  if (!date || !title) return;
  moments.push({date, title, custom:true});
  if (persist(STORAGE.moments, moments)) { renderTimeline(); $('#momentForm').reset(); showToast('Momento adicionado à vossa história!'); }
});
const dateDialog = $('#dateDialog');
$('#editDateBtn').addEventListener('click', () => { $('#relationshipDate').value = relationshipDate; dateDialog.showModal(); });
$('#closeDateDialog').addEventListener('click', () => dateDialog.close());
$('#dateForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const chosen = $('#relationshipDate').value;
  if (!chosen || new Date(chosen + 'T12:00:00') > new Date()) { showToast('Escolhe uma data válida, no passado ou hoje.'); return; }
  relationshipDate = chosen;
  localStorage.setItem(STORAGE.date, relationshipDate);
  const firstMoment = moments.find(moment => !moment.custom && moment.title === 'O começo da nossa história');
  if (firstMoment) firstMoment.date = relationshipDate;
  persist(STORAGE.moments, moments);
  updateCounter(); renderTimeline(); dateDialog.close(); showToast('Data de namoro atualizada ❤️');
});
document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', () => {
  document.querySelectorAll('.nav-link').forEach(item => item.classList.remove('active'));
  link.classList.add('active');
}));
updateCounter(); renderPhotos(); renderLetters(); renderTimeline();
