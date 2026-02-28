// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDw7WodKXWbh0mXwDY7QZExxyrfnq6vY9s",
  authDomain: "nas-lemoore-galley.firebaseapp.com",
  databaseURL: "https://nas-lemoore-galley-default-rtdb.firebaseio.com",
  projectId: "nas-lemoore-galley",
  storageBucket: "nas-lemoore-galley.firebasestorage.app",
  messagingSenderId: "339494826847",
  appId: "1:339494826847:web:667bdd80192c9b6c30fcea"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const dbRef = db.ref('galley_data'); // This is the "folder" in your database

// ==========================================
// 2. CONSTANTS & DEFAULTS
// ==========================================
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MEALS = ['breakfast', 'lunch', 'dinner'];
const MEAL_ICONS = { breakfast: '🍳', lunch: '🥗', dinner: '🍽️' };
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };

const DEFAULTS = {
  announcement: "Welcome to the NAS Lemoore Fleet Galley! Menu is updated daily. Galley operations are subject to change based on mission requirements.",
  hours: { breakfast: "0600 – 0800", lunch: "1100 – 1300", dinner: "1700 – 1900", special: "Closed on Federal Holidays" },
  contact: "📍 Building 944, NAS Lemoore, CA 93246\n📞 (559) 998-XXXX\n✉️ galley@nas-lemoore.navy.mil\n🌐 Report issues to the duty officer",
  password: "galley2025",
  lastUpdated: new Date().toISOString(),
  meals: {
    breakfast: { items: ["Scrambled Eggs", "Crispy Bacon & Sausage", "Buttermilk Pancakes"], photo: "" },
    lunch: { items: ["Grilled Chicken Sandwich", "Beef Tacos w/ Toppings Bar", "Caesar Salad"], photo: "" },
    dinner: { items: ["BBQ Beef Brisket", "Mashed Potatoes & Gravy", "Steamed Broccoli"], photo: "" }
  }
};

let state = null; // This will hold the live data from Firebase
let isStaff = false;

// ==========================================
// 3. REAL-TIME CLOUD SYNC
// ==========================================
// This listener runs immediately on load, AND anytime ANYONE changes the data
dbRef.on('value', (snapshot) => {
  const data = snapshot.val();
  
  if (!data) {
    // If the database is completely empty (first run), populate it with defaults
    console.log("Database empty. Populating with defaults...");
    dbRef.set(DEFAULTS);
  } else {
    // Data exists! Update our local state and redraw the screen.
    state = data;
    render();
  }
});

// Master function to save data back to Firebase
function saveToCloud(successMsg) {
  state.lastUpdated = new Date().toISOString();
  dbRef.set(state)
    .then(() => { if(successMsg) toast(successMsg); })
    .catch((error) => { toast('Error saving to cloud: ' + error.message); });
}

// ==========================================
// 4. UI RENDERER & UTILITIES
// ==========================================
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

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._to);
  t._to = setTimeout(() => t.classList.remove('show'), 3500);
}

function render() {
  if (!state) return; // Wait until data loads from cloud

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

// ==========================================
// 5. STAFF AUTHENTICATION & MODALS
// ==========================================
document.getElementById('staff-login-btn').onclick = function() {
  if (!state) return toast("Wait for database to connect...");
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
    toast('Staff mode active.');
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

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(function(el) { el.addEventListener('click', function(e) { if (e.target === el) el.classList.remove('open'); }); });
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(function(m) { m.classList.remove('open'); }); });

// ==========================================
// 6. STAFF EDIT FUNCTIONS
// ==========================================
function openAnnEdit() { document.getElementById('ann-input').value = state.announcement; openModal('ann-modal'); }
function saveAnnouncement() {
  state.announcement = document.getElementById('ann-input').value.trim() || DEFAULTS.announcement;
  saveToCloud('Announcement universally updated!');
  closeModal('ann-modal');
}

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
  saveToCloud('Hours universally updated!');
  closeModal('hours-modal');
}

function openContactEdit() { document.getElementById('contact-input').value = state.contact; openModal('contact-modal'); }
function saveContact() {
  state.contact = document.getElementById('contact-input').value.trim() || DEFAULTS.contact;
  saveToCloud('Contact info universally updated!');
  closeModal('contact-modal');
}

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
  saveToCloud(MEAL_LABELS[meal] + ' menu universally updated!');
  closeModal('meal-modal');
}

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
  saveToCloud(); // Save silently
  s.style.display = 'block';
  document.getElementById('new-password').value = '';
  document.getElementById('confirm-password').value = '';
  toast('Universal password changed successfully!');
}

// Setup background timer for the "Open/Closed" indicator
setInterval(function() {
  if(!state) return;
  var s = getStatus();
  document.getElementById('galley-status').innerHTML = '<span class="galley-status ' + s + '"><span class="dot"></span>' + (s === 'open' ? 'Now Serving' : 'Closed') + '</span>';
}, 60000);
