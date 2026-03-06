
const STAFF = [
  { id:1, fullName:'System Admin',   userName:'admin',        staffPassword:'admin123',  role:'ADMIN' },
  { id:2, fullName:'Receptionist 1', userName:'receptionist', staffPassword:'recept123', role:'RECEPTIONIST' }
];

let ROOM_TYPES = {};  


async function loadRoomTypes() {
  try {
    const res = await fetch('http://localhost:8080/OceanViewResort/api/roomtypes', {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('status '+res.status);
    const arr = await res.json();
    console.log('loaded room types', arr);
    ROOM_TYPES = {};
    arr.forEach(rt => {
      const priceNum = rt.pricePerNight != null ? parseFloat(rt.pricePerNight) : 0;
      const id = rt.roomTypeID;
      const name = rt.roomTypeName || 'Unknown';
      ROOM_TYPES[id] = { name, price: priceNum };
    });
    
    const sel = document.getElementById('f-roomtype');
    if (sel) {
      sel.innerHTML = '<option value="">Select room type</option>' +
        arr.map(rt => {
          const priceNum = rt.pricePerNight != null ? parseFloat(rt.pricePerNight) : 0;
          const id = rt.roomTypeID;
          const name = rt.roomTypeName || 'Unknown';
          return `<option value="${id}">${name} — LKR ${priceNum.toLocaleString()}/night</option>`;
        }).join('');
    }
  } catch (err) {
    console.error('Failed to load room types', err);
  }
}


async function loadRoomsForType(typeID) {
  const roomSel = document.getElementById('f-room');
  if (!roomSel) return;
  
  roomSel.disabled = !typeID;
 
  if (!typeID) {
    roomSel.innerHTML = '<option value="">Select room</option>';
    return;
  }
  roomSel.innerHTML = '<option value="">Loading rooms...</option>';
  try {
    const res = await fetch(`http://localhost:8080/OceanViewResort/api/roomtypes/${typeID}/rooms`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('status ' + res.status);
    const arr = await res.json();
    const options = arr
      .filter(rm => rm.status === 'AVAILABLE')
      .map(rm => `<option value="${rm.roomNumber}">${rm.roomNumber}  Floor ${rm.floorNumber}</option>`)
      .join('');
    roomSel.innerHTML = '<option value="">Select room</option>' + options;
    roomSel.disabled = false;
  } catch (e) {
    console.error('loadRoomsForType error', e);
    roomSel.innerHTML = '<option value="">Unable to load rooms</option>';
    roomSel.disabled = true;
  }
}

let reservations = [
  { id:1, resNo:'R-00001', guestName:'Amal Perera',   address:'45 Lake Road, Colombo', contact:'0771234567', email:'amal@email.com', roomTypeID:2, room:'201', checkIn:'2026-03-01', checkOut:'2026-03-05', status:'CHECKED_IN',  createdBy:'admin' },
  { id:2, resNo:'R-00002', guestName:'Sita Fernando',  address:'12 Hill St, Kandy',     contact:'0712345678', email:'',              roomTypeID:1, room:'101', checkIn:'2026-03-03', checkOut:'2026-03-06', status:'CONFIRMED',   createdBy:'admin' },
  { id:3, resNo:'R-00003', guestName:'Rohan Silva',    address:'8 Beach Lane, Matara',  contact:'0759876543', email:'',              roomTypeID:3, room:'301', checkIn:'2026-02-25', checkOut:'2026-03-01', status:'CHECKED_OUT', createdBy:'receptionist' },
];
let nextID = 4;


async function loadReservations() {
  try {
    const res = await fetch('http://localhost:8080/OceanViewResort/api/reservations', {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('status ' + res.status);
    const data = await res.json();
    console.log('Fetched reservations from API:', data);
    
    
    reservations = data.map(r => ({
      id: r.reservationID,
      resNo: r.reservationNumber || `R-${String(r.reservationID).padStart(5, '0')}`,
      guestName: '—',  
      guestID: r.guestID,
      address: '',
      contact: '',
      email: '',
      roomTypeID: r.roomTypeID || 1,  
      roomID: r.roomID,
      room: r.roomID?.toString(),
      checkIn: r.checkInDate,
      checkOut: r.checkOutDate,
      status: r.status,
      createdBy: r.createdBy
    }));
    
   
    const maxID = Math.max(...data.map(r => r.reservationID || 0), nextID - 1);
    nextID = maxID + 1;
    
  
    
    console.log('Mapped reservations:', reservations);
  } catch (err) {
    console.error('Failed to load reservations', err);
   
  }
}

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;   


if(currentUser && window.location.href.toLowerCase().includes('login.html')) {
  window.location.href = 'overview.html';
}


if(currentUser) {
  const nameEl = document.getElementById('sidebarName');
  const roleEl = document.getElementById('sidebarRole');
  if(nameEl) nameEl.textContent = currentUser.fullName;
  if(roleEl) roleEl.textContent = currentUser.role;
}   


function fetchSessionInfo() {
  return fetch('http://localhost:8080/OceanViewResort/api/auth/session', {
    method: 'GET',
    credentials: 'include'
  })
  .then(res => res.json())
  .then(sessionData => {
    console.log('Session data:', sessionData);
    return sessionData;
  })
  .catch(err => {
    console.error('Session fetch error', err);
    throw err;
  });
}

function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');
  
  if (!u || !p) {
    errEl.textContent = 'Please enter username and password.';
    errEl.style.display = 'block';
    return;
  }
  
  fetch('http://localhost:8080/OceanViewResort/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName: u, staffPassword: p })
  })
  .then(res => {
    if (!res.ok) throw new Error('Invalid credentials');
    return res.json();
  })
  .then(staff => {
    errEl.style.display = 'none';
    currentUser = staff;
    localStorage.setItem('currentUser', JSON.stringify(staff));
    console.log('Login successful. User:', staff);
    
    // Fetch and log session data then redirect
    fetchSessionInfo().finally(() => {
      window.location.href = 'overview.html';
    });
  })
  .catch(err => {
    console.error('Login error', err);
    errEl.textContent = 'Invalid username or password. Please try again.';
    errEl.style.display = 'block';
  });
}

const loginPassEl = document.getElementById('loginPass');
if(loginPassEl) {
  loginPassEl.addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
}

function doLogout() {
  
  fetch('http://localhost:8080/OceanViewResort/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  }).catch(err => console.warn('logout request failed', err));
  currentUser = null;
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}


function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showSection(name) {
  document.querySelectorAll('[id^="section-"]').forEach(s => s.style.display='none');
  document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById('section-'+name);
  if(sec) { sec.style.display='block'; sec.classList.add('fade-in'); }
  const nav = document.getElementById('nav-'+name);
  if(nav) nav.classList.add('active');
  if(name==='overview')     renderOverview();
  if(name==='reservations') renderAllTable();
}


function renderOverview() {
  // greeting and date
  const greetEl = document.getElementById('greetName');
  if(greetEl && currentUser) greetEl.textContent = currentUser.fullName;
  const dateEl = document.getElementById('todayDate');
  if(dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-GB', {weekday:'long',day:'numeric',month:'short',year:'numeric'});
  }

  document.getElementById('stat-total').textContent = reservations.length;
  document.getElementById('stat-confirmed').textContent = reservations.filter(r=>r.status==='CONFIRMED').length;
  document.getElementById('stat-checkedin').textContent = reservations.filter(r=>r.status==='CHECKED_IN').length;
  const rev = reservations.reduce((s,r)=>{
    const nights = nightsBetween(r.checkIn,r.checkOut);
    return s + nights * (ROOM_TYPES[r.roomTypeID]?.price||0);
  },0);
  document.getElementById('stat-revenue').textContent = rev.toLocaleString();

  const tbody = document.getElementById('recentTableBody');
  const recent = [...reservations].reverse().slice(0,5);
  tbody.innerHTML = recent.map(r=>{
    let actions = '';
    if(r.status === 'CHECKED_IN') {
      actions = `<button class="btn-outline" style="padding:6px 12px;font-size:12px;" onclick="viewReservation(${r.id})">View</button><button class="btn-primary" style="padding:6px 12px;font-size:12px;" onclick="goToCheckOut(${r.id})">Check Out</button>`;
    } else if(r.status === 'CONFIRMED') {
      actions = `<button class="btn-outline" style="padding:6px 12px;font-size:12px;" onclick="viewReservation(${r.id})">View</button><button class="btn-primary" style="padding:6px 12px;font-size:12px;" onclick="doCheckIn(${r.id})">Check In</button><button class="btn-danger" style="padding:6px 12px;font-size:12px;" onclick="cancelRes(${r.id})">Cancel</button>`;
    } else if(r.status === 'CHECKED_OUT') {
      actions = `<button class="btn-outline" style="padding:6px 12px;font-size:12px;" onclick="viewReservation(${r.id})">View</button>`;
    }
    return `
    <tr>
      <td><b style="color:var(--ocean)">${r.resNo}</b></td>
      <td>${r.guestName}</td>
      <td>${ROOM_TYPES[r.roomTypeID]?.name||'-'}</td>
      <td>${formatDate(r.checkIn)}</td>
      <td>${formatDate(r.checkOut)}</td>
      <td>${statusBadge(r.status)}</td>
      <td><div style="display:flex;gap:6px;">${actions}</div></td>
    </tr>`;
  }).join('');
}


function doCheckIn(id) {
  const r = reservations.find(x=>x.id===id);
  if(r) r.status='CHECKED_IN';
  // re-render the current page
  if(document.getElementById('allResTableBody')) renderAllTable();
  if(document.getElementById('stat-total')) renderOverview();
}

function goToCheckOut(id) {
  const r = reservations.find(x=>x.id===id);
  if(r) {
    sessionStorage.setItem('billingResNo', r.resNo);
    window.location.href = 'billing.html';
  }
}


function renderAllTable(list) {
  const data = list || reservations;
  const tbody = document.getElementById('allResTableBody');
  tbody.innerHTML = data.map(r=>{
    let actions = '';
    if(r.status === 'CHECKED_IN') {
      actions = `<button class="btn-outline" style="padding:6px 12px;font-size:12px;" onclick="viewReservation(${r.id})">View</button><button class="btn-primary" style="padding:6px 12px;font-size:12px;" onclick="goToCheckOut(${r.id})">Check Out</button>`;
    } else if(r.status === 'CONFIRMED') {
      actions = `<button class="btn-outline" style="padding:6px 12px;font-size:12px;" onclick="viewReservation(${r.id})">View</button><button class="btn-primary" style="padding:6px 12px;font-size:12px;" onclick="doCheckIn(${r.id})">Check In</button><button class="btn-danger" style="padding:6px 12px;font-size:12px;" onclick="cancelRes(${r.id})">Cancel</button>`;
    } else if(r.status === 'CHECKED_OUT') {
      actions = `<button class="btn-outline" style="padding:6px 12px;font-size:12px;" onclick="viewReservation(${r.id})">View</button>`;
    }
    return `
    <tr>
      <td><b style="color:var(--ocean)">${r.resNo}</b></td>
      <td>${r.guestName}</td>
      <td>${r.contact}</td>
      <td>${ROOM_TYPES[r.roomTypeID]?.name||'-'}</td>
      <td>${formatDate(r.checkIn)}</td>
      <td>${formatDate(r.checkOut)}</td>
      <td>${statusBadge(r.status)}</td>
      <td><div style="display:flex;gap:6px;">${actions}</div></td>
    </tr>`;
  }).join('');
  document.getElementById('noResults').style.display = data.length===0 ? 'block' : 'none';
}

function filterTable() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const st = document.getElementById('statusFilter').value;
  const filtered = reservations.filter(r =>
    (r.guestName.toLowerCase().includes(q) || r.resNo.toLowerCase().includes(q)) &&
    (st==='' || r.status===st)
  );
  renderAllTable(filtered);
}


function viewReservation(id) {
  const r = reservations.find(x=>x.id===id);
  if(!r) return;
  const nights = nightsBetween(r.checkIn,r.checkOut);
  const price = ROOM_TYPES[r.roomTypeID]?.price||0;
  const total = nights * price;
  document.getElementById('viewModalContent').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
      ${field('Reservation No.', `<b style="color:var(--ocean)">${r.resNo}</b>`) }
      ${field('Status', statusBadge(r.status)) }
      ${field('Guest Name', r.guestName)}
      ${field('Contact', r.contact)}
      ${field('Address', r.address||'—')}
      ${field('Email', r.email||'—')}
      ${field('Room Type', ROOM_TYPES[r.roomTypeID]?.name||'—')}
      ${field('Room Number', r.room||'—')}
      ${field('Check-In', formatDate(r.checkIn))}
      ${field('Check-Out', formatDate(r.checkOut))}
      ${field('Duration', nights+' night'+(nights!==1?'s':''))}
      ${field('Est. Total', 'LKR '+total.toLocaleString())}
    </div>`;
  document.getElementById('viewModal').style.display='flex';
}

function field(label, val) {
  return `<div style="background:var(--foam);border-radius:10px;padding:14px;">
    <p style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#7a9aaa;margin-bottom:4px;">${label}</p>
    <p style="font-size:14px;font-weight:500;">${val}</p>
  </div>`;
}




function updatePreview() {
  const ci = document.getElementById('f-checkin').value;
  const co = document.getElementById('f-checkout').value;
  const rt = document.getElementById('f-roomtype').value;
  const prev = document.getElementById('pricePreview');
  if(ci && co && rt && co > ci) {
    const nights = nightsBetween(ci, co);
    const price = ROOM_TYPES[rt]?.price || 0;
    document.getElementById('previewNights').textContent = `${nights} night${nights!==1?'s':''} × LKR ${price.toLocaleString()}`;
    document.getElementById('previewTotal').textContent = 'LKR ' + (nights*price).toLocaleString();
    prev.style.display='block';
  } else {
    prev.style.display='none';
  }
}

function addReservation() {
  const name    = document.getElementById('f-name').value.trim();
  const contact = document.getElementById('f-contact').value.trim();
  const address = document.getElementById('f-address').value.trim();
  const email   = document.getElementById('f-email').value.trim();
  const rtID    = document.getElementById('f-roomtype').value;
  const room    = document.getElementById('f-room').value;
  let ci        = document.getElementById('f-checkin').value;
  const co      = document.getElementById('f-checkout').value;
  const alertEl = document.getElementById('formAlert');

  if(!name||!contact||!rtID||!co) {
    alertEl.className='alert alert-error'; alertEl.textContent='Please fill in all required fields (*).'; alertEl.style.display='block'; return;
  }
  if(!checkInNow && !ci) {
    alertEl.className='alert alert-error'; alertEl.textContent='Please select a check-in date or tick "Guest is checking in right now".'; alertEl.style.display='block'; return;
  }
  if(!room) {
    alertEl.className='alert alert-error'; alertEl.textContent='Please choose a room number.'; alertEl.style.display='block'; return;
  }
  
  
  if(checkInNow) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    ci = `${yyyy}-${mm}-${dd}`;
  }
  
  if(co <= ci) {
    alertEl.className='alert alert-error'; alertEl.textContent='Check-out date must be after check-in date.'; alertEl.style.display='block'; return;
  }


  const payload = {
    guestName: name,
    address: address,
    contactNumber: contact,
    email: email,
    roomID: parseInt(room),
    checkInDate: ci,
    checkOutDate: co,
    checkInNow: checkInNow
  };

  fetch('http://localhost:8080/OceanViewResort/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  })
  .then(res => {
    if (!res.ok) throw new Error('Status ' + res.status);
    return res.json();
  })
  .then(data => {
    alertEl.style.display='none';
    clearForm();
    document.getElementById('successMsg').textContent = `Reservation ${data.resNo || data.guestName} has been successfully created.`;
    document.getElementById('successModal').style.display='flex';
  })
  .catch(err => {
    console.error('addReservation error', err);
    alertEl.className='alert alert-error';
    alertEl.textContent = 'Failed to create reservation. Please try again.';
    alertEl.style.display='block';
  });
}

function toggleCheckInNow() {
  checkInNow = !checkInNow;
  const box  = document.getElementById('checkinNowBox');
  const tick = document.getElementById('checkinNowTick');
  const checkinInput = document.getElementById('f-checkin');
  
  if(checkInNow) {
  
    box.style.borderColor  = 'var(--ocean)';
    box.style.background   = 'var(--foam)';
    tick.style.background  = 'var(--ocean)';
    tick.style.borderColor = 'var(--ocean)';
    tick.innerHTML         = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    
    
    if(checkinInput) {
      checkinInput.disabled = true;
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      checkinInput.value = `${yyyy}-${mm}-${dd}`;
    }
  } else {
    
    box.style.borderColor  = '#d0dde2';
    box.style.background   = '#f9fbfc';
    tick.style.background  = 'transparent';
    tick.style.borderColor = '#d0dde2';
    tick.innerHTML         = '';
    
  
    if(checkinInput) {
      checkinInput.disabled = false;
      checkinInput.value = '';
    }
  }
  
  updatePreview();
}

function clearForm() {
  ['f-name','f-contact','f-address','f-email','f-room','f-checkin','f-checkout'].forEach(id => document.getElementById(id).value='');
  document.getElementById('f-roomtype').value='';
  loadRoomsForType(''); // reset room list
  document.getElementById('pricePreview').style.display='none';
  document.getElementById('formAlert').style.display='none';
  if(checkInNow) toggleCheckInNow();
}


let checkInNow = false;


let currentBillRes = null;

function findBill() {
  const q = document.getElementById('billSearch').value.trim().toUpperCase();
  const r = reservations.find(x => x.resNo === q);
  const errEl = document.getElementById('billError');
  if(!r) {
    errEl.textContent = `No reservation found for "${q}". Please check the number.`;
    errEl.style.display='block';
    document.getElementById('billResult').style.display='none';
    return;
  }
  errEl.style.display='none';
  currentBillRes = r;
  renderBill(r);
  document.getElementById('billResult').style.display='block';
}

function renderBill(r) {
  const nights = nightsBetween(r.checkIn, r.checkOut);
  const price  = ROOM_TYPES[r.roomTypeID]?.price || 0;
  const sub    = nights * price;
  const tax    = sub * 0.10;
  const total  = sub + tax;

  document.getElementById('bill-resNo').textContent = r.resNo;
  document.getElementById('billGuestInfo').innerHTML = `
    <div style="display:grid;gap:6px;">
      <div style="display:flex;justify-content:space-between;font-size:14px;"><span style="color:#aaa;">Guest</span><b>${r.guestName}</b></div>
      <div style="display:flex;justify-content:space-between;font-size:14px;"><span style="color:#aaa;">Contact</span><span>${r.contact}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:14px;"><span style="color:#aaa;">Room</span><span>${ROOM_TYPES[r.roomTypeID]?.name} — Room ${r.room}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:14px;"><span style="color:#aaa;">Period</span><span>${formatDate(r.checkIn)} → ${formatDate(r.checkOut)}</span></div>
    </div>`;

  document.getElementById('billCharges').innerHTML = `
    <div class="bill-row"><span>${nights} night${nights!==1?'s':''} × LKR ${price.toLocaleString()}</span><span>LKR ${sub.toLocaleString()}</span></div>
    <div class="bill-row"><span>Tax (10%)</span><span>LKR ${tax.toLocaleString()}</span></div>`;

  document.getElementById('billTotalRow').innerHTML = `
    <div class="bill-total"><span>Total Amount</span><span>LKR ${total.toLocaleString()}</span></div>
    <div style="text-align:right;margin-top:6px;">${statusBadge(r.status==='CHECKED_OUT'?'CHECKED_OUT':'CONFIRMED')}</div>`;
}

function printBill() {
  window.print();
}

function markPaid() {
  if(!currentBillRes) return;
  const r = reservations.find(x=>x.id===currentBillRes.id);
  if(r) r.status='CHECKED_OUT';
  renderBill(r);
}


function cancelRes(id) {
  if(!confirm('Cancel this reservation?')) return;
  const r = reservations.find(x=>x.id===id);
  if(r) r.status='CANCELLED';
  // re-render the current page
  if(document.getElementById('allResTableBody')) renderAllTable();
  if(document.getElementById('stat-total')) renderOverview();
}


function closeModal(id) {
  document.getElementById(id).style.display='none';
}


document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', function(e) { if(e.target===this) this.style.display='none'; });
});


function nightsBetween(a, b) {
  return Math.max(0, Math.round((new Date(b)-new Date(a))/(1000*60*60*24)));
}
function formatDate(d) {
  if(!d) return '—';
  return new Date(d+'T00:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
}
function statusBadge(s) {
  const map = { CONFIRMED:'badge-confirmed', CHECKED_IN:'badge-checkin', CHECKED_OUT:'badge-checkout', CANCELLED:'badge-cancelled' };
  const labels = { CONFIRMED:'Confirmed', CHECKED_IN:'Checked In', CHECKED_OUT:'Checked Out', CANCELLED:'Cancelled' };
  return `<span class="badge ${map[s]||''}">${labels[s]||s}</span>`;
}


document.addEventListener('DOMContentLoaded', () => {
 
  if(!currentUser && !window.location.href.toLowerCase().includes('login.html')) {
    window.location.href = 'login.html';
    return; 
  }


  const needsReservations = document.getElementById('stat-total') || document.getElementById('allResTableBody');
  if(needsReservations) {
    loadReservations().then(() => {
      if(document.getElementById('stat-total')) renderOverview();
      if(document.getElementById('allResTableBody')) renderAllTable();
    });
  }
  
  if(!window.location.href.toLowerCase().includes('login.html')) {
    fetchSessionInfo().catch(()=>{}); // ignore errors
  }
  
  ['f-checkin','f-checkout','f-roomtype'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('change', () => {
      updatePreview();
      if(id === 'f-roomtype') {
        loadRoomsForType(el.value);
      }
    });
  });
  
  if(document.getElementById('f-roomtype')) {
    
    loadRoomsForType('');
    loadRoomTypes().then(()=>{
      
      const rtSel = document.getElementById('f-roomtype');
      if(rtSel && rtSel.value) loadRoomsForType(rtSel.value);
    });
  }
  

  const billingResNo = sessionStorage.getItem('billingResNo');
  if(billingResNo) {
    const billSearchEl = document.getElementById('billSearch');
    if(billSearchEl) {
      billSearchEl.value = billingResNo;
      
      setTimeout(() => findBill(), 100);
      sessionStorage.removeItem('billingResNo');
    }
  }
});


