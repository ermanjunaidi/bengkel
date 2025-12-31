// BACKEND GOOGLE APPS SCRIPT
// Deploy sebagai Web App dengan akses: Anyone, even anonymous

var SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// Inisialisasi sheet
function initSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var sheetNames = sheets.map((s) => s.getName());

  // Create sheets jika belum ada
  var requiredSheets = [
    "Customers",
    "Vehicles",
    "WorkOrders",
    "Inventory",
    "Users",
    "Transactions",
    "Settings",
    "WhatsAppLog",
    "AuditLog",
  ];

  requiredSheets.forEach((sheetName) => {
    if (!sheetNames.includes(sheetName)) {
      var sheet = ss.insertSheet(sheetName);
      // Setup headers untuk setiap sheet
      switch (sheetName) {
        case "Customers":
          sheet
            .getRange("A1:F1")
            .setValues([
              ["ID", "Nama", "Telepon", "Email", "Alamat", "CreatedAt"],
            ]);
          break;
        case "Vehicles":
          sheet
            .getRange("A1:H1")
            .setValues([
              [
                "ID",
                "CustomerID",
                "Plat",
                "Merk",
                "Model",
                "Tahun",
                "Warna",
                "CreatedAt",
              ],
            ]);
          break;
        case "WorkOrders":
          sheet
            .getRange("A1:O1")
            .setValues([
              [
                "ID",
                "CustomerID",
                "VehicleID",
                "TanggalMasuk",
                "TanggalSelesai",
                "Keluhan",
                "Status",
                "Teknisi",
                "TotalBiaya",
                "Pembayaran",
                "Catatan",
                "CreatedBy",
                "CreatedAt",
                "UpdatedBy",
                "UpdatedAt",
              ],
            ]);
          break;
        case "Inventory":
          sheet
            .getRange("A1:I1")
            .setValues([
              [
                "ID",
                "KodePart",
                "Nama",
                "Kategori",
                "Stok",
                "StokMin",
                "HargaBeli",
                "HargaJual",
                "CreatedAt",
              ],
            ]);
          // Tambah data contoh
          sheet.appendRow([
            1,
            "OLI-001",
            "Oli Mesin 1L",
            "Oli",
            50,
            10,
            45000,
            65000,
            new Date(),
          ]);
          sheet.appendRow([
            2,
            "FIL-001",
            "Filter Oli",
            "Filter",
            30,
            5,
            25000,
            45000,
            new Date(),
          ]);
          sheet.appendRow([
            3,
            "KAMP-001",
            "Kampas Rem Depan",
            "Rem",
            20,
            5,
            120000,
            180000,
            new Date(),
          ]);
          break;
        case "Users":
          sheet
            .getRange("A1:G1")
            .setValues([
              [
                "ID",
                "Username",
                "Password",
                "Nama",
                "Role",
                "Telepon",
                "CreatedAt",
              ],
            ]);
          // Add default users
          var now = new Date();
          sheet.appendRow([
            1,
            "admin",
            "admin123",
            "Administrator",
            "admin",
            "08123456789",
            now,
          ]);
          sheet.appendRow([
            2,
            "kasir",
            "kasir123",
            "Budi Kasir",
            "kasir",
            "08123456780",
            now,
          ]);
          sheet.appendRow([
            3,
            "teknisi",
            "teknisi123",
            "Andi Teknisi",
            "teknisi",
            "08123456781",
            now,
          ]);
          sheet.appendRow([
            4,
            "supervisor",
            "supervisor123",
            "Sari Supervisor",
            "supervisor",
            "08123456782",
            now,
          ]);
          break;
        case "Transactions":
          sheet
            .getRange("A1:H1")
            .setValues([
              [
                "ID",
                "WorkOrderID",
                "Type",
                "ItemID",
                "ItemName",
                "Jumlah",
                "Harga",
                "Subtotal",
              ],
            ]);
          break;
        case "Settings":
          sheet.getRange("A1:B1").setValues([["Key", "Value"]]);
          sheet.appendRow(["whatsapp_api_key", "YOUR_API_KEY_HERE"]);
          sheet.appendRow(["company_name", "Bengkel Motor Jaya"]);
          sheet.appendRow(["company_address", "Jl. Contoh No. 123, Jakarta"]);
          sheet.appendRow(["company_phone", "021-1234567"]);
          break;
        case "WhatsAppLog":
          sheet
            .getRange("A1:E1")
            .setValues([["ID", "Phone", "Message", "Status", "CreatedAt"]]);
          break;
        case "AuditLog":
          sheet
            .getRange("A1:F1")
            .setValues([
              ["ID", "User", "Action", "Details", "IP", "CreatedAt"],
            ]);
          break;
      }
      sheet.getRange("A1:Z1").setFontWeight("bold").setBackground("#f0f0f0");
    }
  });
}

// Handle requests
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  initSheet();

  var action = e.parameter.action;
  var result = {};

  try {
    switch (action) {
      // Authentication
      case "login":
        result = handleLogin(e.parameter.username, e.parameter.password);
        break;
      case "getUserProfile":
        result = getUserProfile(e.parameter.userId);
        break;
      case "updateUser":
        result = updateUser(e.parameter);
        break;

      // Work Orders
      case "getWorkOrders":
        result = getWorkOrders(
          e.parameter.status,
          e.parameter.userId,
          e.parameter.role
        );
        break;
      case "getWorkOrderById":
        result = getWorkOrderById(e.parameter.id);
        break;
      case "createWorkOrder":
        result = createWorkOrder(e.parameter);
        break;
      case "updateWorkOrder":
        result = updateWorkOrder(e.parameter);
        break;
      case "deleteWorkOrder":
        result = deleteWorkOrder(e.parameter.id, e.parameter.userId);
        break;

      // Customers
      case "getCustomers":
        result = getCustomers();
        break;
      case "searchCustomer":
        result = searchCustomer(e.parameter.phone);
        break;
      case "createCustomer":
        result = createCustomer(e.parameter);
        break;

      // Inventory
      case "getInventory":
        result = getInventory();
        break;
      case "updateInventory":
        result = updateInventory(e.parameter);
        break;

      // Reports
      case "getDashboardData":
        result = getDashboardData();
        break;
      case "getFinancialReport":
        result = getFinancialReport(e.parameter.startDate, e.parameter.endDate);
        break;
      case "getTechnicianReport":
        result = getTechnicianReport(
          e.parameter.startDate,
          e.parameter.endDate
        );
        break;
      case "getInventoryReport":
        result = getInventoryReport();
        break;

      // WhatsApp
      case "sendWhatsApp":
        result = sendWhatsApp(e.parameter.phone, e.parameter.message);
        break;
      case "getWhatsAppTemplates":
        result = getWhatsAppTemplates();
        break;

      // Users Management
      case "getAllUsers":
        result = getAllUsers();
        break;
      case "createNewUser":
        result = createNewUser(e.parameter);
        break;

      // Settings
      case "getSettings":
        result = getSettings();
        break;
      case "updateSettings":
        result = updateSettings(e.parameter);
        break;

      // Print PDF
      case "generateInvoice":
        result = generateInvoice(e.parameter.orderId);
        break;

      default:
        result = { success: false, message: "Action tidak ditemukan" };
    }
  } catch (error) {
    result = { success: false, message: "Error: " + error.toString() };
  }

  // Log audit
  logAudit(
    e.parameter.userId || "unknown",
    action,
    JSON.stringify(e.parameter),
    e.parameter.ip
  );

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
    ContentService.MimeType.JSON
  );
}

// AUDIT LOG
function logAudit(userId, action, details, ip) {
  try {
    var sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName("AuditLog");
    var lastRow = sheet.getLastRow();
    var newId = lastRow;

    sheet.appendRow([
      newId,
      userId,
      action,
      details.substring(0, 495),
      ip || "unknown",
      new Date(),
    ]);
  } catch (e) {
    // Silent fail untuk audit log
  }
}

// USER MANAGEMENT FUNCTIONS
function handleLogin(username, password) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === username && data[i][2] === password) {
      return {
        success: true,
        user: {
          id: data[i][0],
          username: data[i][1],
          nama: data[i][3],
          role: data[i][4],
          telepon: data[i][5],
        },
      };
    }
  }
  return { success: false, message: "Username atau password salah" };
}

function getUserProfile(userId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == userId) {
      return {
        success: true,
        user: {
          id: data[i][0],
          username: data[i][1],
          nama: data[i][3],
          role: data[i][4],
          telepon: data[i][5],
        },
      };
    }
  }
  return { success: false, message: "User tidak ditemukan" };
}

function getAllUsers() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  var data = sheet.getDataRange().getValues();
  var users = [];

  for (var i = 1; i < data.length; i++) {
    users.push({
      id: data[i][0],
      username: data[i][1],
      nama: data[i][3],
      role: data[i][4],
      telepon: data[i][5],
    });
  }

  return { success: true, data: users };
}

function createNewUser(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  var lastRow = sheet.getLastRow();
  var newId = lastRow;

  // Check if username exists
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === params.username) {
      return { success: false, message: "Username sudah digunakan" };
    }
  }

  sheet.appendRow([
    newId,
    params.username,
    params.password,
    params.nama,
    params.role,
    params.telepon || "",
    new Date(),
  ]);

  return { success: true, message: "User berhasil ditambahkan", id: newId };
}

function updateUser(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == params.id) {
      var row = i + 1;
      if (params.nama) sheet.getRange(row, 4).setValue(params.nama);
      if (params.telepon) sheet.getRange(row, 6).setValue(params.telepon);
      if (params.password && params.password !== "********") {
        sheet.getRange(row, 3).setValue(params.password);
      }

      return { success: true, message: "Profile berhasil diupdate" };
    }
  }
  return { success: false, message: "User tidak ditemukan" };
}

// WORK ORDERS dengan role-based access
function getWorkOrders(status, userId, role) {
  var sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("WorkOrders");
  var data = sheet.getDataRange().getValues();
  var orders = [];

  for (var i = 1; i < data.length; i++) {
    var order = {
      ID: data[i][0],
      CustomerID: data[i][1],
      VehicleID: data[i][2],
      TanggalMasuk: data[i][3],
      TanggalSelesai: data[i][4],
      Keluhan: data[i][5],
      Status: data[i][6],
      Teknisi: data[i][7],
      TotalBiaya: data[i][8],
      Pembayaran: data[i][9],
      Catatan: data[i][10],
      CreatedBy: data[i][11],
      CreatedAt: data[i][12],
    };

    // Role-based filtering
    var showOrder = true;

    if (status && order.Status !== status) {
      showOrder = false;
    }

    // Teknisi hanya bisa lihat order yang ditugaskan ke mereka
    if (role === "teknisi" && order.Teknisi !== userId) {
      showOrder = false;
    }

    if (showOrder) {
      orders.push(order);
    }
  }

  return { success: true, data: orders };
}

function createWorkOrder(params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var woSheet = ss.getSheetByName("WorkOrders");

  var lastRow = woSheet.getLastRow();
  var newId = lastRow;

  var now = new Date();
  var woData = [
    newId,
    params.customerId || "",
    params.vehicleId || "",
    new Date(params.tanggalMasuk || now),
    params.tanggalSelesai ? new Date(params.tanggalSelesai) : "",
    params.keluhan || "",
    "Menunggu",
    params.teknisi || "",
    0,
    "Belum Lunas",
    params.catatan || "",
    params.createdBy,
    now,
    params.createdBy,
    now,
  ];

  woSheet.appendRow(woData);

  // Log ke WhatsApp jika customer ada telepon
  if (params.customerPhone) {
    var message = `Halo, work order Anda telah dibuat dengan ID: #${newId}. Status: Menunggu. Terima kasih.`;
    sendWhatsApp(params.customerPhone, message);
  }

  return {
    success: true,
    id: newId,
    message: "Work Order berhasil dibuat",
  };
}

// FINANCIAL REPORT
function getFinancialReport(startDate, endDate) {
  var sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("WorkOrders");
  var data = sheet.getDataRange().getValues();

  var start = startDate
    ? new Date(startDate)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  var end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  var report = {
    totalOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    pendingPayment: 0,
    dailyRevenue: {},
    monthlyRevenue: {},
    paymentStatus: {
      Lunas: 0,
      "DP 50%": 0,
      "Belum Lunas": 0,
    },
    details: [],
  };

  for (var i = 1; i < data.length; i++) {
    var orderDate = new Date(data[i][3]);

    if (orderDate >= start && orderDate <= end) {
      var order = {
        id: data[i][0],
        tanggal: data[i][3],
        status: data[i][6],
        teknisi: data[i][7],
        total: parseFloat(data[i][8]) || 0,
        pembayaran: data[i][9],
      };

      report.totalOrders++;
      report.totalRevenue += order.total;

      // Count by status
      if (order.status === "Selesai") {
        report.completedOrders++;
      }

      // Count by payment status
      if (report.paymentStatus.hasOwnProperty(order.pembayaran)) {
        report.paymentStatus[order.pembayaran]++;
      }

      // Pending payment calculation
      if (order.pembayaran === "DP 50%") {
        report.pendingPayment += order.total * 0.5;
      } else if (order.pembayaran === "Belum Lunas") {
        report.pendingPayment += order.total;
      }

      // Daily revenue
      var dayKey = Utilities.formatDate(
        orderDate,
        Session.getScriptTimeZone(),
        "yyyy-MM-dd"
      );
      report.dailyRevenue[dayKey] =
        (report.dailyRevenue[dayKey] || 0) + order.total;

      // Monthly revenue
      var monthKey = Utilities.formatDate(
        orderDate,
        Session.getScriptTimeZone(),
        "yyyy-MM"
      );
      report.monthlyRevenue[monthKey] =
        (report.monthlyRevenue[monthKey] || 0) + order.total;

      report.details.push(order);
    }
  }

  // Calculate averages
  report.averageOrderValue =
    report.totalOrders > 0 ? report.totalRevenue / report.totalOrders : 0;
  report.completionRate =
    report.totalOrders > 0
      ? (report.completedOrders / report.totalOrders) * 100
      : 0;

  return { success: true, report: report };
}

// WHATSAPP NOTIFICATION (Simulasi menggunakan WhatsApp Business API)
function sendWhatsApp(phone, message) {
  var sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("WhatsAppLog");
  var lastRow = sheet.getLastRow();
  var newId = lastRow;

  // Simulasi pengiriman WhatsApp
  // Di production, gunakan API seperti Twilio, WhatsApp Business API, atau layanan lainnya
  var status = "Simulated";

  try {
    // Contoh integrasi dengan API external (uncomment dan konfigurasi jika punya API)
    /*
    var apiKey = getSetting("whatsapp_api_key");
    var url = "https://api.whatsapp.com/send?phone=" + phone + "&text=" + encodeURIComponent(message);
    
    var options = {
      'method': 'post',
      'headers': {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      'payload': JSON.stringify({
        'phone': phone,
        'message': message
      })
    };
    
    var response = UrlFetchApp.fetch(url, options);
    status = "Sent";
    */

    sheet.appendRow([newId, phone, message, status, new Date()]);

    return { success: true, message: "Notifikasi berhasil dikirim (simulasi)" };
  } catch (e) {
    status = "Failed: " + e.toString();
    sheet.appendRow([newId, phone, message, status, new Date()]);
    return {
      success: false,
      message: "Gagal mengirim notifikasi: " + e.toString(),
    };
  }
}

function getWhatsAppTemplates() {
  var templates = [
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
      message:
        "Halo, kendaraan Anda telah selesai diperbaiki. Silakan mengambil di bengkel. Total: Rp {total}. Terima kasih.",
    },
  ];

  return { success: true, templates: templates };
}

// GENERATE INVOICE (HTML untuk PDF)
function generateInvoice(orderId) {
  var woSheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("WorkOrders");
  var woData = woSheet.getDataRange().getValues();

  var order = null;
  for (var i = 1; i < woData.length; i++) {
    if (woData[i][0] == orderId) {
      order = {
        id: woData[i][0],
        tanggalMasuk: woData[i][3],
        tanggalSelesai: woData[i][4],
        keluhan: woData[i][5],
        status: woData[i][6],
        teknisi: woData[i][7],
        total: woData[i][8],
        pembayaran: woData[i][9],
        catatan: woData[i][10],
      };
      break;
    }
  }

  if (!order) {
    return { success: false, message: "Order tidak ditemukan" };
  }

  // Get settings
  var settingsSheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Settings");
  var settingsData = settingsSheet.getDataRange().getValues();
  var settings = {};
  for (var i = 1; i < settingsData.length; i++) {
    settings[settingsData[i][0]] = settingsData[i][1];
  }

  // Generate HTML invoice
  var html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .invoice { max-width: 800px; margin: 0 auto; background: white; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .company-name { font-size: 24px; font-weight: bold; }
        .invoice-title { font-size: 28px; margin: 20px 0; }
        .details { margin: 30px 0; }
        .detail-row { display: flex; margin-bottom: 10px; }
        .detail-label { width: 150px; font-weight: bold; }
        .table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .table th { background-color: #f4f4f4; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 30px; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
        .signature { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature-box { width: 200px; text-align: center; }
        .signature-line { border-top: 1px solid #000; margin-top: 60px; }
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="header">
          <div class="company-name">${
            settings.company_name || "BENGKEL MOTOR"
          }</div>
          <div>${
            settings.company_address || "Jl. Contoh No. 123, Jakarta"
          }</div>
          <div>Telp: ${settings.company_phone || "021-1234567"}</div>
          <h1 class="invoice-title">INVOICE</h1>
          <div>No: INV-${order.id}-${Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyyMMdd"
  )}</div>
        </div>
        
        <div class="details">
          <div class="detail-row">
            <div class="detail-label">Work Order ID:</div>
            <div>#${order.id}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Tanggal Masuk:</div>
            <div>${Utilities.formatDate(
              order.tanggalMasuk,
              Session.getScriptTimeZone(),
              "dd/MM/yyyy"
            )}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Tanggal Selesai:</div>
            <div>${
              order.tanggalSelesai
                ? Utilities.formatDate(
                    order.tanggalSelesai,
                    Session.getScriptTimeZone(),
                    "dd/MM/yyyy"
                  )
                : "-"
            }</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Status:</div>
            <div>${order.status}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Teknisi:</div>
            <div>${order.teknisi}</div>
          </div>
        </div>
        
        <div>
          <h3>Keluhan:</h3>
          <p>${order.keluhan}</p>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>No</th>
              <th>Deskripsi</th>
              <th>Jumlah</th>
              <th>Harga</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Jasa Servis</td>
              <td>1</td>
              <td>Rp ${(order.total * 0.6).toLocaleString()}</td>
              <td>Rp ${(order.total * 0.6).toLocaleString()}</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Sparepart</td>
              <td>1</td>
              <td>Rp ${(order.total * 0.4).toLocaleString()}</td>
              <td>Rp ${(order.total * 0.4).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="total">
          <div>Total: Rp ${order.total.toLocaleString()}</div>
          <div>Status Pembayaran: ${order.pembayaran}</div>
        </div>
        
        <div class="signature">
          <div class="signature-box">
            <div>Hormat Kami,</div>
            <div class="signature-line"></div>
            <div>${settings.company_name || "Bengkel Motor"}</div>
          </div>
          <div class="signature-box">
            <div>Pelanggan,</div>
            <div class="signature-line"></div>
            <div>Nama Terang</div>
          </div>
        </div>
        
        <div class="footer">
          <p>Terima kasih telah mempercayakan kendaraan Anda kepada kami.</p>
          <p>Invoice ini adalah bukti pembayaran yang sah.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { success: true, html: html };
}

// SETTINGS
function getSettings() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Settings");
  var data = sheet.getDataRange().getValues();
  var settings = {};

  for (var i = 1; i < data.length; i++) {
    settings[data[i][0]] = data[i][1];
  }

  return { success: true, settings: settings };
}

// Helper functions
function getSetting(key) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Settings");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      return data[i][1];
    }
  }
  return null;
}

// Tambahkan fungsi-fungsi yang sudah ada sebelumnya (getCustomers, searchCustomer, createCustomer, getInventory, updateInventory, getDashboardData, getTechnicianReport, getInventoryReport)
// ... [kode fungsi-fungsi yang sudah ada sebelumnya]

// Untuk singkatnya, saya lampirkan fungsi-fungsi yang penting saja
function searchCustomer(phone) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Customers");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][2] === phone) {
      return {
        success: true,
        data: {
          id: data[i][0],
          nama: data[i][1],
          telepon: data[i][2],
          email: data[i][3],
          alamat: data[i][4],
        },
      };
    }
  }
  return { success: true, data: null };
}

function createCustomer(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Customers");
  var lastRow = sheet.getLastRow();
  var newId = lastRow;

  sheet.appendRow([
    newId,
    params.nama,
    params.telepon,
    params.email || "",
    params.alamat || "",
    new Date(),
  ]);

  return { success: true, id: newId, message: "Customer berhasil ditambahkan" };
}

function getInventory() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
  var data = sheet.getDataRange().getValues();
  var items = [];

  for (var i = 1; i < data.length; i++) {
    items.push({
      id: data[i][0],
      kode: data[i][1],
      nama: data[i][2],
      kategori: data[i][3],
      stok: data[i][4],
      stokMin: data[i][5],
      hargaBeli: data[i][6],
      hargaJual: data[i][7],
    });
  }

  return { success: true, data: items };
}

function updateInventory(params) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == params.id || data[i][1] == params.kode) {
      var row = i + 1;
      if (params.stok !== undefined)
        sheet.getRange(row, 5).setValue(params.stok);
      if (params.hargaJual !== undefined)
        sheet.getRange(row, 8).setValue(params.hargaJual);
      if (params.hargaBeli !== undefined)
        sheet.getRange(row, 7).setValue(params.hargaBeli);

      return { success: true, message: "Inventory berhasil diupdate" };
    }
  }
  return { success: false, message: "Item tidak ditemukan" };
}

function getDashboardData() {
  var woSheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("WorkOrders");
  var woData = woSheet.getDataRange().getValues();

  var stats = {
    total: 0,
    pending: 0,
    progress: 0,
    completed: 0,
    revenue: 0,
    todayOrders: 0,
    lowStockItems: 0,
  };

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  for (var i = 1; i < woData.length; i++) {
    stats.total++;
    var orderDate = new Date(woData[i][3]);
    orderDate.setHours(0, 0, 0, 0);

    if (orderDate.getTime() === today.getTime()) {
      stats.todayOrders++;
    }

    switch (woData[i][6]) {
      case "Menunggu":
        stats.pending++;
        break;
      case "Diproses":
        stats.progress++;
        break;
      case "Selesai":
        stats.completed++;
        stats.revenue += parseFloat(woData[i][8] || 0);
        break;
    }
  }

  // Check low stock
  var invSheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
  var invData = invSheet.getDataRange().getValues();

  for (var j = 1; j < invData.length; j++) {
    if (invData[j][4] <= invData[j][5]) {
      // stok <= stokMin
      stats.lowStockItems++;
    }
  }

  return { success: true, stats: stats };
}
