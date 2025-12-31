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
  document.getElementById("menuToggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("show");
  });

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
  contentArea.innerHTML = `<div class="stats-grid" id="statsGrid"></div><div class="card"><div class="card-header"><h3 class="card-title"><i class="fas fa-bolt text-primary"></i> Aksi Cepat</h3></div><div class="card-body"><div style="display: flex; flex-wrap: wrap; gap: 15px;">${
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

async function loadFinancialPage() {
  contentArea.innerHTML = `<div class="card"><div class="card-body"><div class="form-row" style="display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-end;"><div class="form-group" style="flex: 1; min-width: 200px; margin-bottom: 0;"><label>Periode Laporan</label><select id="reportPeriod" class="form-control" onchange="loadReportByPeriod()"><option value="today">Hari Ini</option><option value="week">Minggu Ini</option><option value="month" selected>Bulan Ini</option><option value="quarter">Kuartal Ini</option><option value="year">Tahun Ini</option><option value="custom">Custom Range</option></select></div><div class="form-group" id="customDateRange" style="display: none; flex: 2; min-width: 300px; margin-bottom: 0;"><div style="display: flex; gap: 15px;"><div style="flex: 1"><label>Dari</label><input type="date" id="customStart" class="form-control"></div><div style="flex: 1"><label>Sampai</label><input type="date" id="customEnd" class="form-control"></div></div></div><div class="form-group" style="margin-bottom: 0;"><button class="btn btn-primary" onclick="loadFinancialData()"><i class="fas fa-sync"></i> Refresh</button>${
    checkPermission("financial", "export")
      ? `<button class="btn btn-secondary" onclick="exportFullReport()" style="margin-left: 10px;"><i class="fas fa-download"></i> Export Excel</button>`
      : ""
  }</div></div></div></div><div class="stats-grid" id="financialStats"></div><div class="card"><div class="card-header"><h3 class="card-title"><i class="fas fa-money-bill-transfer text-primary"></i> Detail Transaksi</h3></div><div class="card-body"><div class="table-responsive"><table class="table"><thead><tr><th>ID</th><th>Tanggal</th><th>Customer</th><th>Servis</th><th>Status</th><th>Total</th><th>Pembayaran</th><th>Aksi</th></tr></thead><tbody id="financialTable"></tbody></table></div></div></div><div class="card"><div class="card-header"><h3 class="card-title"><i class="fas fa-chart-line text-primary"></i> Grafik Pendapatan</h3></div><div class="card-body"><canvas id="revenueChart" style="max-height: 300px;"></canvas></div></div>`;
  document
    .getElementById("reportPeriod")
    .addEventListener("change", function () {
      document.getElementById("customDateRange").style.display =
        this.value === "custom" ? "block" : "none";
    });
  await loadFinancialData();
}

async function loadUsersPage() {
  contentArea.innerHTML = `<h1 style="margin-bottom: 20px;">Manajemen User</h1><div class="card" style="margin-bottom: 30px;"><div class="card-header"><h3 class="card-title">Daftar User</h3></div><div class="card-body"><div style="margin-bottom: 20px;"><button class="btn btn-primary" onclick="showNewUserModal()"><i class="fas fa-plus"></i> Tambah User Baru</button></div><div class="permission-grid" style="margin: 20px 0;"><div class="permission-item"><span class="role-badge role-admin">ADMIN</span><small>Akses penuh ke semua fitur</small></div><div class="permission-item"><span class="role-badge role-supervisor">SUPERVISOR</span><small>Bisa mengelola operasional</small></div><div class="permission-item"><span class="role-badge role-teknisi">TEKNISI</span><small>Hanya melihat dan update work order</small></div><div class="permission-item"><span class="role-badge role-kasir">KASIR</span><small>Bisa mengelola pembayaran dan laporan</small></div></div><div class="table-responsive"><table class="table"><thead><tr><th>Username</th><th>Nama</th><th>Role</th><th>Telepon</th><th>Terakhir Login</th><th>Aksi</th></tr></thead><tbody id="usersListTable"></tbody></table></div></div></div>`;
  await loadUsersList();
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

async function loadWorkOrders() {
  contentArea.innerHTML = "<h2>Work Orders Page</h2>";
}
async function loadCustomers() {
  contentArea.innerHTML = "<h2>Customers Page</h2>";
}
async function loadInventory() {
  contentArea.innerHTML = "<h2>Inventory Page</h2>";
}
async function loadReports() {
  contentArea.innerHTML = "<h2>Reports Page</h2>";
}
async function loadSettings() {
  contentArea.innerHTML = "<h2>Settings Page</h2>";
}
async function updateDashboardData() {}
function editUser(id) {}
function deleteUser(id) {}
function loadReportByPeriod() {}
async function loadFinancialData() {}
async function exportFullReport() {}
