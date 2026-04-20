import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const state = { user:null, profile:null, customers:[] };

const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];
const toast = (msg) => {
  const old = qs('#toast-msg'); if(old) old.remove();
  const div = document.createElement('div');
  div.id = 'toast-msg';
  div.textContent = msg;
  div.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0d1f35;color:#fff;padding:12px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.12);z-index:9999';
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2500);
};
const userCol = (name) => collection(db, 'users', state.user.uid, name);
const empty = () => qs('#empty-template').innerHTML;

async function loadCustomers(){
  const snap = await getDocs(query(userCol('customers'), orderBy('createdAt', 'desc')));
  state.customers = snap.docs.map(d => ({ id:d.id, ...d.data() }));
}
async function reloadAll(){
  await loadCustomers();
  renderAll();
}
function renderAll(){
  qs('#stat-role').textContent = state.profile?.role || '—';
  qs('#stat-customers').textContent = state.customers.length;
  qs('#stat-user').textContent = state.user?.email || '—';
  renderDashboard();
  renderCustomers();
}
function renderDashboard(){
  const root = qs('#dashboard-customers');
  root.innerHTML = state.customers.length ? state.customers.slice(0,5).map(c => `
    <div class="item">
      <div class="row">
        <div>
          <div class="title">${c.name || '—'}</div>
          <div class="sub">${c.phone || '—'} · ${c.email || '—'}</div>
        </div>
      </div>
      <div class="sub">${c.notes || 'بدون ملاحظات'}</div>
    </div>
  `).join('') : empty();
}
function renderCustomers(){
  const q = (qs('#customer-search').value || '').trim().toLowerCase();
  const items = state.customers.filter(c => [c.name,c.phone,c.email,c.notes].join(' ').toLowerCase().includes(q));
  const root = qs('#customers-list');
  root.innerHTML = items.length ? items.map(c => `
    <div class="item">
      <div class="row">
        <div>
          <div class="title">${c.name || '—'}</div>
          <div class="sub">${c.phone || '—'} · ${c.email || '—'}</div>
        </div>
      </div>
      <div class="sub">${c.notes || 'بدون ملاحظات'}</div>
      <div class="item-actions">
        <button class="btn ghost" data-edit-customer="${c.id}">تعديل</button>
        <button class="btn ghost" data-delete-customer="${c.id}">حذف</button>
      </div>
    </div>
  `).join('') : empty();
}
function switchPage(page){
  qsa('.nav-link').forEach(btn => btn.classList.toggle('active', btn.dataset.page === page));
  qsa('.page').forEach(sec => sec.classList.toggle('active', sec.id === `page-${page}`));
  const titles = {
    dashboard:['لوحة التحكم','Firebase Authentication + Firestore + Roles + Customers'],
    customers:['Customers','إضافة وتعديل وحذف العملاء'],
    roles:['Roles','الصلاحيات الحالية داخل المرحلة 1'],
    settings:['Settings','خطوات التشغيل والربط']
  };
  qs('#page-title').textContent = titles[page][0];
  qs('#page-subtitle').textContent = titles[page][1];
}
function openCustomerModal(customer=null){
  qs('#customer-modal-title').textContent = customer ? 'تعديل العميل' : 'Customer';
  qs('#customer-name').value = customer?.name || '';
  qs('#customer-phone').value = customer?.phone || '';
  qs('#customer-email').value = customer?.email || '';
  qs('#customer-notes').value = customer?.notes || '';
  qs('#save-customer-btn').onclick = () => saveCustomer(customer?.id || null);
  qs('#customer-modal').showModal();
}
async function saveCustomer(id=null){
  const payload = {
    name: qs('#customer-name').value.trim(),
    phone: qs('#customer-phone').value.trim(),
    email: qs('#customer-email').value.trim(),
    notes: qs('#customer-notes').value.trim(),
    createdAt: Date.now()
  };
  if(!payload.name) return toast('اسم العميل مطلوب');
  if(id) await updateDoc(doc(userCol('customers'), id), payload);
  else await addDoc(userCol('customers'), payload);
  qs('#customer-modal').close();
  await reloadAll();
  toast('تم حفظ العميل');
}
async function removeCustomer(id){
  await deleteDoc(doc(userCol('customers'), id));
  await reloadAll();
  toast('تم حذف العميل');
}

qsa('[data-auth-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    qsa('[data-auth-tab]').forEach(b => b.classList.toggle('active', b === btn));
    const mode = btn.dataset.authTab;
    qs('#login-form').classList.toggle('active', mode === 'login');
    qs('#signup-form').classList.toggle('active', mode === 'signup');
  });
});

qs('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  await signInWithEmailAndPassword(auth, qs('#login-email').value, qs('#login-password').value);
});
qs('#signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const cred = await createUserWithEmailAndPassword(auth, qs('#signup-email').value, qs('#signup-password').value);
  await setDoc(doc(db, 'users', cred.user.uid), {
    shopName: qs('#signup-shop-name').value.trim(),
    email: cred.user.email,
    role: qs('#signup-role').value,
    createdAt: Date.now()
  });
});

qs('#logout-btn').addEventListener('click', () => signOut(auth));
qsa('.nav-link').forEach(btn => btn.addEventListener('click', () => switchPage(btn.dataset.page)));
qs('#new-customer-top').addEventListener('click', () => openCustomerModal());
qs('#new-customer-btn').addEventListener('click', () => openCustomerModal());
qs('#customer-search').addEventListener('input', renderCustomers);
qsa('[data-close]').forEach(btn => btn.addEventListener('click', () => qs('#' + btn.dataset.close).close()));

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if(!btn) return;
  if(btn.dataset.editCustomer){
    const customer = state.customers.find(c => c.id === btn.dataset.editCustomer);
    openCustomerModal(customer);
  }
  if(btn.dataset.deleteCustomer){
    await removeCustomer(btn.dataset.deleteCustomer);
  }
});

onAuthStateChanged(auth, async (user) => {
  if(!user){
    state.user = null; state.profile = null;
    qs('#auth-screen').classList.add('active');
    qs('#app-screen').classList.remove('active');
    return;
  }
  state.user = user;
  const profileSnap = await getDoc(doc(db, 'users', user.uid));
  state.profile = profileSnap.exists() ? profileSnap.data() : {};
  qs('#shop-label').textContent = state.profile.shopName || 'Workshop';
  qs('#user-label').textContent = user.email || '—';
  qs('#role-label').textContent = 'Role: ' + (state.profile.role || '—');
  qs('#auth-screen').classList.remove('active');
  qs('#app-screen').classList.add('active');
  await reloadAll();
});
