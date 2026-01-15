const months = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// mapping: monthIndex -> array of { name, date (ISO), label, icon }
const holidaysByMonth = {
  0: [
    { name: "New Year's Day (2025)", date: '2025-01-01', label: 'January 1, 2025 (Wednesday)', icon: '🎉' },
    { name: "Martin Luther King Jr. Day (2025)", date: '2025-01-20', label: 'January 20, 2025 (Monday)', icon: '🕊️' },
    { name: "National Pharmacists Day (2026)", date: '2026-01-12', label: 'January 12, 2026', icon: '💊' },
    { name: "National Popcorn Day (2026)", date: '2026-01-19', label: 'January 19, 2026', icon: '🍿' }
  ],
  1: [
    { name: "Presidents' Day (2025)", date: '2025-02-17', label: 'February 17, 2025 (Monday)', icon: '🏛️' },
    { name: "Valentine's Day (2026)", date: '2026-02-14', label: 'February 14, 2026', icon: '❤️' }
  ],
  2: [],
  3: [
    { name: "Earth Day (2026)", date: '2026-04-22', label: 'April 22, 2026', icon: '🌍' }
  ],
  4: [
    { name: "Memorial Day (2025)", date: '2025-05-26', label: 'May 26, 2025 (Monday)', icon: '🎗️' }
  ],
  5: [],
  6: [], // July - no Independence Day here
  7: [
    { name: "Independence Day (2025)", date: '2025-08-15', label: 'August 15, 2025', icon: '🇮🇳' }
  ],
  8: [
    { name: "Labor Day (2025)", date: '2025-09-01', label: 'September 1, 2025 (Monday)', icon: '🔧' }
  ],
  9: [
    { name: "Columbus Day (2025)", date: '2025-10-13', label: 'October 13, 2025 (Monday)', icon: '🧭' },
    { name: "Halloween (2026)", date: '2026-10-31', label: 'October 31, 2026', icon: '🎃' }
  ],
  10: [
    { name: "Veterans Day (2025)", date: '2025-11-11', label: 'November 11, 2025 (Tuesday)', icon: '🎖️' },
    { name: "Thanksgiving Day (2025)", date: '2025-11-27', label: 'November 27, 2025 (Thursday)', icon: '🦃' }
  ],
  11: [
    { name: "Christmas Day (2025)", date: '2025-12-25', label: 'December 25, 2025 (Thursday)', icon: '🎄' }
  ]
};

// DOM refs (assumes index.html provides these IDs)
const monthSelect = document.getElementById('monthSelect');
const holMonth = document.getElementById('holMonth'); // header span inside Holidays section
const holidayList = document.getElementById('holidayList');

const authActions = document.getElementById('authActions');
const appContent = document.getElementById('appContent');
const appControls = document.getElementById('appControls');
const signOutBtn = document.getElementById('signOutBtn');

// populate month selector
function populateMonths(){
  months.forEach((m, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = m;
    monthSelect.appendChild(opt);
  });

  // initial selection = current month
  const today = new Date();
  monthSelect.value = today.getMonth();
  monthSelect.addEventListener('change', () => {
    renderForMonth(parseInt(monthSelect.value, 10));
  });
}

function showAppForUser(user){
  if(user){
    if(authActions) authActions.style.display = 'none';
    if(signOutBtn) signOutBtn.style.display = 'inline-block';
    if(appControls) appControls.style.display = '';
    if(appContent) appContent.style.display = '';
    document.getElementById('welcome').textContent = `Welcome, ${user.name || user.email}!`;
    if(!monthSelect.querySelector('option')) populateMonths();
    renderForMonth(parseInt(monthSelect.value, 10));
  } else {
    if(authActions) authActions.style.display = '';
    if(signOutBtn) signOutBtn.style.display = 'none';
    if(appControls) appControls.style.display = 'none';
    if(appContent) appContent.style.display = 'none';
    document.getElementById('welcome').textContent = 'Welcome!';
  }
}

if(signOutBtn) signOutBtn.addEventListener('click', ()=>{
  if(window.signOut) window.signOut();
  showAppForUser(null);
});

// initialize based on current user
document.addEventListener('DOMContentLoaded', ()=>{
  const user = (window.getCurrentUser && window.getCurrentUser()) || null;
  showAppForUser(user);
});

function renderForMonth(monthIndex) {
  if (holMonth) holMonth.textContent = months[monthIndex];
  holidayList.innerHTML = '';

  const list = (holidaysByMonth[monthIndex] || []).slice();
  if (list.length === 0) {
    const li = document.createElement('li');
    li.innerHTML = '<small>No holidays listed for this month.</small>';
    holidayList.appendChild(li);
    return;
  }

  // sort by date (ISO)
  list.sort((a,b) => new Date(a.date) - new Date(b.date));

  list.forEach(h => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.gap = '10px';
    li.style.alignItems = 'center';
    li.innerHTML = `
      <div style="font-size:20px;width:36px;text-align:center;">${h.icon}</div>
      <div>
        <strong>${h.name}</strong><br/>
        <small>${h.label}</small>
      </div>
    `;
    holidayList.appendChild(li);
  });
}
