import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================
// HELPERS
// ============================
const qs = (s) => document.querySelector(s);
const qsa = (s) => document.querySelectorAll(s);

function toast(msg) {
  alert(msg);
}

// ============================
// MODAL CONTROL
// ============================
const customerModal = qs('#customer-modal');

function openCustomerModal() {
  customerModal.showModal();
}

function closeCustomerModal() {
  customerModal.close();
}

// ============================
// BUTTONS
// ============================
qs('#new-customer-btn')?.addEventListener('click', openCustomerModal);
qs('#new-customer-top')?.addEventListener('click', openCustomerModal);

qsa('[data-close="customer-modal"]').forEach(btn => {
  btn.addEventListener('click', closeCustomerModal);
});

// ============================
// SAVE CUSTOMER (🔥 المهم)
// ============================
qs('#save-customer-btn')?.addEventListener('click', async () => {
  const name = qs('#customer-name').value.trim();
  const phone = qs('#customer-phone').value.trim();
  const email = qs('#customer-email').value.trim();
  const notes = qs('#customer-notes').value.trim();

  if (!name) {
    toast("اكتب اسم العميل");
    return;
  }

  try {
    await addDoc(collection(db, "customers"), {
      name,
      phone,
      email,
      notes,
      createdAt: Date.now()
    });

    toast("تم حفظ العميل");

    // reset
    qs('#customer-name').value = '';
    qs('#customer-phone').value = '';
    qs('#customer-email').value = '';
    qs('#customer-notes').value = '';

    closeCustomerModal();
    loadCustomers();

  } catch (e) {
    console.error(e);
    toast("خطأ في الحفظ");
  }
});

// ============================
// LOAD CUSTOMERS
// ============================
async function loadCustomers() {
  const snapshot = await getDocs(collection(db, "customers"));
  const list = qs('#customers-list');

  if (!list) return;

  list.innerHTML = "";

  snapshot.forEach(doc => {
    const data = doc.data();

    list.innerHTML += `
      <div class="card">
        <h3>${data.name}</h3>
        <p>${data.phone || ''}</p>
        <small>${data.email || ''}</small>
      </div>
    `;
  });

  const stat = qs('#stat-customers');
  if (stat) stat.innerText = snapshot.size;
}

// ============================
// INIT
// ============================
loadCustomers();
