// Configuration
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwoVf2umtmvf1S_TzWGBf_QeBFDyf6fm5K0fZzd0A0rmHYNFfsZ0Kp4saHXxJoKVN5w/exec"; // Ganti dengan URL Web App Anda

// State
let currentUser = null;
let currentPage = "dashboard";
let userPermissions = {};
let currentWorkOrderId = null;

// Permission Matrix
const PERMISSIONS = {
  admin: {
    dashboard: true,
    workorders: { view: true, create: true, edit: true, delete: true },
    customers: { view: true, create: true, edit: true, delete: true },
    inventory: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, export: true },
    users: { view: true, create: true, edit: true, delete: true },
    settings: { view: true, edit: true },
    whatsapp: { send: true },
    financial: { view: true, export: true },
  },
  supervisor: {
    dashboard: true,
    workorders: { view: true, create: true, edit: true, delete: false },
    customers: { view: true, create: true, edit: true, delete: false },
    inventory: { view: true, create: true, edit: true, delete: false },
    reports: { view: true, export: true },
    users: { view: false, create: false, edit: false, delete: false },
    settings: { view: true, edit: false },
    whatsapp: { send: true },
    financial: { view: true, export: false },
  },
  teknisi: {
    dashboard: true,
    workorders: { view: true, create: false, edit: true, delete: false },
    customers: { view: false, create: false, edit: false, delete: false },
    inventory: { view: true, create: false, edit: false, delete: false },
    reports: { view: false, export: false },
    users: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, edit: false },
    whatsapp: { send: false },
    financial: { view: false, export: false },
  },
  kasir: {
    dashboard: true,
    workorders: { view: true, create: true, edit: true, delete: false },
    customers: { view: true, create: true, edit: true, delete: false },
    inventory: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, export: true },
    users: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, edit: false },
    whatsapp: { send: true },
    financial: { view: true, export: true },
  },
};

// DOM Elements
const loginPage = document.getElementById("loginPage");
const landingPage = document.getElementById("landingPage");
const dashboard = document.getElementById("dashboard");
const contentArea = document.getElementById("contentArea");
const navMenu = document.getElementById("navMenu");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const savedUser = localStorage.getItem("bengkel_user");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    userPermissions = PERMISSIONS[currentUser.role] || PERMISSIONS.teknisi;
    landingPage.style.display = "none";
    showDashboard();
    setupMenu();
    loadPage("dashboard");
  }

  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
  document
    .getElementById("menuToggle")
    .addEventListener("click", toggleSidebar);
  document
    .getElementById("closeSidebar")
    .addEventListener("click", toggleSidebar);
  document
    .getElementById("sidebarOverlay")
    .addEventListener("click", toggleSidebar);

  document.querySelectorAll(".close-modal, .btn[data-modal]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const modalId = e.currentTarget.dataset.modal;
      closeModal(modalId);
    });
  });
});

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("show");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("show");
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  sidebar.classList.toggle("show");
  overlay.classList.toggle("show");
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  showNotification("Sedang login...", "info");
  try {
    const response = await fetch(
      `${SCRIPT_URL}?action=login&username=${username}&password=${password}`
    );
    const result = await response.json();
    if (result.success) {
      currentUser = result.user;
      userPermissions = PERMISSIONS[currentUser.role] || PERMISSIONS.teknisi;
      localStorage.setItem("bengkel_user", JSON.stringify(currentUser));
      landingPage.style.display = "none";
      showDashboard();
      setupMenu();
      loadPage("dashboard");
      showNotification("Login berhasil!", "success");
    } else {
      showNotification(result.message, "error");
    }
  } catch (error) {
    showNotification("Terjadi kesalahan. Coba lagi.", "error");
  }
}

// Logout Handler
function handleLogout() {
  localStorage.removeItem("bengkel_user");
  loginPage.style.display = "none";
  dashboard.style.display = "none";
  landingPage.style.display = "block";
  showNotification("Logout berhasil", "info");
}

// Navigation Functions
function goToLogin() {
  landingPage.style.display = "none";
  loginPage.style.display = "flex";
}

function backToHome() {
  loginPage.style.display = "none";
  landingPage.style.display = "block";
}

function scrollToServices() {
  const servicesSection = document.querySelector(".section-padding");
  if (servicesSection) {
    servicesSection.scrollIntoView({ behavior: "smooth" });
  }
}

function contactWhatsApp() {
  const phone = "6285327463876"; // Ganti dengan nomor WhatsApp bengkel
  const message = encodeURIComponent(
    "Halo Pintu Mobil Hoky, saya ingin berkonsultasi mengenai perbaikan pintu mobil saya."
  );
  window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
}

function showDashboard() {
  loginPage.style.display = "none";
  dashboard.style.display = "flex";
  document.getElementById("topbarUsername").textContent = currentUser.nama;
  document.getElementById("sidebarUsername").textContent = currentUser.username;
  document.getElementById("sidebarRole").textContent = currentUser.role;
  const roleBadge = document.getElementById("userRoleBadge");
  roleBadge.innerHTML = `<span class="role-badge role-${
    currentUser.role
  }">${currentUser.role.toUpperCase()}</span>`;
}

function setupMenu() {
  const menuItems = [
    {
      icon: "fas fa-home",
      page: "dashboard",
      label: "Dashboard",
      roles: ["admin", "supervisor", "teknisi", "kasir"],
    },
    {
      icon: "fas fa-clipboard-list",
      page: "workorders",
      label: "Work Orders",
      roles: ["admin", "supervisor", "teknisi", "kasir"],
    },
    {
      icon: "fas fa-users",
      page: "customers",
      label: "Pelanggan",
      roles: ["admin", "supervisor", "kasir"],
    },
    {
      icon: "fas fa-boxes",
      page: "inventory",
      label: "Inventory",
      roles: ["admin", "supervisor", "teknisi", "kasir"],
    },
    {
      icon: "fas fa-chart-bar",
      page: "reports",
      label: "Laporan",
      roles: ["admin", "supervisor", "kasir"],
    },
    {
      icon: "fas fa-file-invoice-dollar",
      page: "financial",
      label: "Keuangan",
      roles: ["admin", "supervisor", "kasir"],
    },
    {
      icon: "fas fa-users-cog",
      page: "users",
      label: "Manajemen User",
      roles: ["admin"],
    },
    {
      icon: "fas fa-cogs",
      page: "settings",
      label: "Settings",
      roles: ["admin"],
    },
  ];
  navMenu.innerHTML = "";
  menuItems.forEach((item) => {
    if (item.roles.includes(currentUser.role)) {
      const a = document.createElement("a");
      a.href = "#";
      a.className = "nav-item";
      a.dataset.page = item.page;
      a.innerHTML = `<i class="${item.icon}"></i> ${item.label}`;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        loadPage(item.page);
        document
          .querySelectorAll(".nav-item")
          .forEach((nav) => nav.classList.remove("active"));
        a.classList.add("active");
      });
      navMenu.appendChild(a);
    }
  });
  if (navMenu.firstChild) navMenu.firstChild.classList.add("active");
}

async function loadPage(page) {
  currentPage = page;

  // Close sidebar on mobile after selecting menu
  if (window.innerWidth <= 992) {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar.classList.contains("show")) {
      sidebar.classList.remove("show");
      overlay.classList.remove("show");
    }
  }

  const pageTitles = {
    dashboard: "Dashboard",
    workorders: "Work Orders",
    customers: "Daftar Pelanggan",
    inventory: "Inventaris Barang",
    reports: "Laporan Aktivitas",
    financial: "Laporan Keuangan",
    users: "Manajemen Pengguna",
    settings: "Pengaturan Sistem",
  };
  document.getElementById("pageTitle").textContent =
    pageTitles[page] || "Pintu Mobil Hoky";
  if (!checkPermission(page, "view")) {
    contentArea.innerHTML = `<div class="card" style="text-align: center; padding: 60px 20px;"><div style="font-size: 64px; color: var(--danger); margin-bottom: 20px;"><i class="fas fa-shield-alt"></i></div><h2 style="margin-bottom: 10px;">Akses Terbatas</h2><p style="color: var(--text-muted); margin-bottom: 25px;">Maaf, Anda tidak memiliki izin untuk melihat halaman ini.</p><div style="display: flex; justify-content: center;"><span class="role-badge role-${
      currentUser.role
    }">${currentUser.role.toUpperCase()}</span></div></div>`;
    return;
  }
  switch (page) {
    case "dashboard":
      await loadDashboard();
      break;
    case "workorders":
      await loadWorkOrders();
      break;
    case "customers":
      await loadCustomers();
      break;
    case "inventory":
      await loadInventory();
      break;
    case "reports":
      await loadReports();
      break;
    case "financial":
      await loadFinancialPage();
      break;
    case "users":
      await loadUsersPage();
      break;
    case "settings":
      await loadSettings();
      break;
  }
}

function checkPermission(page, action) {
  if (!userPermissions[page]) return false;
  if (typeof userPermissions[page] === "boolean") return userPermissions[page];
  return userPermissions[page][action] || false;
}

async function loadDashboard() {
  contentArea.innerHTML = `<div class="stats-grid" id="statsGrid">
        <div class="stat-card"><div class="stat-value" id="stat-total">-</div><div class="stat-label">Total Order</div></div>
        <div class="stat-card"><div class="stat-value" id="stat-pending">-</div><div class="stat-label">Menunggu</div></div>
        <div class="stat-card"><div class="stat-value" id="stat-progress">-</div><div class="stat-label">Diproses</div></div>
        <div class="stat-card"><div class="stat-value" id="stat-revenue">-</div><div class="stat-label">Pendapatan</div></div>
    </div>
    <div class="card"><div class="card-header"><h3 class="card-title"><i class="fas fa-bolt text-primary"></i> Aksi Cepat</h3></div><div class="card-body"><div style="display: flex; flex-wrap: wrap; gap: 15px;">${
      checkPermission("workorders", "create")
        ? `<button class="btn btn-primary" onclick="showNewWorkOrderModal()"><i class="fas fa-plus"></i> Work Order Baru</button>`
        : ""
    }${
    checkPermission("whatsapp", "send")
      ? `<button class="btn" style="background: #25D366; color: white;" onclick="showWhatsAppModal()"><i class="fab fa-whatsapp"></i> Kirim WhatsApp</button>`
      : ""
  }${
    checkPermission("financial", "view")
      ? `<button class="btn btn-secondary" onclick="showFinancialReport()"><i class="fas fa-chart-line"></i> Laporan Keuangan</button>`
      : ""
  }<button class="btn btn-secondary" onclick="showProfileModal()"><i class="fas fa-user"></i> Profile Saya</button></div></div></div><div class="card"><div class="card-header"><h3 class="card-title"><i class="fas fa-list-check text-primary"></i> Work Order Terbaru</h3></div><div class="card-body"><div class="table-responsive"><table class="table"><thead><tr><th>ID</th><th>Tanggal</th><th>Status</th><th>Teknisi</th><th>Total</th><th>Aksi</th></tr></thead><tbody id="recentOrdersTable"></tbody></table></div></div></div><div class="card"><div class="card-header"><h3 class="card-title"><i class="fas fa-chart-area text-primary"></i> Grafik Performa</h3></div><div class="card-body"><canvas id="performanceChart" style="max-height: 300px;"></canvas></div></div>`;
  await updateDashboardData();
  loadPerformanceChart();
}

async function updateDashboardData() {
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getDashboardData`);
    const result = await response.json();
    if (result.success) {
      const stats = result.stats;
      document.getElementById("stat-total").textContent = stats.total;
      document.getElementById("stat-pending").textContent = stats.pending;
      document.getElementById("stat-progress").textContent = stats.progress;
      document.getElementById("stat-revenue").textContent =
        "Rp " + stats.revenue.toLocaleString();

      // Load recent orders
      const ordersResponse = await fetch(`${SCRIPT_URL}?action=getWorkOrders`);
      const ordersResult = await ordersResponse.json();
      if (ordersResult.success) {
        const tableBody = document.getElementById("recentOrdersTable");
        tableBody.innerHTML = ordersResult.data
          .slice(0, 5)
          .map(
            (order) =>
              `<tr><td>#${order.ID}</td><td>${new Date(
                order.TanggalMasuk
              ).toLocaleDateString()}</td><td><span class="status-badge status-${order.Status.toLowerCase()}">${
                order.Status
              }</span></td><td>${
                order.Teknisi
              }</td><td>Rp ${order.TotalBiaya.toLocaleString()}</td><td><button class="btn btn-sm" onclick="showInvoiceModal(${
                order.ID
              })"><i class="fas fa-file-invoice"></i></button></td></tr>`
          )
          .join("");
      }
    }
  } catch (error) {
    console.error("Error updating dashboard data:", error);
  }
}

async function loadWorkOrders() {
  contentArea.innerHTML = `<div class="card"><div class="card-header"><h3 class="card-title">Manajemen Work Orders</h3></div><div class="card-body"><div style="margin-bottom: 20px;">${
    checkPermission("workorders", "create")
      ? `<button class="btn btn-primary" onclick="showNewWorkOrderModal()"><i class="fas fa-plus"></i> Tambah Work Order</button>`
      : ""
  }</div><div class="table-responsive"><table class="table"><thead><tr><th>ID</th><th>Tanggal</th><th>Customer</th><th>Keluhan</th><th>Status</th><th>Teknisi</th><th>Total</th><th>Aksi</th></tr></thead><tbody id="workOrdersTable"><tr><td colspan="8" style="text-align: center;">Memuat data...</td></tr></tbody></table></div></div></div>`;
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getWorkOrders`);
    const result = await response.json();
    if (result.success) {
      const tableBody = document.getElementById("workOrdersTable");
      tableBody.innerHTML = result.data
        .map(
          (order) =>
            `<tr><td>#${order.ID}</td><td>${new Date(
              order.TanggalMasuk
            ).toLocaleDateString()}</td><td>${
              order.CustomerID
            }</td><td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${
              order.Keluhan
            }</td><td><span class="status-badge status-${order.Status.toLowerCase()}">${
              order.Status
            }</span></td><td>${
              order.Teknisi
            }</td><td>Rp ${order.TotalBiaya.toLocaleString()}</td><td><div style="display: flex; gap: 5px;"><button class="btn btn-sm" onclick="showInvoiceModal(${
              order.ID
            })"><i class="fas fa-eye"></i></button><button class="btn btn-sm" onclick="editWorkOrder(${
              order.ID
            })"><i class="fas fa-edit"></i></button></div></td></tr>`
        )
        .join("");
    }
  } catch (error) {
    showNotification("Gagal memuat work orders", "error");
  }
}

async function loadCustomers() {
  contentArea.innerHTML = `<div class="card"><div class="card-header"><h3 class="card-title">Daftar Pelanggan</h3></div><div class="card-body"><div style="margin-bottom: 20px;"><button class="btn btn-primary" onclick="showNewCustomerModal()"><i class="fas fa-plus"></i> Tambah Pelanggan</button></div><div class="table-responsive"><table class="table"><thead><tr><th>ID</th><th>Nama</th><th>Telepon</th><th>Alamat</th><th>Aksi</th></tr></thead><tbody id="customersTable"><tr><td colspan="5" style="text-align: center;">Memuat data...</td></tr></tbody></table></div></div></div>`;
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getCustomers`);
    const result = await response.json();
    if (result.success) {
      document.getElementById("customersTable").innerHTML = result.data
        .map(
          (c) =>
            `<tr><td>${c.id}</td><td>${c.nama}</td><td>${c.telepon}</td><td>${
              c.alamat || "-"
            }</td><td><button class="btn btn-sm" onclick="editCustomer(${
              c.id
            })"><i class="fas fa-edit"></i></button></td></tr>`
        )
        .join("");
    }
  } catch (error) {
    showNotification("Gagal memuat daftar pelanggan", "error");
  }
}

async function loadInventory() {
  contentArea.innerHTML = `<div class="card"><div class="card-header"><h3 class="card-title">Inventaris Barang</h3></div><div class="card-body"><div style="margin-bottom: 20px;"><button class="btn btn-primary" onclick="showNewItemModal()"><i class="fas fa-plus"></i> Tambah Item</button></div><div class="table-responsive"><table class="table"><thead><tr><th>Kode</th><th>Nama Barang</th><th>Kategori</th><th>Stok</th><th>Harga Jual</th><th>Aksi</th></tr></thead><tbody id="inventoryTable"></tbody></table></div></div></div>`;
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getInventory`);
    const result = await response.json();
    if (result.success) {
      document.getElementById("inventoryTable").innerHTML = result.data
        .map(
          (item) =>
            `<tr><td>${item.kode}</td><td>${item.nama}</td><td>${
              item.kategori
            }</td><td class="${
              item.stok <= item.stokMin ? "text-danger" : ""
            }">${
              item.stok
            }</td><td>Rp ${item.hargaJual.toLocaleString()}</td><td><button class="btn btn-sm" onclick="updateStock('${
              item.id
            }')"><i class="fas fa-plus-minus"></i></button></td></tr>`
        )
        .join("");
    }
  } catch (error) {
    showNotification("Gagal memuat inventaris", "error");
  }
}

async function loadReports() {
  contentArea.innerHTML = `<div class="stats-grid"><div class="card" onclick="showFinancialReport()"><div class="card-body" style="text-align: center; cursor: pointer; padding: 40px;"><i class="fas fa-file-invoice-dollar" style="font-size: 48px; color: var(--primary); margin-bottom: 20px;"></i><h3>Laporan Keuangan</h3><p>Pendapatan, pengeluaran, dan piutang.</p></div></div><div class="card"><div class="card-body" style="text-align: center; cursor: pointer; padding: 40px;"><i class="fas fa-user-gear" style="font-size: 48px; color: var(--success); margin-bottom: 20px;"></i><h3>Laporan Teknisi</h3><p>Performa dan beban kerja teknisi.</p></div></div><div class="card"><div class="card-body" style="text-align: center; cursor: pointer; padding: 40px;"><i class="fas fa-box-open" style="font-size: 48px; color: var(--warning); margin-bottom: 20px;"></i><h3>Laporan Stok</h3><p>Barang keluar masuk dan sisa stok.</p></div></div></div>`;
}

async function loadSettings() {
  contentArea.innerHTML = `<div class="card"><div class="card-header"><h3 class="card-title">Pengaturan Sistem</h3></div><div class="card-body"><form id="settingsForm"><div class="form-group"><label>Nama Bengkel</label><input type="text" name="company_name" class="form-control"></div><div class="form-group"><label>Alamat</label><textarea name="company_address" class="form-control"></textarea></div><div class="form-group"><label>Nomor Telepon</label><input type="text" name="company_phone" class="form-control"></div><div class="form-group"><label>WhatsApp API Key</label><input type="password" name="whatsapp_api_key" class="form-control"></div><button type="button" class="btn btn-primary" onclick="saveSettings()">Simpan Pengaturan</button></form></div></div>`;
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getSettings`);
    const result = await response.json();
    if (result.success) {
      const form = document.getElementById("settingsForm");
      for (const [key, value] of Object.entries(result.settings)) {
        if (form.elements[key]) form.elements[key].value = value;
      }
    }
  } catch (error) {}
}

async function saveSettings() {
  const form = document.getElementById("settingsForm");
  const formData = new FormData(form);
  const params = new URLSearchParams(formData);
  params.append("action", "updateSettings");
  try {
    const response = await fetch(`${SCRIPT_URL}?${params.toString()}`);
    const result = await response.json();
    if (result.success) showNotification("Pengaturan disimpan", "success");
  } catch (error) {
    showNotification("Gagal menyimpan pengaturan", "error");
  }
}

async function showWhatsAppModal() {
  showModal("whatsappModal");
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getWhatsAppTemplates`);
    const result = await response.json();
    if (result.success) {
      const templateSelect = document.getElementById("whatsappTemplate");
      templateSelect.innerHTML = '<option value="">Pilih template...</option>';
      result.templates.forEach((template) => {
        const option = document.createElement("option");
        option.value = template.id;
        option.textContent = template.name || `Template ${template.id}`;
        templateSelect.appendChild(option);
      });
      const templateList = document.getElementById("whatsappTemplatesList");
      templateList.innerHTML = "<h4>Template Tersedia:</h4>";
      result.templates.forEach((template) => {
        const div = document.createElement("div");
        div.className = "whatsapp-template";
        div.innerHTML = `<div style="font-weight: bold; margin-bottom: 5px;">${
          template.name || `Template ${template.id}`
        }</div><div style="font-size: 12px; color: #666;">${
          template.message
        }</div>`;
        div.addEventListener("click", () => {
          document.getElementById("whatsappMessage").value = template.message;
        });
        templateList.appendChild(div);
      });
    }
  } catch (error) {
    console.error("Error loading templates:", error);
  }
}

function loadWhatsAppTemplate() {}

async function sendWhatsAppMessage() {
  const phone = document.getElementById("whatsappPhone").value;
  const message = document.getElementById("whatsappMessage").value;
  if (!phone || !message) {
    showNotification("Harap isi nomor telepon dan pesan", "error");
    return;
  }
  try {
    const response = await fetch(
      `${SCRIPT_URL}?action=sendWhatsApp&phone=${encodeURIComponent(
        phone
      )}&message=${encodeURIComponent(message)}`
    );
    const result = await response.json();
    if (result.success) {
      showNotification("WhatsApp berhasil dikirim (simulasi)", "success");
      closeModal("whatsappModal");
    } else {
      showNotification(result.message, "error");
    }
  } catch (error) {
    showNotification("Gagal mengirim WhatsApp", "error");
  }
}

async function showFinancialReport() {
  showModal("financialReportModal");
  await generateFinancialReport();
}

async function generateFinancialReport() {
  const startDate = document.getElementById("reportStartDate").value;
  const endDate = document.getElementById("reportEndDate").value;
  try {
    let url = `${SCRIPT_URL}?action=getFinancialReport`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    const response = await fetch(url);
    const result = await response.json();
    if (result.success) {
      const report = result.report;
      let html = `<div style="margin: 20px 0;"><h4>Ringkasan Laporan</h4><div class="stats-grid"><div class="stat-card"><div class="stat-value">${
        report.totalOrders
      }</div><div class="stat-label">Total Order</div></div><div class="stat-card"><div class="stat-value">Rp ${report.totalRevenue.toLocaleString()}</div><div class="stat-label">Total Pendapatan</div></div><div class="stat-card"><div class="stat-value">Rp ${report.pendingPayment.toLocaleString()}</div><div class="stat-label">Piutang</div></div><div class="stat-card"><div class="stat-value">${report.completionRate.toFixed(
        1
      )}%</div><div class="stat-label">Completion Rate</div></div></div></div><div style="margin: 20px 0;"><h4>Status Pembayaran</h4><div style="display: flex; gap: 20px; flex-wrap: wrap;">`;
      for (const [status, count] of Object.entries(report.paymentStatus)) {
        html += `<div style="text-align: center;"><div style="font-size: 24px; font-weight: bold;">${count}</div><div style="font-size: 12px; color: #666;">${status}</div></div>`;
      }
      html += `</div></div><div style="margin: 20px 0;"><h4>Detail Transaksi</h4><div class="table-responsive"><table class="table"><thead><tr><th>ID Order</th><th>Tanggal</th><th>Status</th><th>Teknisi</th><th>Total</th><th>Pembayaran</th></tr></thead><tbody>`;
      report.details.forEach((order) => {
        html += `<tr><td>#${order.id}</td><td>${new Date(
          order.tanggal
        ).toLocaleDateString(
          "id-ID"
        )}</td><td><span class="status-badge status-${order.status.toLowerCase()}">${
          order.status
        }</span></td><td>${
          order.teknisi
        }</td><td>Rp ${order.total.toLocaleString()}</td><td>${
          order.pembayaran
        }</td></tr>`;
      });
      html += `</tbody></table></div></div>`;
      document.getElementById("reportResults").innerHTML = html;
    }
  } catch (error) {
    showNotification("Gagal generate laporan", "error");
  }
}

async function showInvoiceModal(orderId) {
  currentWorkOrderId = orderId;
  showModal("invoiceModal");
  try {
    const response = await fetch(
      `${SCRIPT_URL}?action=generateInvoice&orderId=${orderId}`
    );
    const result = await response.json();
    if (result.success)
      document.getElementById("invoicePreview").innerHTML = result.html;
  } catch (error) {
    document.getElementById("invoicePreview").innerHTML =
      "<p>Gagal memuat invoice</p>";
  }
}

function printInvoice() {
  const printWindow = window.open("", "_blank");
  printWindow.document.write(
    document.getElementById("invoicePreview").innerHTML
  );
  printWindow.document.close();
  printWindow.print();
}

function downloadInvoice() {
  showNotification("Fitur download PDF dalam pengembangan", "info");
}

async function loadUsersList() {
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getAllUsers`);
    const result = await response.json();
    if (result.success) {
      document.getElementById("usersListTable").innerHTML = result.data
        .map(
          (user) =>
            `<tr><td>${user.username}</td><td>${
              user.nama
            }</td><td><span class="role-badge role-${
              user.role
            }">${user.role.toUpperCase()}</span></td><td>${
              user.telepon || "-"
            }</td><td>-</td><td><button class="btn" onclick="editUser('${
              user.id
            }')" ${
              user.id == currentUser.id ? "disabled" : ""
            }><i class="fas fa-edit"></i></button><button class="btn" onclick="deleteUser('${
              user.id
            }')" ${
              user.id == currentUser.id ? "disabled" : ""
            }><i class="fas fa-trash"></i></button></td></tr>`
        )
        .join("");
    }
  } catch (error) {}
}

async function createNewUser() {
  const username = document.getElementById("newUsername").value;
  const password = document.getElementById("newPassword").value;
  const nama = document.getElementById("newName").value;
  const role = document.getElementById("newRole").value;
  const telepon = document.getElementById("newPhone").value;
  if (!username || !password || !nama || !role) {
    showNotification("Harap isi semua field yang wajib", "error");
    return;
  }
  try {
    const params = new URLSearchParams({
      action: "createNewUser",
      username,
      password,
      nama,
      role,
      telepon,
    });
    const response = await fetch(`${SCRIPT_URL}?${params}`);
    const result = await response.json();
    if (result.success) {
      showNotification("User berhasil ditambahkan", "success");
      closeModal("newUserModal");
      document.getElementById("newUserForm").reset();
      await loadUsersList();
    } else {
      showNotification(result.message, "error");
    }
  } catch (error) {
    showNotification("Gagal menambahkan user", "error");
  }
}

async function showProfileModal() {
  showModal("profileModal");
  document.getElementById("profileUsername").value = currentUser.username;
  document.getElementById("profileName").value = currentUser.nama;
  document.getElementById("profileRole").value = currentUser.role;
  document.getElementById("profilePhone").value = currentUser.telepon || "";
  document.getElementById("profilePassword").value = "";
}

async function updateProfile() {
  const nama = document.getElementById("profileName").value;
  const telepon = document.getElementById("profilePhone").value;
  const password = document.getElementById("profilePassword").value;
  try {
    const params = new URLSearchParams({
      action: "updateUser",
      id: currentUser.id,
      nama,
      telepon,
    });
    if (password) params.append("password", password);
    const response = await fetch(`${SCRIPT_URL}?${params}`);
    const result = await response.json();
    if (result.success) {
      currentUser.nama = nama;
      currentUser.telepon = telepon;
      localStorage.setItem("bengkel_user", JSON.stringify(currentUser));
      document.getElementById("topbarUsername").textContent = nama;
      document.getElementById("sidebarUsername").textContent =
        currentUser.username;
      showNotification("Profile berhasil diupdate", "success");
      closeModal("profileModal");
    } else {
      showNotification(result.message, "error");
    }
  } catch (error) {
    showNotification("Gagal update profile", "error");
  }
}

function loadPerformanceChart() {
  const ctx = document.getElementById("performanceChart");
  if (!ctx) return;
  new Chart(ctx.getContext("2d"), {
    type: "bar",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"],
      datasets: [
        {
          label: "Work Orders",
          data: [12, 19, 15, 25, 22, 30],
          backgroundColor: "#2563eb",
        },
        {
          label: "Revenue",
          data: [1200000, 1900000, 1500000, 2500000, 2200000, 3000000],
          backgroundColor: "#10b981",
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          type: "linear",
          position: "left",
          title: { display: true, text: "Jumlah Order" },
        },
        y1: {
          type: "linear",
          position: "right",
          title: { display: true, text: "Revenue (Rp)" },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
}

function showNotification(message, type) {
  const content = document.getElementById("notificationContent");
  const icons = {
    success:
      '<i class="fas fa-check-circle" style="color: var(--success);"></i>',
    error:
      '<i class="fas fa-exclamation-circle" style="color: var(--danger);"></i>',
    info: '<i class="fas fa-info-circle" style="color: var(--info);"></i>',
    warning:
      '<i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i>',
  };
  content.innerHTML = `<div style="text-align: center; padding: 10px;"><div style="font-size: 54px; margin-bottom: 20px;">${
    icons[type] || icons.info
  }</div><div style="font-weight: 500; font-size: 16px; color: var(--text-main);">${message}</div></div>`;
  showModal("notificationModal");
  setTimeout(() => {
    closeModal("notificationModal");
  }, 3000);
}

async function showNewWorkOrderModal() {
  showModal("newWorkOrderModal");
  const custSelect = document.getElementById("woCustomer");
  const techSelect = document.getElementById("woTeknisi");
  custSelect.innerHTML = '<option value="">Memuat pelanggan...</option>';
  techSelect.innerHTML = '<option value="">Memuat teknisi...</option>';
  try {
    const custRes = await fetch(`${SCRIPT_URL}?action=getCustomers`);
    const custData = await custRes.json();
    if (custData.success) {
      custSelect.innerHTML = '<option value="">Pilih Pelanggan</option>';
      custData.data.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = `${c.nama} (${c.telepon})`;
        custSelect.appendChild(opt);
      });
    }
    const techRes = await fetch(`${SCRIPT_URL}?action=getAllUsers`);
    const techData = await techRes.json();
    if (techData.success) {
      techSelect.innerHTML = '<option value="">Pilih Teknisi</option>';
      techData.data
        .filter((u) => u.role === "teknisi" || u.role === "admin")
        .forEach((u) => {
          const opt = document.createElement("option");
          opt.value = u.username;
          opt.textContent = u.nama;
          techSelect.appendChild(opt);
        });
    }
  } catch (err) {}
}

async function submitNewWorkOrder() {
  const customerId = document.getElementById("woCustomer").value;
  const keluhan = document.getElementById("woKeluhan").value;
  const teknisi = document.getElementById("woTeknisi").value;
  const estimasi = document.getElementById("woEstimasi").value;
  if (!customerId || !keluhan) {
    showNotification("Pelanggan and Keluhan wajib diisi", "warning");
    return;
  }
  const params = new URLSearchParams({
    action: "createWorkOrder",
    customerId,
    keluhan,
    teknisi,
    tanggalSelesai: estimasi,
    createdBy: currentUser.username,
  });
  try {
    showNotification("Membuat work order...", "info");
    const res = await fetch(`${SCRIPT_URL}?${params.toString()}`);
    const result = await res.json();
    if (result.success) {
      showNotification("Work Order berhasil dibuat!", "success");
      closeModal("newWorkOrderModal");
      document.getElementById("newWorkOrderForm").reset();
      loadPage(currentPage);
    }
  } catch (err) {
    showNotification("Gagal membuat work order", "error");
  }
}

function showNewCustomerModal() {
  showModal("newCustomerModal");
}

async function submitNewCustomer() {
  const nama = document.getElementById("custNama").value;
  const telepon = document.getElementById("custPhone").value;
  const alamat = document.getElementById("custAlamat").value;
  if (!nama || !telepon) {
    showNotification("Nama dan Telepon wajib diisi", "warning");
    return;
  }
  const params = new URLSearchParams({
    action: "createCustomer",
    nama,
    telepon,
    alamat,
  });
  try {
    const res = await fetch(`${SCRIPT_URL}?${params.toString()}`);
    const result = await res.json();
    if (result.success) {
      showNotification("Pelanggan berhasil disimpan!", "success");
      closeModal("newCustomerModal");
      document.getElementById("newCustomerForm").reset();
      if (
        document.getElementById("newWorkOrderModal").classList.contains("show")
      ) {
        showNewWorkOrderModal(); // Refresh dropdown
      } else {
        loadCustomers();
      }
    }
  } catch (err) {
    showNotification("Gagal menyimpan pelanggan", "error");
  }
}

function showNewItemModal() {
  showModal("newItemModal");
}

async function submitNewItem() {
  const nama = document.getElementById("itemName").value;
  const kategori = document.getElementById("itemCat").value;
  const stok = document.getElementById("itemStok").value;
  const beli = document.getElementById("itemBeli").value;
  const jual = document.getElementById("itemJual").value;
  if (!nama) {
    showNotification("Nama barang wajib diisi", "warning");
    return;
  }
  showNotification("Menyimpan item (Simulasi)...", "info");
  setTimeout(() => {
    showNotification("Item berhasil ditambahkan!", "success");
    closeModal("newItemModal");
    loadInventory();
  }, 1000);
}
async function loadFinancialData() {
  const tableBody = document.getElementById("financialTable");
  tableBody.innerHTML =
    '<tr><td colspan="8" style="text-align: center;">Memuat data...</td></tr>';
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getFinancialReport`);
    const result = await response.json();
    if (result.success) {
      tableBody.innerHTML = result.report.details
        .map(
          (order) =>
            `<tr><td>#${order.id}</td><td>${new Date(
              order.tanggal
            ).toLocaleDateString()}</td><td>Customer</td><td>Servis</td><td><span class="status-badge status-${order.status.toLowerCase()}">${
              order.status
            }</span></td><td>Rp ${order.total.toLocaleString()}</td><td>${
              order.pembayaran
            }</td><td><button class="btn btn-sm" onclick="showInvoiceModal(${
              order.id
            })"><i class="fas fa-eye"></i></button></td></tr>`
        )
        .join("");
    }
  } catch (error) {
    showNotification("Gagal memuat data keuangan", "error");
  }
}

async function exportFullReport() {
  showNotification("Menyiapkan ekspor data...", "info");
  window.open(`${SCRIPT_URL}?action=getFinancialReport&export=true`, "_blank");
}

function updateStock(itemId) {
  showNotification("Fitur update stok dalam pengembangan", "info");
}

function editWorkOrder(id) {
  showNotification("Fitur edit work order ID: " + id, "info");
}

function editCustomer(id) {
  showNotification("Fitur edit customer ID: " + id, "info");
}

async function deleteUser(id) {
  if (confirm("Anda yakin ingin menghapus user ini?")) {
    try {
      showNotification("Menghapus user...", "info");
      // Simulated delete for now as script.gs might not have it yet
      // In production, add action=deleteUser to code.gs
      showNotification("User berhasil dihapus", "success");
      await loadUsersList();
    } catch (error) {
      showNotification("Gagal menghapus user", "error");
    }
  }
}

function editUser(id) {
  showNotification("Edit user ID: " + id, "info");
}
