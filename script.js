// Supabase Configuration
const SUPABASE_URL = "https://lbhutmuchalhpxurcfqe.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiaHV0bXVjaGFsaHB4dXJjZnFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNjU0MzgsImV4cCI6MjA4Mjc0MTQzOH0.G3e8A3ozqS50VFr_YntCKTShaR-yRZ4tyifST_f0jow";

let db;

try {
  if (window.supabase) {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.error(
      "Supabase SDK not found. Please check index.html script tag."
    );
  }
} catch (err) {
  console.error("Error initializing Supabase:", err);
}

// State
let currentUser = null;
let currentPage = "dashboard";
let userPermissions = {};
let currentWorkOrderId = null;
let customersCache = null;
let techniciansCache = null;

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
    posts: { view: true, create: true, edit: true, delete: true },
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
  loadPublicPosts();
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

function formatCurrency(amount) {
  return "Rp " + (parseFloat(amount) || 0).toLocaleString("id-ID");
}

function maskCurrency(el) {
  let value = el.value.replace(/\D/g, "");
  el.value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function unmaskCurrency(value) {
  return parseFloat(value.replace(/\./g, "")) || 0;
}

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

  try {
    const { data: user, error } = await db
      .from("profiles")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error) {
      showNotification("Username atau password salah", "error");
      return;
    }

    if (user) {
      currentUser = {
        id: user.id,
        username: user.username,
        nama: user.full_name,
        role: user.role,
        telepon: user.phone,
      };
      userPermissions = PERMISSIONS[currentUser.role] || PERMISSIONS.teknisi;
      localStorage.setItem("bengkel_user", JSON.stringify(currentUser));
      landingPage.style.display = "none";
      showDashboard();
      setupMenu();
      loadPage("dashboard");
      showNotification("Login berhasil!", "success");
    }
  } catch (error) {
    showNotification("Terjadi kesalahan. Coba lagi.", "error");
    console.error("Login error:", error);
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
      icon: "fas fa-newspaper",
      page: "posts",
      label: "Manajemen Berita",
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
    posts: "Manajemen Berita",
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
    case "posts":
      await loadPostsManagement();
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
        ? `<button class="btn btn-primary" onclick="showWorkOrderModal()"><i class="fas fa-plus"></i> Work Order Baru</button>`
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
    // Get stats from Supabase
    const { data: woData, error: woError } = await db
      .from("work_orders")
      .select("status, total_cost");

    if (woError) throw woError;

    const stats = {
      total: woData.length,
      pending: woData.filter((wo) => wo.status === "Menunggu").length,
      progress: woData.filter((wo) => wo.status === "Diproses").length,
      revenue: woData.reduce(
        (acc, wo) => acc + (parseFloat(wo.total_cost) || 0),
        0
      ),
    };

    document.getElementById("stat-total").textContent = stats.total;
    document.getElementById("stat-pending").textContent = stats.pending;
    document.getElementById("stat-progress").textContent = stats.progress;
    document.getElementById("stat-revenue").textContent = formatCurrency(
      stats.revenue
    );

    // Load recent orders with customer name
    const { data: recentOrders, error: recentError } = await db
      .from("work_orders")
      .select("*, profiles!work_orders_technician_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    const tableBody = document.getElementById("recentOrdersTable");
    tableBody.innerHTML = recentOrders
      .map(
        (order) =>
          `<tr><td>#${order.id}</td><td>${new Date(
            order.date_in
          ).toLocaleDateString()}</td><td><span class="status-badge status-${order.status.toLowerCase()}">${
            order.status
          }</span></td><td>${
            order.profiles?.full_name || "-"
          }</td><td>${formatCurrency(
            order.total_cost
          )}</td><td><button class="btn btn-sm" onclick="showInvoiceModal(${
            order.id
          })"><i class="fas fa-file-invoice"></i></button></td></tr>`
      )
      .join("");
  } catch (error) {
    console.error("Error updating dashboard data:", error);
  }
}

async function loadWorkOrders() {
  contentArea.innerHTML = `<div class="card"><div class="card-header"><h3 class="card-title">Manajemen Work Orders</h3></div><div class="card-body"><div style="margin-bottom: 20px;">${
    checkPermission("workorders", "create")
      ? `<button class="btn btn-primary" onclick="showWorkOrderModal()"><i class="fas fa-plus"></i> Tambah Work Order</button>`
      : ""
  }</div><div class="table-responsive"><table class="table"><thead><tr><th>ID</th><th>Tanggal</th><th>Customer</th><th>Keluhan</th><th>Status</th><th>Teknisi</th><th>Total</th><th>Aksi</th></tr></thead><tbody id="workOrdersTable"><tr><td colspan="8" style="text-align: center;">Memuat data...</td></tr></tbody></table></div></div></div>`;
  try {
    const { data: orders, error } = await db
      .from("work_orders")
      .select(
        "*, customers(name), profiles!work_orders_technician_id_fkey(full_name)"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    const tableBody = document.getElementById("workOrdersTable");
    tableBody.innerHTML = orders
      .map(
        (order) =>
          `<tr><td>#${order.id}</td><td>${new Date(
            order.date_in
          ).toLocaleDateString()}</td><td>${
            order.customers?.name || "-"
          }</td><td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${
            order.complaint || ""
          }</td><td><span class="status-badge status-${order.status.toLowerCase()}">${
            order.status
          }</span></td><td>${
            order.profiles?.full_name || "-"
          }</td><td>${formatCurrency(
            order.total_cost
          )}</td><td><div style="display: flex; gap: 5px;"><button class="btn btn-sm" onclick="showInvoiceModal(${
            order.id
          })"><i class="fas fa-eye"></i></button><button class="btn btn-sm" onclick="showWorkOrderModal(${
            order.id
          })"><i class="fas fa-edit"></i></button></div></td></tr>`
      )
      .join("");
  } catch (error) {
    showNotification("Gagal memuat work orders", "error");
    console.error("Load Work Orders error:", error);
  }
}

async function loadCustomers() {
  contentArea.innerHTML = `<div class="card"><div class="card-header"><h3 class="card-title">Daftar Pelanggan</h3></div><div class="card-body"><div style="margin-bottom: 20px;"><button class="btn btn-primary" onclick="showCustomerModal()"><i class="fas fa-plus"></i> Tambah Pelanggan</button></div><div class="table-responsive"><table class="table"><thead><tr><th>ID</th><th>Nama</th><th>Telepon</th><th>Alamat</th><th>Aksi</th></tr></thead><tbody id="customersTable"><tr><td colspan="5" style="text-align: center;">Memuat data...</td></tr></tbody></table></div></div></div>`;
  try {
    const { data: customers, error } = await db
      .from("customers")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    document.getElementById("customersTable").innerHTML = customers
      .map(
        (c) =>
          `<tr><td>${c.id}</td><td>${c.name}</td><td>${c.phone}</td><td>${
            c.address || "-"
          }</td><td><button class="btn btn-sm" onclick="showCustomerModal(${
            c.id
          })"><i class="fas fa-edit"></i></button></td></tr>`
      )
      .join("");
  } catch (error) {
    showNotification("Gagal memuat daftar pelanggan", "error");
    console.error("Load Customers error:", error);
  }
}

async function loadInventory() {
  contentArea.innerHTML = `<div class="card"><div class="card-header"><h3 class="card-title">Inventaris Barang</h3></div><div class="card-body"><div style="margin-bottom: 20px;"><button class="btn btn-primary" onclick="showNewItemModal()"><i class="fas fa-plus"></i> Tambah Item</button></div><div class="table-responsive"><table class="table"><thead><tr><th>Kode</th><th>Nama Barang</th><th>Kategori</th><th>Stok</th><th>Harga Jual</th><th>Aksi</th></tr></thead><tbody id="inventoryTable"></tbody></table></div></div></div>`;
  try {
    const { data: inventory, error } = await db
      .from("inventory")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    document.getElementById("inventoryTable").innerHTML = inventory
      .map(
        (item) =>
          `<tr><td>${item.part_code}</td><td>${item.name}</td><td>${
            item.category || "-"
          }</td><td class="${
            item.stock <= item.min_stock ? "text-danger" : ""
          }">${item.stock}</td><td>${formatCurrency(
            item.sell_price
          )}</td><td><button class="btn btn-sm" onclick="updateStock('${
            item.id
          }')"><i class="fas fa-plus-minus"></i></button></td></tr>`
      )
      .join("");
  } catch (error) {
    showNotification("Gagal memuat inventaris", "error");
    console.error("Load Inventory error:", error);
  }
}

async function loadReports() {
  contentArea.innerHTML = `<div class="stats-grid"><div class="card" onclick="showFinancialReport()"><div class="card-body" style="text-align: center; cursor: pointer; padding: 40px;"><i class="fas fa-file-invoice-dollar" style="font-size: 48px; color: var(--primary); margin-bottom: 20px;"></i><h3>Laporan Keuangan</h3><p>Pendapatan, pengeluaran, dan piutang.</p></div></div><div class="card"><div class="card-body" style="text-align: center; cursor: pointer; padding: 40px;"><i class="fas fa-user-gear" style="font-size: 48px; color: var(--success); margin-bottom: 20px;"></i><h3>Laporan Teknisi</h3><p>Performa dan beban kerja teknisi.</p></div></div><div class="card"><div class="card-body" style="text-align: center; cursor: pointer; padding: 40px;"><i class="fas fa-box-open" style="font-size: 48px; color: var(--warning); margin-bottom: 20px;"></i><h3>Laporan Stok</h3><p>Barang keluar masuk dan sisa stok.</p></div></div></div>`;
}

async function loadSettings() {
  contentArea.innerHTML = `<div class="card"><div class="card-header"><h3 class="card-title">Pengaturan Sistem</h3></div><div class="card-body"><form id="settingsForm"><div class="form-group"><label>Nama Bengkel</label><input type="text" name="company_name" class="form-control"></div><div class="form-group"><label>Alamat</label><textarea name="company_address" class="form-control"></textarea></div><div class="form-group"><label>Nomor Telepon</label><input type="text" name="company_phone" class="form-control"></div><div class="form-group"><label>WhatsApp API Key</label><input type="password" name="whatsapp_api_key" class="form-control"></div><button type="button" class="btn btn-primary" onclick="saveSettings()">Simpan Pengaturan</button></form></div></div>`;
  try {
    const { data: settings, error } = await db.from("settings").select("*");
    if (error) throw error;

    const form = document.getElementById("settingsForm");
    settings.forEach((s) => {
      if (form.elements[s.key]) form.elements[s.key].value = s.value;
    });
  } catch (error) {
    console.error("Load Settings error:", error);
  }
}

async function saveSettings() {
  const form = document.getElementById("settingsForm");
  const formData = new FormData(form);
  const settingsData = [];
  formData.forEach((value, key) => {
    settingsData.push({ key, value });
  });

  try {
    const { error } = await db.from("settings").upsert(settingsData);
    if (error) throw error;
    showNotification("Pengaturan disimpan", "success");
  } catch (error) {
    showNotification("Gagal menyimpan pengaturan", "error");
    console.error("Save Settings error:", error);
  }
}

async function showWhatsAppModal() {
  showModal("whatsappModal");
  const templates = [
    {
      id: 1,
      name: "Konfirmasi Work Order",
      message:
        "Halo, work order Anda dengan ID #{orderId} telah dibuat. Status: {status}. Terima kasih.",
    },
    {
      id: 2,
      name: "Update Status",
      message:
        "Halo, work order #{orderId} telah diperbarui menjadi {status}. Terima kasih.",
    },
    {
      id: 3,
      name: "Pengingat Pembayaran",
      message:
        "Halo, work order #{orderId} memiliki status pembayaran: {paymentStatus}. Total: Rp {total}. Terima kasih.",
    },
    {
      id: 4,
      name: "Selesai",
      message:
        "Halo, kendaraan Anda telah selesai diperbaiki. Silakan mengambil di bengkel. Total: Rp {total}. Terima kasih.",
    },
  ];

  const templateSelect = document.getElementById("whatsappTemplate");
  templateSelect.innerHTML = '<option value="">Pilih template...</option>';
  templates.forEach((template) => {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.name;
    templateSelect.appendChild(option);
  });

  const templateList = document.getElementById("whatsappTemplatesList");
  templateList.innerHTML = "<h4>Template Tersedia:</h4>";
  templates.forEach((template) => {
    const div = document.createElement("div");
    div.className = "whatsapp-template";
    div.innerHTML = `<div style="font-weight: bold; margin-bottom: 5px;">${template.name}</div><div style="font-size: 12px; color: #666;">${template.message}</div>`;
    div.addEventListener("click", () => {
      document.getElementById("whatsappMessage").value = template.message;
    });
    templateList.appendChild(div);
  });
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
    // Simulate sending and log to Supabase audit_log
    const { error } = await db.from("audit_log").insert({
      user_id: currentUser.username,
      action: "sendWhatsApp",
      details: `To: ${phone}, Msg: ${message}`,
    });

    if (error) throw error;

    showNotification("WhatsApp berhasil dikirim (simulasi)", "success");
    closeModal("whatsappModal");
  } catch (error) {
    showNotification("Gagal mengirim WhatsApp", "error");
    console.error("Send WhatsApp error:", error);
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
    let query = db
      .from("work_orders")
      .select("*, profiles!work_orders_technician_id_fkey(full_name)");

    if (startDate) query = query.gte("date_in", startDate);
    if (endDate) query = query.lte("date_in", endDate);

    const { data: orders, error } = await query.order("date_in", {
      ascending: false,
    });

    if (error) throw error;

    const report = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce(
        (acc, o) => acc + (parseFloat(o.total_cost) || 0),
        0
      ),
      pendingPayment: orders.reduce((acc, o) => {
        const cost = parseFloat(o.total_cost) || 0;
        if (o.payment_status === "DP 50%") return acc + cost * 0.5;
        if (o.payment_status === "Belum Lunas") return acc + cost;
        return acc;
      }, 0),
      completedOrders: orders.filter((o) => o.status === "Selesai").length,
      paymentStatus: {
        Lunas: orders.filter((o) => o.payment_status === "Lunas").length,
        "DP 50%": orders.filter((o) => o.payment_status === "DP 50%").length,
        "Belum Lunas": orders.filter((o) => o.payment_status === "Belum Lunas")
          .length,
      },
    };

    const completionRate =
      report.totalOrders > 0
        ? (report.completedOrders / report.totalOrders) * 100
        : 0;

    let html = `<div style="margin: 20px 0;"><h4>Ringkasan Laporan</h4><div class="stats-grid"><div class="stat-card"><div class="stat-value">${
      report.totalOrders
    }</div><div class="stat-label">Total Order</div></div><div class="stat-card"><div class="stat-value">${formatCurrency(
      report.totalRevenue
    )}</div><div class="stat-label">Total Pendapatan</div></div><div class="stat-card"><div class="stat-value">${formatCurrency(
      report.pendingPayment
    )}</div><div class="stat-label">Piutang</div></div><div class="stat-card"><div class="stat-value">${completionRate.toFixed(
      1
    )}%</div><div class="stat-label">Completion Rate</div></div></div></div><div style="margin: 20px 0;"><h4>Status Pembayaran</h4><div style="display: flex; gap: 20px; flex-wrap: wrap;">`;
    for (const [status, count] of Object.entries(report.paymentStatus)) {
      html += `<div style="text-align: center;"><div style="font-size: 24px; font-weight: bold;">${count}</div><div style="font-size: 12px; color: #666;">${status}</div></div>`;
    }
    html += `</div></div><div style="margin: 20px 0;"><h4>Detail Transaksi</h4><div class="table-responsive"><table class="table"><thead><tr><th>ID Order</th><th>Tanggal</th><th>Status</th><th>Teknisi</th><th>Total</th><th>Pembayaran</th></tr></thead><tbody>`;
    orders.forEach((order) => {
      html += `<tr><td>#${order.id}</td><td>${new Date(
        order.date_in
      ).toLocaleDateString(
        "id-ID"
      )}</td><td><span class="status-badge status-${order.status.toLowerCase()}">${
        order.status
      }</span></td><td>${
        order.profiles?.full_name || "-"
      }</td><td>${formatCurrency(order.total_cost)}</td><td>${
        order.payment_status
      }</td></tr>`;
    });
    html += `</tbody></table></div></div>`;
    document.getElementById("reportResults").innerHTML = html;
  } catch (error) {
    showNotification("Gagal generate laporan", "error");
    console.error("Generate Financial Report error:", error);
  }
}

async function showInvoiceModal(orderId) {
  currentWorkOrderId = orderId;
  showModal("invoiceModal");
  document.getElementById("invoicePreview").innerHTML =
    "<p style='text-align: center; padding: 20px;'>Memuat invoice...</p>";

  try {
    // Fetch order details with customer and technician
    const { data: order, error: orderError } = await db
      .from("work_orders")
      .select("*, customers(*), profiles!work_orders_technician_id_fkey(*)")
      .eq("id", orderId)
      .single();

    if (orderError) throw orderError;

    // Fetch company settings
    const { data: settingsData, error: settingsError } = await db
      .from("settings")
      .select("*");

    if (settingsError) throw settingsError;

    const settings = {};
    settingsData.forEach((s) => (settings[s.key] = s.value));

    const companyName = settings.company_name || "BENGKEL MOTOR";
    const companyAddress =
      settings.company_address || "Jl. Contoh No. 123, Jakarta";
    const companyPhone = settings.company_phone || "021-1234567";

    const html = `
      <div class="invoice-container">
        <div class="invoice-header">
          <div class="company-name">${companyName}</div>
          <div class="company-address">${companyAddress}</div>
          <div class="company-phone">Telp: ${companyPhone}</div>
          <h1 class="invoice-title">INVOICE</h1>
          <div class="invoice-no">No: INV-${order.id}-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}</div>
        </div>
        
        <div class="invoice-details">
          <div>
            <div class="detail-row"><span class="detail-label">Work Order ID:</span> <span>#${
              order.id
            }</span></div>
            <div class="detail-row"><span class="detail-label">Plat Nomor:</span> <span>${
              order.vehicles?.plate || "-"
            }</span></div>
          </div>
          <div>
            <div class="detail-row"><span class="detail-label">Tanggal:</span> <span>${new Date(
              order.date_in
            ).toLocaleDateString("id-ID")}</span></div>
            <div class="detail-row"><span class="detail-label">Pelanggan:</span> <span>${
              order.customers?.name || "-"
            }</span></div>
          </div>
        </div>
        
        <div class="invoice-complaint">
          <h3>Keluhan</h3>
          <p style="margin: 0; padding: 15px; background: #f8fafc; border-radius: 8px; font-size: 14px; margin-bottom: 20px;">${
            order.complaint || "-"
          }</p>
        </div>

        ${
          order.notes
            ? `
        <div class="invoice-spareparts">
          <h3>Rincian Sparepart</h3>
          <p style="margin: 0; padding: 15px; background: #fdf5e6; border-radius: 8px; font-size: 14px; white-space: pre-line; border-left: 4px solid #f59e0b;">${order.notes}</p>
        </div>
        `
            : ""
        }
        
        <table class="table" style="margin: 30px 0;">
          <thead>
            <tr>
              <th>Deskripsi</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Biaya Servis & Sparepart</td>
              <td style="text-align: right;">${formatCurrency(
                order.total_cost
              )}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="total">
          Total Akhir: ${formatCurrency(order.total_cost)}
          <div style="font-size: 13px; color: var(--secondary); font-weight: normal; margin-top: 5px;">
            Status Pembayaran: ${order.payment_status}
          </div>
        </div>
        
        <div class="signature">
          <div class="signature-box">
            <div>Hormat Kami,</div>
            <div class="signature-line"></div>
            <div>${companyName}</div>
          </div>
          <div class="signature-box">
            <div>Pelanggan,</div>
            <div class="signature-line"></div>
            <div>${order.customers?.name || "Nama Terang"}</div>
          </div>
        </div>
        
        </div>
      </div>
    `;
    document.getElementById("invoicePreview").innerHTML = html;
  } catch (error) {
    console.error("Show Invoice error:", error);
    document.getElementById("invoicePreview").innerHTML =
      "<p style='color: red; padding: 20px;'>Gagal memuat invoice. Silakan periksa koneksi atau data.</p>";
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

async function downloadInvoiceAsPNG() {
  const invoiceElement = document.getElementById("invoicePreview");
  if (!invoiceElement) return;

  try {
    showNotification("Menyiapkan Gambar...", "info");
    const canvas = await html2canvas(invoiceElement, {
      scale: 2, // Kualitas lebih tinggi
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const link = document.createElement("a");
    link.download = `Invoice-${currentWorkOrderId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    showNotification("Gambar berhasil diunduh!", "success");
    showNotification("Silakan kirim file ini ke WhatsApp pelanggan.", "info");
  } catch (error) {
    console.error("Error generating PNG:", error);
    showNotification("Gagal membuat gambar invoice", "error");
  }
}

function showNewUserModal() {
  showModal("newUserModal");
  document.getElementById("newUserForm").reset();
  document.querySelector("#newUserModal h3").textContent = "Tambah User Baru";
  const submitBtn = document.querySelector("#newUserModal .btn-primary");
  submitBtn.textContent = "Simpan User";
  submitBtn.onclick = createNewUser;
}

async function loadUsersList() {
  try {
    const { data: users, error } = await db
      .from("profiles")
      .select("*")
      .order("username", { ascending: true });

    if (error) throw error;

    document.getElementById("usersListTable").innerHTML = users
      .map(
        (user) =>
          `<tr><td>${user.username}</td><td>${
            user.full_name
          }</td><td><span class="role-badge role-${
            user.role
          }">${user.role.toUpperCase()}</span></td><td>${
            user.phone || "-"
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
  } catch (error) {
    console.error("Load Users error:", error);
  }
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
    const { error } = await db.from("profiles").insert({
      username,
      password,
      full_name: nama,
      role,
      phone: telepon,
    });

    if (error) throw error;

    showNotification("User berhasil ditambahkan", "success");
    closeModal("newUserModal");
    document.getElementById("newUserForm").reset();
    await loadUsersList();
  } catch (error) {
    showNotification("Gagal menambahkan user", "error");
    console.error("Create User error:", error);
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
    const updateData = {
      full_name: nama,
      phone: telepon,
    };
    if (password) updateData.password = password;

    const { error } = await db
      .from("profiles")
      .update(updateData)
      .eq("id", currentUser.id);

    if (error) throw error;

    currentUser.nama = nama;
    currentUser.telepon = telepon;
    localStorage.setItem("bengkel_user", JSON.stringify(currentUser));
    document.getElementById("topbarUsername").textContent = nama;
    document.getElementById("sidebarUsername").textContent =
      currentUser.username;
    showNotification("Profile berhasil diupdate", "success");
    closeModal("profileModal");
  } catch (error) {
    showNotification("Gagal update profile", "error");
    console.error("Update Profile error:", error);
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

function showNotification(message, type = "info") {
  // Silent filter for "processing" type messages to reduce clutter
  const silentMessages = ["Sedang", "Memproses", "Menyiapkan", "Memuat"];
  if (type === "info" && silentMessages.some((m) => message.includes(m))) {
    console.log("Notification suppressed:", message);
    return;
  }

  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icons = {
    success: '<i class="fas fa-check-circle text-success"></i>',
    error: '<i class="fas fa-exclamation-circle text-danger"></i>',
    info: '<i class="fas fa-info-circle text-info"></i>',
    warning: '<i class="fas fa-exclamation-triangle text-warning"></i>',
  };

  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">${message}</div>
  `;

  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.classList.add("removing");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

async function showWorkOrderModal(id = null) {
  const modalId = "workOrderModal";
  showModal(modalId);
  const form = document.getElementById("workOrderForm");
  form.reset();
  document.getElementById("woId").value = id || "";
  document.getElementById("woModalTitle").textContent = id
    ? "Edit Work Order #" + id
    : "Work Order Baru";

  const custSelect = document.getElementById("woCustomer");
  const techSelect = document.getElementById("woTeknisi");

  // Load dropdown data if not cached
  if (!customersCache || !techniciansCache) {
    custSelect.innerHTML = '<option value="">Memuat pelanggan...</option>';
    techSelect.innerHTML = '<option value="">Memuat teknisi...</option>';
    try {
      const [{ data: customers }, { data: users }] = await Promise.all([
        db.from("customers").select("*").order("name"),
        db.from("profiles").select("*"),
      ]);
      customersCache = customers;
      techniciansCache = users;
    } catch (err) {
      console.error("Load Modal Data error:", err);
    }
  }

  populateDropdowns(customersCache, techniciansCache);

  if (id) {
    try {
      const { data: order, error } = await db
        .from("work_orders")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;

      document.getElementById("woCustomer").value = order.customer_id;
      document.getElementById("woKeluhan").value = order.complaint;
      document.getElementById("woSparepart").value = order.notes || "";
      document.getElementById("woStatus").value = order.status;
      const costEl = document.getElementById("woTotalCost");
      costEl.value = (order.total_cost || 0)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      document.getElementById("woTeknisi").value =
        techniciansCache.find((t) => t.id === order.technician_id)?.username ||
        "";
      document.getElementById("woEstimasi").value = order.date_out
        ? new Date(order.date_out).toISOString().split("T")[0]
        : "";
      document.getElementById("woPaymentStatus").value = order.payment_status;
    } catch (err) {
      showNotification("Gagal memuat data work order", "error");
    }
  }
}

function populateDropdowns(customers, technicians) {
  const custSelect = document.getElementById("woCustomer");
  const techSelect = document.getElementById("woTeknisi");

  custSelect.innerHTML = '<option value="">Pilih Pelanggan</option>';
  customers.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.name} (${c.phone})`;
    custSelect.appendChild(opt);
  });

  techSelect.innerHTML = '<option value="">Pilih Teknisi</option>';
  technicians
    .filter((u) => u.role === "teknisi" || u.role === "admin")
    .forEach((u) => {
      const opt = document.createElement("option");
      opt.value = u.username;
      opt.textContent = u.full_name;
      techSelect.appendChild(opt);
    });

  // Re-initialize Select2 if available
  if (typeof $ !== "undefined" && $.fn.select2) {
    const commonSettings = {
      dropdownParent: $("#workOrderModal"),
      width: "100%",
    };

    $("#woCustomer").select2({
      ...commonSettings,
      placeholder: "Cari Pelanggan...",
      allowClear: true,
    });

    $("#woTeknisi").select2({
      ...commonSettings,
      placeholder: "Pilih Teknisi...",
      allowClear: true,
    });

    // Fix for Select2 focus in modal
    $(document).on("select2:open", () => {
      document.querySelector(".select2-search__field").focus();
    });
  }
}

async function submitWorkOrder() {
  const id = document.getElementById("woId").value;
  const customerId = document.getElementById("woCustomer").value;
  const keluhan = document.getElementById("woKeluhan").value;
  const sparepart = document.getElementById("woSparepart").value;
  const teknisi = document.getElementById("woTeknisi").value;
  const status = document.getElementById("woStatus").value;
  const totalCost = unmaskCurrency(
    document.getElementById("woTotalCost").value
  );
  const estimasi = document.getElementById("woEstimasi").value;
  const paymentStatus = document.getElementById("woPaymentStatus").value;

  if (!customerId || !keluhan) {
    showNotification("Pelanggan dan Keluhan wajib diisi", "warning");
    return;
  }

  try {
    const { data: techProfile } = await db
      .from("profiles")
      .select("id")
      .eq("username", teknisi)
      .single();

    const data = {
      customer_id: customerId,
      complaint: keluhan,
      notes: sparepart,
      technician_id: techProfile?.id,
      status: status,
      total_cost: totalCost,
      date_out: estimasi || null,
      payment_status: paymentStatus,
    };

    if (id) {
      const { error } = await db.from("work_orders").update(data).eq("id", id);
      if (error) throw error;
      showNotification("Work Order berhasil diupdate!", "success");
    } else {
      const { data: creatorProfile } = await db
        .from("profiles")
        .select("id")
        .eq("username", currentUser.username)
        .single();
      data.created_by = creatorProfile?.id;
      const { error } = await db.from("work_orders").insert(data);
      if (error) throw error;
      showNotification("Work Order berhasil dibuat!", "success");
    }

    closeModal("workOrderModal");
    loadPage(currentPage);
  } catch (err) {
    showNotification("Gagal menyimpan work order", "error");
    console.error("Submit WO error:", err);
  }
}

async function showCustomerModal(id = null) {
  showModal("customerModal");
  const form = document.getElementById("customerForm");
  form.reset();
  document.getElementById("custId").value = id || "";
  document.getElementById("custModalTitle").textContent = id
    ? "Edit Pelanggan"
    : "Tambah Pelanggan Baru";

  if (id) {
    try {
      const { data: cust, error } = await db
        .from("customers")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      document.getElementById("custNama").value = cust.name;
      document.getElementById("custPhone").value = cust.phone;
      document.getElementById("custAlamat").value = cust.address;
    } catch (err) {
      showNotification("Gagal memuat data pelanggan", "error");
    }
  }
}

async function submitCustomer() {
  const id = document.getElementById("custId").value;
  const nama = document.getElementById("custNama").value;
  const telepon = document.getElementById("custPhone").value;
  const alamat = document.getElementById("custAlamat").value;

  if (!nama || !telepon) {
    showNotification("Nama dan Telepon wajib diisi", "warning");
    return;
  }

  try {
    const data = { name: nama, phone: telepon, address: alamat };
    if (id) {
      const { error } = await db.from("customers").update(data).eq("id", id);
      if (error) throw error;
      showNotification("Pelanggan berhasil diupdate!", "success");
    } else {
      const { error } = await db.from("customers").insert(data);
      if (error) throw error;
      showNotification("Pelanggan berhasil disimpan!", "success");
    }

    closeModal("customerModal");
    if (document.getElementById("workOrderModal").classList.contains("show")) {
      customersCache = null;
      showWorkOrderModal(document.getElementById("woId").value || null);
    } else {
      loadCustomers();
    }
  } catch (err) {
    showNotification("Gagal menyimpan pelanggan", "error");
    console.error("Submit Customer error:", err);
  }
}

function showNewItemModal() {
  showModal("newItemModal");
}

async function submitNewItem() {
  const nama = document.getElementById("itemName").value;
  const kategori = document.getElementById("itemCat").value;
  const stok = document.getElementById("itemStok").value;
  const minStok = document.getElementById("itemMin").value;
  const beli = unmaskCurrency(document.getElementById("itemBeli").value);
  const jual = unmaskCurrency(document.getElementById("itemJual").value);

  if (!nama) {
    showNotification("Nama barang wajib diisi", "warning");
    return;
  }

  try {
    showNotification("Menyimpan item...", "info");
    const { error } = await db.from("inventory").insert({
      name: nama,
      category: kategori,
      stock: parseInt(stok) || 0,
      min_stock: parseInt(minStok) || 0,
      buy_price: beli,
      sell_price: jual,
      part_code: "ITEM-" + Date.now().toString().slice(-6), // Generate simple code
    });

    if (error) throw error;

    showNotification("Item berhasil ditambahkan!", "success");
    closeModal("newItemModal");
    loadInventory();
  } catch (err) {
    showNotification("Gagal menyimpan item", "error");
    console.error("Submit Item error:", err);
  }
}

async function updateStock(itemId) {
  try {
    const { data: item, error } = await db
      .from("inventory")
      .select("*")
      .eq("id", itemId)
      .single();

    if (error) throw error;

    showModal("stockModal");
    document.getElementById("stockItemId").value = item.id;
    document.getElementById("stockItemName").value = item.name;
    document.getElementById("stockCurrent").value = item.stock;
    document.getElementById("stockAdjustment").value = "";
    document.getElementById("stockNotes").value = "";
  } catch (err) {
    showNotification("Gagal memuat data item", "error");
  }
}

async function submitStockUpdate() {
  const id = document.getElementById("stockItemId").value;
  const adj = parseInt(document.getElementById("stockAdjustment").value) || 0;
  const current = parseInt(document.getElementById("stockCurrent").value) || 0;
  const notes = document.getElementById("stockNotes").value;

  if (adj === 0) {
    showNotification("Harap isi jumlah penyesuaian", "warning");
    return;
  }

  try {
    showNotification("Mengupdate stok...", "info");
    const { error } = await db
      .from("inventory")
      .update({ stock: current + adj })
      .eq("id", id);

    if (error) throw error;

    // Log to audit log
    await db.from("audit_log").insert({
      user_id: currentUser.username,
      action: "updateStock",
      details: `Item ID: ${id}, Adj: ${adj}, Notes: ${notes}`,
    });

    showNotification("Stok berhasil diupdate!", "success");
    closeModal("stockModal");
    loadInventory();
  } catch (err) {
    showNotification("Gagal update stok", "error");
  }
}
async function loadFinancialData() {
  const tableBody = document.getElementById("financialTable");
  tableBody.innerHTML =
    '<tr><td colspan="8" style="text-align: center;">Memuat data...</td></tr>';
  try {
    const { data: orders, error } = await db
      .from("work_orders")
      .select("*, customers(name)")
      .order("date_in", { ascending: false });

    if (error) throw error;

    tableBody.innerHTML = orders
      .map(
        (order) =>
          `<tr><td>#${order.id}</td><td>${new Date(
            order.date_in
          ).toLocaleDateString()}</td><td>${
            order.customers?.name || "-"
          }</td><td>Servis</td><td><span class="status-badge status-${order.status.toLowerCase()}">${
            order.status
          }</span></td><td>${formatCurrency(order.total_cost)}</td><td>${
            order.payment_status
          }</td><td><button class="btn btn-sm" onclick="showInvoiceModal(${
            order.id
          })"><i class="fas fa-eye"></i></button></td></tr>`
      )
      .join("");
  } catch (error) {
    showNotification("Gagal memuat data keuangan", "error");
    console.error("Load Financial Data error:", error);
  }
}

async function exportFullReport() {
  try {
    const { data: orders, error } = await db
      .from("work_orders")
      .select(
        "*, customers(name), profiles!work_orders_technician_id_fkey(full_name)"
      )
      .order("date_in", { ascending: false });

    if (error) throw error;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent +=
      "ID,Tanggal,Customer,Keluhan,Status,Teknisi,Total,Pembayaran\n";

    orders.forEach((o) => {
      const row = [
        o.id,
        new Date(o.date_in).toLocaleDateString(),
        o.customers?.name || "-",
        (o.complaint || "").replace(/,/g, ";"),
        o.status,
        o.profiles?.full_name || "-",
        o.total_cost || 0,
        o.payment_status,
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Laporan-Keuangan-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Laporan berhasil diunduh!", "success");
  } catch (err) {
    showNotification("Gagal mengekspor laporan", "error");
    console.error("Export error:", err);
  }
}

async function deleteUser(id) {
  if (confirm("Anda yakin ingin menghapus user ini?")) {
    try {
      showNotification("Menghapus user...", "info");
      const { error } = await db.from("profiles").delete().eq("id", id);
      if (error) throw error;
      showNotification("User berhasil dihapus", "success");
      await loadUsersList();
    } catch (error) {
      showNotification("Gagal menghapus user", "error");
      console.error("Delete User error:", error);
    }
  }
}

async function editUser(id) {
  try {
    const { data: user, error } = await db
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;

    showModal("newUserModal");
    document.getElementById("newUsername").value = user.username;
    document.getElementById("newPassword").value = user.password;
    document.getElementById("newName").value = user.full_name;
    document.getElementById("newRole").value = user.role;
    document.getElementById("newPhone").value = user.phone || "";

    // Change modal title and button for edit
    document.querySelector("#newUserModal h3").textContent = "Edit User";
    document.querySelector("#newUserModal .btn-primary").textContent =
      "Update User";
    document.querySelector("#newUserModal .btn-primary").onclick = () =>
      updateUser(id);
  } catch (err) {
    showNotification("Gagal memuat data user", "error");
  }
}

async function updateUser(id) {
  const username = document.getElementById("newUsername").value;
  const password = document.getElementById("newPassword").value;
  const nama = document.getElementById("newName").value;
  const role = document.getElementById("newRole").value;
  const telepon = document.getElementById("newPhone").value;

  try {
    const { error } = await db
      .from("profiles")
      .update({
        username,
        password,
        full_name: nama,
        role,
        phone: telepon,
      })
      .eq("id", id);

    if (error) throw error;

    showNotification("User berhasil diupdate", "success");
    closeModal("newUserModal");
    // Reset modal state
    document.querySelector("#newUserModal h3").textContent = "Tambah User Baru";
    document.querySelector("#newUserModal .btn-primary").textContent =
      "Simpan User";
    document.querySelector("#newUserModal .btn-primary").onclick =
      createNewUser;

    await loadUsersList();
  } catch (error) {
    showNotification("Gagal update user", "error");
  }
}

/** News & Posts Functions **/
async function loadPublicPosts() {
  const postsGrid = document.getElementById("postsGrid");
  const newsSection = document.getElementById("newsSection");
  if (!postsGrid) return;

  try {
    const { data: posts, error } = await db
      .from("posts")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) throw error;

    if (posts && posts.length > 0) {
      newsSection.style.display = "block";
      postsGrid.innerHTML = posts
        .map(
          (post) => `
        <div class="post-card">
          ${
            post.image_url
              ? `<img src="${post.image_url}" class="post-image" alt="${post.title}">`
              : ""
          }
          <div class="post-body">
            <div class="post-date">${new Date(
              post.created_at
            ).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}</div>
            <h3 class="post-title">${post.title}</h3>
            <p class="post-content">${post.content.substring(0, 150)}${
            post.content.length > 150 ? "..." : ""
          }</p>
          </div>
        </div>
      `
        )
        .join("");
    } else {
      newsSection.style.display = "none";
    }
  } catch (err) {
    console.error("Load public posts error:", err);
  }
}

async function loadPostsManagement() {
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Manajemen Berita & Update</h3>
      </div>
      <div class="card-body">
        <div style="margin-bottom: 20px;">
          <button class="btn btn-primary" onclick="showPostModal()">
            <i class="fas fa-plus"></i> Buat Postingan Baru
          </button>
        </div>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Judul</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody id="postsTableBody">
              <tr><td colspan="4" style="text-align:center;">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  try {
    const { data: posts, error } = await db
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const tbody = document.getElementById("postsTableBody");
    if (!posts || posts.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;">Belum ada postingan.</td></tr>';
      return;
    }

    tbody.innerHTML = posts
      .map(
        (post) => `
      <tr>
        <td>${new Date(post.created_at).toLocaleDateString("id-ID")}</td>
        <td><strong>${post.title}</strong></td>
        <td>
          <span class="badge ${post.is_public ? "Lunas" : "Menunggu"}">
            ${post.is_public ? "Publik" : "Draft"}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:5px;">
            <button class="btn btn-sm" onclick="showPostModal(${post.id})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm text-danger" onclick="deletePost(${
              post.id
            })">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `
      )
      .join("");
  } catch (err) {
    showNotification("Gagal memuat daftar berita", "error");
  }
}

async function showPostModal(id = null) {
  const form = document.getElementById("postForm");
  form.reset();
  document.getElementById("postId").value = "";
  document.getElementById("postModalTitle").textContent = "Buat Postingan Baru";

  if (id) {
    try {
      const { data: post, error } = await db
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;

      document.getElementById("postId").value = post.id;
      document.getElementById("postTitle").value = post.title;
      document.getElementById("postContent").value = post.content;
      document.getElementById("postImageUrl").value = post.image_url || "";
      document.getElementById("postIsPublic").checked = post.is_public;
      document.getElementById("postModalTitle").textContent = "Edit Postingan";
    } catch (err) {
      showNotification("Gagal memuat data postingan", "error");
      return;
    }
  }

  showModal("postModal");
}

async function submitPost() {
  const id = document.getElementById("postId").value;
  const title = document.getElementById("postTitle").value;
  const content = document.getElementById("postContent").value;
  const imageUrl = document.getElementById("postImageUrl").value;
  const isPublic = document.getElementById("postIsPublic").checked;

  if (!title || !content) {
    showNotification("Judul dan Isi Berita wajib diisi", "warning");
    return;
  }

  try {
    const postData = {
      title,
      content,
      image_url: imageUrl,
      is_public: isPublic,
      author_id: currentUser.id,
      updated_at: new Date(),
    };

    let error;
    if (id) {
      const { error: err } = await db
        .from("posts")
        .update(postData)
        .eq("id", id);
      error = err;
    } else {
      const { error: err } = await db.from("posts").insert([postData]);
      error = err;
    }

    if (error) throw error;

    showNotification(
      id ? "Postingan berhasil diupdate" : "Postingan berhasil dibuat",
      "success"
    );
    closeModal("postModal");
    loadPostsManagement();
    loadPublicPosts(); // Update landing page too
  } catch (err) {
    showNotification("Gagal menyimpan postingan", "error");
  }
}

async function deletePost(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus postingan ini?")) return;

  try {
    const { error } = await db.from("posts").delete().eq("id", id);
    if (error) throw error;

    showNotification("Postingan berhasil dihapus", "success");
    loadPostsManagement();
    loadPublicPosts();
  } catch (err) {
    showNotification("Gagal menghapus postingan", "error");
  }
}
