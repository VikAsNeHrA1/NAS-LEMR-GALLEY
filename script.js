const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MEALS = ['breakfast', 'lunch', 'dinner'];
const MEAL_ICONS = { breakfast: '🍳', lunch: '🥗', dinner: '🍽️' };
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };

const DEFAULTS = {
  announcement: "Welcome to the NAS Lemoore Fleet Galley! Menu is updated daily. Galley operations are subject to change based on mission requirements.",
  hours: { breakfast: "0600 – 0800", lunch: "1100 – 1300", dinner: "1700 – 1900", special: "Closed on Federal Holidays" },
  contact: "📍 Building 944, NAS Lemoore, CA 93246\n📞 (559) 998-XXXX\n✉️ galley@nas-lemoore.navy.mil\n🌐 Report issues to the duty officer",
  meals: {
    breakfast: { items: ["Scrambled Eggs", "Crispy Bacon & Sausage", "Buttermilk Pancakes", "Fresh Seasonal Fruit", "Assorted Cereals & Yogurt"], photo: "" },
    lunch: { items: ["Grilled Chicken Sandwich", "Beef Tacos w/ Toppings Bar", "Caesar Salad", "Vegetarian Pasta", "Navy Bean Soup"], photo: "" },
    dinner: { items: ["BBQ Beef Brisket", "Mashed Potatoes & Gravy", "Steamed Broccoli", "Dinner Rolls", "Chocolate Cake"], photo: "" }
  }
};

function load(k, d) {
  try {
    const v = localStorage.getItem('galley_' + k);
    return v ? JSON.parse(v) : d;
  } catch {
    return d;
  }
}

function save(k, v) {
  try {
    localStorage.setItem('galley_' + k, JSON.stringify(v));
  } catch {}
}

let state = {
  announcement: load('announcement', DEFAULTS.announcement),
  hours: load('hours', DEFAULTS.hours),
  contact: load('contact', DEFAULTS.contact),
  meals: load('meals', DEFAULTS.meals),
  password: load('password', 'galley2025'), // <-- CHANGE DEFAULT PASSWORD HERE BEFORE UPLOADING
  lastUpdated: load('lastUpdated', null)
};

// Clean up old keys from previous versions
if (state.hours.midrats) { delete state.hours.midrats; save('hours', state.hours); }
if (state.hours.brunch) { delete state.hours.brunch; save('hours', state.hours); }
MEALS.forEach(m => { if (!state.meals[m]) state.meals[m] = { items: [], photo: "" }; });

let isStaff = false;

function getStatus() {
  const h = new Date().getHours() * 100 + new Date().getMinutes();
  return (h >= 600 && h <= 800) || (h >= 1100 && h <= 1300) || (h >= 1700 && h <= 1900) ? 'open' : 'closed';
}

function getCurrentMeal() {
  const h = new Date().getHours() * 100 + new Date().getMinutes();
  if (h >= 500 && h < 1000) return 'breakfast';
  if (h >= 1000 && h < 1500) return 'lunch';
  return 'dinner';
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function markUpdated() {
  state.lastUpdated = new Date().toISOString();
  save('lastUpdated', state.lastUpdated);
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._to);
  t._to = setTimeout(() => t.classList.remove('show'), 3500);
}

function render() {
  const now = new Date();
  document.getElementById('date-display').innerHTML = DAY_FULL[now.getDay()] + '<br>' + MONTHS[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();

  const s = getStatus();
  document.getElementById('galley-status').innerHTML = '<span class="galley-status ' + s + '"><span class="dot"></span>' + (s === 'open' ? 'Now Serving' : 'Closed') + '</span>';

  document.getElementById('menu-date-label').textContent = DAY_FULL[now.getDay()] + ', ' + MONTHS[now.getMonth()] + ' ' + now.getDate();
  document.getElementById('announcement-text').textContent = state.announcement;

  const lu = document.getElementById('last-updated');
  if (state.lastUpdated) {
    const d = new Date(state.lastUpdated);
    lu.textContent = 'Last updated: ' + d.toLocaleDateString() + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    lu.textContent = '';
  }

  const cm = getCurrentMeal();
  const hd = document.getElementById('hours-display');
  hd.innerHTML = [
    ['Breakfast', state.hours.breakfast, 'breakfast'],
    ['Lunch', state.hours.lunch, 'lunch'],
    ['Dinner', state.hours.dinner, 'dinner'],
    ['Note', state.hours.special, '']
  ].map(function(r) {
    var a = r[2] && r[2] === cm;
    return '<span class="hours-label' + (a ? ' active-meal' : '') + '">' + r[0] + '</span><span class="hours-time' + (a ? ' active-meal' : '') + '">' + (r[1] || '—') + '</span>';
  }).join('');

  document.getElementById('contact-info').textContent = state.contact;

  document.getElementById('meal-grid').innerHTML = MEALS.map(function(meal) {
    var data = state.meals[meal] || { items: [], photo: '' };
    var photo = data.photo ? '<img class="meal-photo" src="' + data.photo + '" alt="' + meal + '" onerror="this.parentElement.innerHTML=\'<div class=meal-photo-placeholder>Photo unavailable</div>\'">' : '';
    var items = data.items && data.items.length ? data.items.map(function(i) { return '<li>' + esc(i) + '</li>' }).join('') : '<li class="no-items">Menu not yet posted</li>';
    var eb = isStaff ? '<button class="btn btn-gold btn-sm edit-meal-btn" onclick="openMealEdit(\'' + meal + '\')">Edit</button>' : '';
    return '<div class="meal-card-wrap"><div class="meal-card"><div>' + photo + '</div><div class="meal-card-header"><div><div style="display:flex;align-items:center;gap:.5rem"><span class="meal-icon">' + MEAL_ICONS[meal] + '</span><span class="meal-title">' + MEAL_LABELS[meal] + '</span></div><div class="meal-time">' + (state.hours[meal] || '') + '</div></div></div><div class="meal-card-body"><ul class="menu-items-list">' + items + '</ul></div></div>' + eb + '</div>';
  }).join('');
}

// Auth
document.getElementById('staff-login-btn').onclick = function() {
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').style.display = 'none';
  openModal('login-modal');
  setTimeout(function() { document.getElementById('login-password').focus(); }, 100);
};

function doLogin() {
  if (document.getElementById('login-password').value === state.password) {
    isStaff = true;
    closeModal('login-modal');
    document.getElementById('staff-login-btn').style.display = 'none';
    document.getElementById('staff-logout-btn').style.display = 'inline-block';
    document.getElementById('staff-toolbar').classList.add('visible');
    render();
    toast('Staff mode active — you can now edit everything.');
  } else {
    document.getElementById('login-error').style.display = 'block';
  }
}

document.getElementById('staff-logout-btn').onclick = function() {
  isStaff = false;
  document.getElementById('staff-login-btn').style.display = 'inline-block';
  document.getElementById('staff-logout-btn').style.display = 'none';
  document.getElementById('staff-toolbar').classList.remove('visible');
  render();
  toast('Logged out.');
};

// Modals
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(function(el) {
  el.addEventListener('click', function(e) {
    if (e.target === el) el.classList.remove('open');
  });
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(function(m) { m.classList.remove('open'); });
  }
});

// Announcement
function openAnnEdit() {
  document.getElementById('ann-input').value = state.announcement;
  openModal('ann-modal');
}
function saveAnnouncement() {
  state.announcement = document.getElementById('ann-input').value.trim() || DEFAULTS.announcement;
  save('announcement', state.announcement);
  markUpdated();
  closeModal('ann-modal');
  render();
  toast('Announcement updated!');
}

// Hours
function openHoursEdit() {
  document.getElementById('h-breakfast').value = state.hours.breakfast;
  document.getElementById('h-lunch').value = state.hours.lunch;
  document.getElementById('h-dinner').value = state.hours.dinner;
  document.getElementById('h-special').value = state.hours.special;
  openModal('hours-modal');
}
function saveHours() {
  state.hours = {
    breakfast: document.getElementById('h-breakfast').value || state.hours.breakfast,
    lunch: document.getElementById('h-lunch').value || state.hours.lunch,
    dinner: document.getElementById('h-dinner').value || state.hours.dinner,
    special: document.getElementById('h-special').value || state.hours.special
  };
  save('hours', state.hours);
  markUpdated();
  closeModal('hours-modal');
  render();
  toast('Hours updated!');
}

// Contact
function openContactEdit() {
  document.getElementById('contact-input').value = state.contact;
  openModal('contact-modal');
}
function saveContact() {
  state.contact = document.getElementById('contact-input').value.trim() || DEFAULTS.contact;
  save('contact', state.contact);
  markUpdated();
  closeModal('contact-modal');
  render();
  toast('Contact info updated!');
}

// Meal Edit
function openMealEdit(meal) {
  document.getElementById('editing-meal').value = meal;
  document.getElementById('meal-modal-title').textContent = 'Edit ' + MEAL_LABELS[meal];
  var data = state.meals[meal] || { items: [], photo: '' };
  document.getElementById('meal-items-input').value = (data.items || []).join('\n');
  document.getElementById('meal-photo-input').value = data.photo || '';
  openModal('meal-modal');
}
function saveMeal() {
  var meal = document.getElementById('editing-meal').value;
  var items = document.getElementById('meal-items-input').value.split('\n').map(function(s) { return s.trim(); }).filter(Boolean);
  state.meals[meal] = { items: items, photo: document.getElementById('meal-photo-input').value.trim() };
  save('meals', state.meals);
  markUpdated();
  closeModal('meal-modal');
  render();
  toast(MEAL_LABELS[meal] + ' menu saved!');
}

// Settings
function openSettingsModal() {
  document.getElementById('new-password').value = '';
  document.getElementById('confirm-password').value = '';
  document.getElementById('pw-error').style.display = 'none';
  document.getElementById('pw-success').style.display = 'none';
  openModal('settings-modal');
}
function changePassword() {
  var np = document.getElementById('new-password').value;
  var cp = document.getElementById('confirm-password').value;
  var e = document.getElementById('pw-error');
  var s = document.getElementById('pw-success');
  e.style.display = 'none';
  s.style.display = 'none';
  
  if (np.length < 4) { e.textContent = 'Password must be at least 4 characters.'; e.style.display = 'block'; return; }
  if (np !== cp) { e.textContent = 'Passwords do not match.'; e.style.display = 'block'; return; }
  
  state.password = np;
  save('password', state.password);
  s.style.display = 'block';
  document.getElementById('new-password').value = '';
  document.getElementById('confirm-password').value = '';
  toast('Password changed!');
}

// Export / Import
function exportData() {
  var data = {
    _format: 'nas-lemoore-galley-v3',
    _exported: new Date().toISOString(),
    announcement: state.announcement,
    hours: state.hours,
    contact: state.contact,
    meals: state.meals,
    lastUpdated: state.lastUpdated
  };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'galley-data-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Data exported!');
}

document.getElementById('import-file').addEventListener('change', function(e) {
  var file = e.target.files[0];
  if (!file) return;
  var r = new FileReader();
  r.onload = function(ev) {
    try {
      var d = JSON.parse(ev.target.result);
      if (d.announcement) { state.announcement = d.announcement; save('announcement', state.announcement); }
      if (d.hours) {
        state.hours = {
          breakfast: d.hours.breakfast || state.hours.breakfast,
          lunch: d.hours.lunch || state.hours.lunch,
          dinner: d.hours.dinner || state.hours.dinner,
          special: d.hours.special || state.hours.special
        };
        save('hours', state.hours);
      }
      if (d.contact) { state.contact = d.contact; save('contact', state.contact); }
      if (d.meals) { state.meals = d.meals; save('meals', state.meals); }
      markUpdated();
      render();
      toast('Data imported!');
    } catch (err) {
      toast('Error: Invalid file.');
    }
  };
  r.readAsText(file);
  e.target.value = '';
});

function resetAllData() {
  if (!confirm('Reset ALL data to defaults? Cannot be undone.')) return;
  if (!confirm('Are you sure?')) return;
  
  state.announcement = DEFAULTS.announcement;
  state.hours = JSON.parse(JSON.stringify(DEFAULTS.hours));
  state.contact = DEFAULTS.contact;
  state.meals = JSON.parse(JSON.stringify(DEFAULTS.meals));
  state.password = 'galley2025';
  state.lastUpdated = null;
  
  ['announcement', 'hours', 'contact', 'meals', 'password', 'lastUpdated'].forEach(function(k) {
    save(k, state[k]);
  });
  
  // Clear deprecated keys just in case
  try { localStorage.removeItem('galley_weeklyMenu'); } catch (e) {}
  
  closeModal('settings-modal');
  render();
  toast('All data reset.');
}

// Initial render
render();

// Check status every minute
setInterval(function() {
  var s = getStatus();
  document.getElementById('galley-status').innerHTML = '<span class="galley-status ' + s + '"><span class="dot"></span>' + (s === 'open' ? 'Now Serving' : 'Closed') + '</span>';
}, 60000);
