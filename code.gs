// Google Apps Script Web App backend
// Deploy as Web App with access: Anyone

var SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

var TABLE_CONFIG = {
  profiles: {
    sheetName: "Users",
    columns: [
      "id",
      "username",
      "password",
      "full_name",
      "role",
      "phone",
      "created_at",
    ],
    keyField: "id",
  },
  customers: {
    sheetName: "Customers",
    columns: ["id", "name", "phone", "email", "address", "created_at"],
    keyField: "id",
  },
  vehicles: {
    sheetName: "Vehicles",
    columns: [
      "id",
      "customer_id",
      "plate",
      "brand",
      "model",
      "year",
      "color",
      "created_at",
    ],
    keyField: "id",
  },
  work_orders: {
    sheetName: "WorkOrders",
    columns: [
      "id",
      "customer_id",
      "vehicle_id",
      "date_in",
      "date_out",
      "complaint",
      "status",
      "technician_id",
      "total_cost",
      "payment_status",
      "notes",
      "created_by",
      "created_at",
      "updated_by",
      "updated_at",
    ],
    keyField: "id",
  },
  inventory: {
    sheetName: "Inventory",
    columns: [
      "id",
      "part_code",
      "name",
      "category",
      "stock",
      "min_stock",
      "buy_price",
      "sell_price",
      "created_at",
    ],
    keyField: "id",
  },
  settings: {
    sheetName: "Settings",
    columns: ["key", "value"],
    keyField: "key",
  },
  posts: {
    sheetName: "Posts",
    columns: [
      "id",
      "title",
      "content",
      "image_url",
      "is_public",
      "author_id",
      "created_at",
      "updated_at",
    ],
    keyField: "id",
  },
  audit_log: {
    sheetName: "AuditLog",
    columns: ["id", "user_id", "action", "details", "ip", "created_at"],
    keyField: "id",
  },
  transactions: {
    sheetName: "Transactions",
    columns: [
      "id",
      "work_order_id",
      "type",
      "item_id",
      "item_name",
      "quantity",
      "price",
      "subtotal",
    ],
    keyField: "id",
  },
  whatsapp_log: {
    sheetName: "WhatsAppLog",
    columns: ["id", "phone", "message", "status", "created_at"],
    keyField: "id",
  },
};

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  initSheet();

  var params = normalizeParams_(e);
  var action = params.action || "query";
  var result;

  try {
    switch (action) {
      case "health":
        result = { success: true, message: "API aktif", sheetId: SHEET_ID };
        break;
      case "query":
        result = runQuery_(params);
        break;
      default:
        result = { success: false, error: "Action tidak ditemukan" };
        break;
    }
  } catch (error) {
    result = {
      success: false,
      error: error && error.message ? error.message : String(error),
    };
  }

  try {
    logAudit_(
      params.audit_user || params.user_id || "system",
      action,
      JSON.stringify({
        table: params.table,
        operation: params.operation,
        filters: params.filters,
      }).substring(0, 495),
      params.ip || ""
    );
  } catch (auditError) {}

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function initSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetNames = ss.getSheets().map(function (sheet) {
    return sheet.getName();
  });

  Object.keys(TABLE_CONFIG).forEach(function (table) {
    var config = TABLE_CONFIG[table];
    if (sheetNames.indexOf(config.sheetName) !== -1) return;

    var sheet = ss.insertSheet(config.sheetName);
    sheet
      .getRange(1, 1, 1, config.columns.length)
      .setValues([config.columns])
      .setFontWeight("bold")
      .setBackground("#f0f0f0");

    seedSheet_(table, sheet);
  });
}

function seedSheet_(table, sheet) {
  var now = new Date();

  if (table === "profiles") {
    sheet.getRange(2, 1, 4, 7).setValues([
      [1, "admin", "admin123", "Administrator", "admin", "08123456789", now],
      [2, "kasir", "kasir123", "Budi Kasir", "kasir", "08123456780", now],
      [3, "teknisi", "teknisi123", "Andi Teknisi", "teknisi", "08123456781", now],
      [
        4,
        "supervisor",
        "supervisor123",
        "Sari Supervisor",
        "supervisor",
        "08123456782",
        now,
      ],
    ]);
  }

  if (table === "inventory") {
    sheet.getRange(2, 1, 3, 9).setValues([
      [1, "OLI-001", "Oli Mesin 1L", "Oli", 50, 10, 45000, 65000, now],
      [2, "FIL-001", "Filter Oli", "Filter", 30, 5, 25000, 45000, now],
      [3, "KAMP-001", "Kampas Rem Depan", "Rem", 20, 5, 120000, 180000, now],
    ]);
  }

  if (table === "settings") {
    sheet.getRange(2, 1, 4, 2).setValues([
      ["company_name", "Sistem Bengkel"],
      ["company_address", "Jl. Contoh No. 123"],
      ["company_phone", "08123456789"],
      ["whatsapp_api_key", "YOUR_API_KEY_HERE"],
    ]);
  }
}

function normalizeParams_(e) {
  var params = {};
  if (e && e.parameter) {
    Object.keys(e.parameter).forEach(function (key) {
      params[key] = parseMaybeJson_(e.parameter[key]);
    });
  }

  if (e && e.postData && e.postData.contents) {
    var payload = parseMaybeJson_(e.postData.contents);
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      Object.keys(payload).forEach(function (key) {
        params[key] = payload[key];
      });
    }
  }

  return params;
}

function parseMaybeJson_(value) {
  if (value === null || value === undefined || value === "") return value;
  if (typeof value !== "string") return value;

  var trimmed = value.trim();
  if (!trimmed) return value;

  if (
    trimmed === "true" ||
    trimmed === "false" ||
    trimmed === "null" ||
    /^-?\d+(\.\d+)?$/.test(trimmed) ||
    trimmed.charAt(0) === "[" ||
    trimmed.charAt(0) === "{"
  ) {
    try {
      return JSON.parse(trimmed);
    } catch (err) {}
  }

  return value;
}

function runQuery_(params) {
  var table = params.table;
  var operation = params.operation || "select";

  if (!TABLE_CONFIG[table]) {
    throw new Error("Table tidak dikenal: " + table);
  }

  switch (operation) {
    case "select":
      return selectRows_(table, params);
    case "insert":
      return insertRows_(table, params.data);
    case "update":
      return updateRows_(table, params.filters || [], params.data || {});
    case "upsert":
      return upsertRows_(table, params.data);
    case "delete":
      return deleteRows_(table, params.filters || []);
    default:
      throw new Error("Operation tidak didukung: " + operation);
  }
}

function selectRows_(table, params) {
  var rows = enrichRows_(table, readRows_(table));
  var filtered = applyFilters_(rows, params.filters || [], params.orFilters || []);
  var totalCount = filtered.length;

  filtered = sortRows_(filtered, params.orderBy);
  filtered = sliceRows_(filtered, params.rangeFrom, params.rangeTo, params.limit);

  if (params.single) {
    if (!filtered.length) {
      return { success: false, error: "Data tidak ditemukan", data: null };
    }
    return { success: true, data: filtered[0], count: totalCount };
  }

  return { success: true, data: filtered, count: totalCount };
}

function insertRows_(table, data) {
  var config = TABLE_CONFIG[table];
  var sheet = getSheet_(table);
  var items = Array.isArray(data) ? data : [data];
  var existingRows = readRows_(table);
  var nextId = getNextId_(existingRows);
  var inserted = [];

  items.forEach(function (item) {
    var record = sanitizeRowForWrite_(table, item || {}, true, nextId);
    if (config.keyField === "id") {
      record.id = nextId;
      nextId++;
    }
    if (table === "work_orders") {
      record.status = record.status || "Menunggu";
      record.payment_status = record.payment_status || "Belum Lunas";
      record.total_cost = toNumber_(record.total_cost);
      record.date_in = record.date_in || new Date().toISOString();
      record.created_at = record.created_at || new Date().toISOString();
    }
    if (table === "posts") {
      record.created_at = record.created_at || new Date().toISOString();
      record.updated_at = record.updated_at || record.created_at;
      record.is_public = toBoolean_(record.is_public);
    }

    sheet.appendRow(toSheetRow_(table, record));
    inserted.push(record);
  });

  return {
    success: true,
    data: enrichRows_(table, inserted),
    count: inserted.length,
  };
}

function updateRows_(table, filters, data) {
  var config = TABLE_CONFIG[table];
  var sheet = getSheet_(table);
  var rows = readRows_(table);
  var changed = [];

  for (var i = 0; i < rows.length; i++) {
    if (!matchesFilters_(rows[i], filters) || !matchesOrFilters_(rows[i], [])) {
      continue;
    }

    var updated = mergeRowData_(table, rows[i], data || {});
    if (table === "work_orders") {
      updated.updated_at = new Date().toISOString();
    }
    if (table === "posts") {
      updated.updated_at = new Date().toISOString();
    }

    sheet
      .getRange(i + 2, 1, 1, config.columns.length)
      .setValues([toSheetRow_(table, updated)]);
    changed.push(updated);
  }

  return { success: true, data: enrichRows_(table, changed), count: changed.length };
}

function upsertRows_(table, data) {
  var config = TABLE_CONFIG[table];
  var items = Array.isArray(data) ? data : [data];
  var updated = [];
  var inserted = [];
  var rows = readRows_(table);

  items.forEach(function (item) {
    var keyValue = item ? item[config.keyField] : null;
    var filters = [];

    if (keyValue !== null && keyValue !== undefined && keyValue !== "") {
      filters.push({
        field: config.keyField,
        operator: "eq",
        value: keyValue,
      });
    }

    var exists = filters.length ? applyFilters_(rows, filters, []) : [];
    if (exists.length) {
      var result = updateRows_(table, filters, item);
      updated = updated.concat(result.data || []);
    } else {
      var insertResult = insertRows_(table, item);
      inserted = inserted.concat(insertResult.data || []);
    }

    rows = readRows_(table);
  });

  return {
    success: true,
    data: enrichRows_(table, updated.concat(inserted)),
    count: updated.length + inserted.length,
  };
}

function deleteRows_(table, filters) {
  var config = TABLE_CONFIG[table];
  var sheet = getSheet_(table);
  var rows = readRows_(table);
  var deleted = [];

  for (var i = rows.length - 1; i >= 0; i--) {
    if (!matchesFilters_(rows[i], filters) || !matchesOrFilters_(rows[i], [])) {
      continue;
    }
    deleted.push(rows[i]);
    sheet.deleteRow(i + 2);
  }

  return { success: true, data: enrichRows_(table, deleted), count: deleted.length };
}

function readRows_(table) {
  var config = TABLE_CONFIG[table];
  var sheet = getSheet_(table);
  var values = sheet.getDataRange().getValues();
  var rows = [];

  for (var i = 1; i < values.length; i++) {
    var row = {};
    for (var j = 0; j < config.columns.length; j++) {
      row[config.columns[j]] = normalizeCellValue_(values[i][j], config.columns[j]);
    }
    rows.push(row);
  }

  return rows;
}

function getSheet_(table) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    TABLE_CONFIG[table].sheetName
  );
}

function normalizeCellValue_(value, field) {
  if (value === "" || value === null || value === undefined) return "";
  if (field === "id") return toNumber_(value);
  if (field === "is_public") return toBoolean_(value);
  if (
    field === "total_cost" ||
    field === "stock" ||
    field === "min_stock" ||
    field === "buy_price" ||
    field === "sell_price" ||
    field === "quantity" ||
    field === "price" ||
    field === "subtotal"
  ) {
    return toNumber_(value);
  }
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return value.toISOString();
  }
  return value;
}

function sanitizeRowForWrite_(table, row, isInsert, nextId) {
  var config = TABLE_CONFIG[table];
  var clean = {};

  config.columns.forEach(function (column) {
    if (!Object.prototype.hasOwnProperty.call(row, column)) return;
    clean[column] = normalizeWriteValue_(column, row[column]);
  });

  if (isInsert) {
    if (config.keyField === "id" && !clean.id) clean.id = nextId;
    if (config.columns.indexOf("created_at") !== -1 && !clean.created_at) {
      clean.created_at = new Date().toISOString();
    }
    if (config.columns.indexOf("updated_at") !== -1 && !clean.updated_at) {
      clean.updated_at = new Date().toISOString();
    }
  }

  return clean;
}

function mergeRowData_(table, currentRow, updates) {
  var config = TABLE_CONFIG[table];
  var merged = {};

  config.columns.forEach(function (column) {
    merged[column] = currentRow[column];
  });

  Object.keys(updates || {}).forEach(function (key) {
    if (config.columns.indexOf(key) === -1) return;
    merged[key] = normalizeWriteValue_(key, updates[key]);
  });

  return merged;
}

function normalizeWriteValue_(field, value) {
  if (value === undefined) return value;
  if (field === "is_public") return toBoolean_(value);
  if (
    field === "id" ||
    field === "customer_id" ||
    field === "vehicle_id" ||
    field === "technician_id" ||
    field === "created_by" ||
    field === "updated_by" ||
    field === "stock" ||
    field === "min_stock" ||
    field === "buy_price" ||
    field === "sell_price" ||
    field === "total_cost" ||
    field === "quantity" ||
    field === "price" ||
    field === "subtotal"
  ) {
    return value === "" || value === null ? "" : toNumber_(value);
  }
  return value;
}

function toSheetRow_(table, row) {
  return TABLE_CONFIG[table].columns.map(function (column) {
    return row[column] === undefined ? "" : row[column];
  });
}

function getNextId_(rows) {
  var maxId = 0;
  rows.forEach(function (row) {
    maxId = Math.max(maxId, toNumber_(row.id));
  });
  return maxId + 1;
}

function applyFilters_(rows, filters, orFilters) {
  return rows.filter(function (row) {
    return matchesFilters_(row, filters || []) && matchesOrFilters_(row, orFilters || []);
  });
}

function matchesFilters_(row, filters) {
  for (var i = 0; i < filters.length; i++) {
    if (!matchCondition_(row, filters[i])) return false;
  }
  return true;
}

function matchesOrFilters_(row, orFilters) {
  if (!orFilters || !orFilters.length) return true;

  for (var i = 0; i < orFilters.length; i++) {
    if (matchCondition_(row, orFilters[i])) return true;
  }
  return false;
}

function matchCondition_(row, filter) {
  if (!filter || !filter.field) return true;

  var field = filter.field;
  var operator = filter.operator || "eq";
  var value = filter.value;
  var rowValue = getComparableFieldValue_(row, field);

  if (operator === "eq") {
    return String(rowValue) === String(value);
  }
  if (operator === "ilike") {
    return String(rowValue).toLowerCase().indexOf(String(value).toLowerCase()) !== -1;
  }
  if (operator === "gte") {
    return compareValues_(rowValue, value) >= 0;
  }
  if (operator === "lte") {
    return compareValues_(rowValue, value) <= 0;
  }

  return false;
}

function getComparableFieldValue_(row, field) {
  if (field.indexOf(".") === -1) {
    return row[field];
  }

  var parts = field.split(".");
  var value = row;

  for (var i = 0; i < parts.length; i++) {
    value = value ? value[parts[i]] : "";
  }

  return value;
}

function compareValues_(left, right) {
  var leftDate = tryParseDate_(left);
  var rightDate = tryParseDate_(right);
  if (leftDate && rightDate) {
    return leftDate.getTime() - rightDate.getTime();
  }

  var leftNum = parseFloat(left);
  var rightNum = parseFloat(right);
  if (!isNaN(leftNum) && !isNaN(rightNum)) {
    return leftNum - rightNum;
  }

  return String(left).localeCompare(String(right));
}

function tryParseDate_(value) {
  if (!value) return null;
  var parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function sortRows_(rows, orderBy) {
  if (!orderBy || !orderBy.field) return rows;

  var sorted = rows.slice();
  sorted.sort(function (a, b) {
    var result = compareValues_(
      getComparableFieldValue_(a, orderBy.field),
      getComparableFieldValue_(b, orderBy.field)
    );
    return orderBy.ascending === false ? -result : result;
  });
  return sorted;
}

function sliceRows_(rows, rangeFrom, rangeTo, limit) {
  var start = rangeFrom !== undefined && rangeFrom !== null ? toNumber_(rangeFrom) : 0;
  var end =
    rangeTo !== undefined && rangeTo !== null
      ? toNumber_(rangeTo) + 1
      : limit
      ? start + toNumber_(limit)
      : rows.length;

  return rows.slice(start, end);
}

function enrichRows_(table, rows) {
  if (table !== "work_orders") return rows;

  var customers = indexBy_(readRows_("customers"), "id");
  var profiles = indexBy_(readRows_("profiles"), "id");
  var vehicles = indexBy_(readRows_("vehicles"), "id");

  return rows.map(function (row) {
    var enriched = clone_(row);
    enriched.customers = customers[row.customer_id] || null;
    enriched.profiles = profiles[row.technician_id] || null;
    enriched.vehicles = vehicles[row.vehicle_id] || null;
    return enriched;
  });
}

function indexBy_(rows, keyField) {
  var index = {};
  rows.forEach(function (row) {
    index[row[keyField]] = row;
  });
  return index;
}

function clone_(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function logAudit_(userId, action, details, ip) {
  var sheet = getSheet_("audit_log");
  var rows = readRows_("audit_log");
  var nextId = getNextId_(rows);
  sheet.appendRow([nextId, userId, action, details, ip || "", new Date().toISOString()]);
}

function toNumber_(value) {
  var num = Number(value);
  return isNaN(num) ? 0 : num;
}

function toBoolean_(value) {
  if (value === true || value === false) return value;
  if (String(value).toLowerCase() === "true") return true;
  if (String(value).toLowerCase() === "false") return false;
  return Boolean(value);
}
