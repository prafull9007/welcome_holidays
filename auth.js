// Minimal client-side auth demo for welcome-holidays
// Stores demo users in localStorage under 'wh_users' (NOT for production)

function getUsers(){
  try{ return JSON.parse(localStorage.getItem('wh_users')||'[]'); }catch(e){ return []; }
}
function setUsers(u){ localStorage.setItem('wh_users', JSON.stringify(u)); }

function getCurrentUser(){
  try{ return JSON.parse(localStorage.getItem('wh_currentUser')||'null'); }catch(e){ return null; }
}
function signOut(){ localStorage.removeItem('wh_currentUser'); }

function showMsg(el, msg, ok=true){
  if(!el) return;
  el.textContent = msg;
  el.style.color = ok ? 'green' : 'crimson';
}

// Seed users from db.json on first load (if `wh_users` not present)
function seedFromDb(){
  try{
    if(localStorage.getItem('wh_users')) return Promise.resolve();
    return fetch('db.json').then(r=>r.json()).then(data=>{
      if(data && Array.isArray(data.users)) setUsers(data.users);
    }).catch(()=>{});
  }catch(e){ return Promise.resolve(); }
}

document.addEventListener('DOMContentLoaded', ()=>{
  seedFromDb().then(()=>{
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');

    if(signupForm){
      signupForm.addEventListener('submit', async e=>{
        e.preventDefault();
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim().toLowerCase();
        const pw = document.getElementById('signupPassword').value;
        const pw2 = document.getElementById('signupPassword2').value;
        const msgEl = document.getElementById('signupMsg');

        if(pw !== pw2){ showMsg(msgEl, 'Passwords do not match', false); return; }
        if(pw.length < 6){ showMsg(msgEl, 'Password too short', false); return; }

        // Try server-side signup first
        try{
          const res = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password: pw })
          });

          if(res.status === 201){
            showMsg(msgEl, 'Account created — signing in...');
            // set session via helper that writes localStorage and redirects
            setTimeout(()=> location.href = `/set_session?email=${encodeURIComponent(email)}` , 700);
            return;
          }

          if(res.status === 409){ showMsg(msgEl, 'Email already registered', false); return; }

          // other non-OK: fall through to fallback
        }catch(err){
          // server not available — fallback to localStorage
        }

        // Fallback behaviour: localStorage-only (legacy)
        const users = getUsers();
        if(users.find(u=>u.email===email)){ showMsg(msgEl, 'Email already registered', false); return; }

        users.push({ name, email, password: pw });
        setUsers(users);
        showMsg(msgEl, 'Account created — redirecting...');
        setTimeout(()=> location.href = 'login.html', 900);
      });
    }

    if(loginForm){
      loginForm.addEventListener('submit', async e=>{
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const pw = document.getElementById('loginPassword').value;
        const remember = document.getElementById('loginRemember').checked;
        const msgEl = document.getElementById('loginMsg');

        // Try server-side login first
        try{
          const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pw })
          });

          if(res.status === 200){
            const user = await res.json();
            const cur = { email: user.email, name: user.name };
            localStorage.setItem('wh_currentUser', JSON.stringify(cur));
            showMsg(msgEl, 'Signed in — redirecting...');
            setTimeout(()=> location.href = 'index.html', 700);
            return;
          }

          if(res.status === 401){ showMsg(msgEl, 'Invalid credentials', false); return; }
        }catch(err){
          // server not available — fallback to localStorage
        }

        // Fallback: localStorage lookup (legacy)
        const users = getUsers();
        const user = users.find(u=>u.email===email && u.password===pw);
        if(!user){ showMsg(msgEl, 'Invalid credentials', false); return; }

        localStorage.setItem('wh_currentUser', JSON.stringify({ email: user.email, name: user.name }));
        showMsg(msgEl, 'Signed in — redirecting...');
        setTimeout(()=> location.href = 'index.html', 700);
      });
    }
  });
});

// expose helper on window for other scripts
window.getCurrentUser = getCurrentUser;
window.signOut = signOut;
