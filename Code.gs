/**
 * JAJAN POS — Sinkron Google Sheets + Dashboard Owner
 * ----------------------------------------------------
 * 1. Ganti KODE_RAHASIA di bawah dengan kode Anda sendiri (min. 12 karakter).
 * 2. Jalankan fungsi setup() sekali (izinkan akses saat diminta).
 * 3. Deploy > New deployment > Web app
 *      Execute as : Me
 *      Who has access : Anyone
 * 4. Salin URL Web app ke JAJAN (Setelan > Sinkron Google Sheets).
 * 5. Owner membuka:  <URL Web app>?key=<KODE_RAHASIA>
 */
const KODE_RAHASIA = 'GANTI-DENGAN-KODE-RAHASIA-ANDA';

const SHEETS = {
  trx: {
    name: 'Transaksi',
    header: ['No. Pesanan','Tanggal','Jam','Channel','Pelanggan','Meja','No. HP','Kasir','Metode Bayar','Status Pembayaran',
             'Subtotal','Diskon','Pajak','Service Charge','Ongkir','Total','HPP','Laba Bersih','Dibayar','Sisa Piutang','Tunai Masuk',
             'Status Pesanan','Catatan','Jml Item','Produk','Gudang','Perangkat','Sumber','Diperbarui'],
    textCols: [1,2,3,7],
  },
  item: {
    name: 'Item Terjual',
    header: ['Kunci','No. Pesanan','Tanggal','Jam','Produk','SKU','Kategori','Qty','Harga Jual','Total Gross','Diskon',
             'Omzet','HPP','Laba Bersih','Status Pembayaran','Metode Bayar','Kasir','Perangkat'],
    textCols: [1,2,3,4],
  },
  stok: {
    name: 'Stok',
    header: ['Nama Produk','Kategori','Gudang','SKU','Barcode','Stok Saat Ini','Satuan','Ambang Batas','Status','HPP','Nilai Stok','Harga Jual','Diperbarui'],
    textCols: [4,5],
  },
  info: { name: 'Info Sinkron', header: ['Keterangan','Nilai'], textCols: [] },
};

/* ===================== SETUP ===================== */
function setup() {
  Object.keys(SHEETS).forEach(function (k) { sheet_(k); });
  const def = SpreadsheetApp.getActive().getSheetByName('Sheet1') || SpreadsheetApp.getActive().getSheetByName('Lembar1');
  if (def && def.getLastRow() === 0 && SpreadsheetApp.getActive().getSheets().length > 1) SpreadsheetApp.getActive().deleteSheet(def);
  if (KODE_RAHASIA.indexOf('GANTI') === 0) throw new Error('Ganti dulu KODE_RAHASIA di baris atas, lalu jalankan setup() lagi.');
  return 'Siap. Sekarang Deploy > New deployment > Web app.';
}

function sheet_(k) {
  const cfg = SHEETS[k];
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(cfg.name);
  if (!sh) sh = ss.insertSheet(cfg.name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, cfg.header.length).setValues([cfg.header]).setFontWeight('bold').setBackground('#E7F5EE');
    sh.setFrozenRows(1);
    // kolom tanggal/jam/kode disimpan sebagai teks agar tidak diubah otomatis oleh Sheets
    cfg.textCols.forEach(function (c) { sh.getRange(1, c, sh.getMaxRows(), 1).setNumberFormat('@'); });
  }
  return sh;
}

/* ===================== TERIMA DATA DARI TABLET ===================== */
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); }
  catch (err) { return json_({ ok: false, error: 'Format data tidak dikenali' }); }
  if (!body || body.token !== KODE_RAHASIA) return json_({ ok: false, error: 'Kode rahasia salah' });
  if (body.action === 'ping') return json_({ ok: true, sheet: SpreadsheetApp.getActive().getName() });

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const trxSh = sheet_('trx'), itemSh = sheet_('item');
    let deleted = 0;
    // hapus transaksi yang dihapus di tablet
    const dels = (body.deletes || []).map(String);
    if (dels.length) {
      deleted = deleteWhere_(trxSh, 1, dels);
      deleteWhere_(itemSh, 2, dels);
    }
    // tambah / perbarui transaksi
    const trx = body.trx || [];
    if (trx.length) {
      upsert_(trxSh, trx.map(function (t) { return t.row; }), SHEETS.trx.header.length);
      const items = [];
      trx.forEach(function (t) { (t.items || []).forEach(function (r) { items.push(r); }); });
      if (items.length) upsert_(itemSh, items, SHEETS.item.header.length);
    }
    // snapshot stok (ditimpa penuh)
    if (body.products && body.products.length >= 0 && body.productsChanged) {
      const st = sheet_('stok');
      const w = SHEETS.stok.header.length;
      if (st.getLastRow() > 1) st.getRange(2, 1, st.getLastRow() - 1, w).clearContent();
      if (body.products.length) st.getRange(2, 1, body.products.length, w).setValues(body.products.map(function (r) { return fit_(r, w); }));
    }
    // info
    const info = sheet_('info');
    const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    const rows = [['Nama toko', body.store || '-'], ['Sinkron terakhir', now], ['Perangkat terakhir', body.device || '-'],
                  ['Jumlah transaksi di sheet', Math.max(0, trxSh.getLastRow() - 1)]];
    info.getRange(2, 1, rows.length, 2).setValues(rows);
    return json_({ ok: true, upserted: trx.length, deleted: deleted, at: now });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function fit_(row, w) { const r = row.slice(0, w); while (r.length < w) r.push(''); return r; }

function upsert_(sh, rows, width) {
  if (!rows.length) return;
  const last = sh.getLastRow();
  const index = {};
  if (last > 1) {
    const keys = sh.getRange(2, 1, last - 1, 1).getValues();
    for (let i = 0; i < keys.length; i++) index[String(keys[i][0])] = i + 2;
  }
  const append = [];
  const seen = {};
  rows.forEach(function (r) {
    r = fit_(r, width);
    const k = String(r[0]);
    if (index[k]) sh.getRange(index[k], 1, 1, width).setValues([r]);
    else if (seen[k] !== undefined) append[seen[k]] = r;
    else { seen[k] = append.length; append.push(r); }
  });
  if (append.length) sh.getRange(last + 1, 1, append.length, width).setValues(append);
}

function deleteWhere_(sh, col, keys) {
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const set = {}; keys.forEach(function (k) { set[k] = true; });
  const vals = sh.getRange(2, col, last - 1, 1).getValues();
  let n = 0;
  for (let i = vals.length - 1; i >= 0; i--) {
    if (set[String(vals[i][0])]) { sh.deleteRow(i + 2); n++; }
  }
  return n;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ===================== DASHBOARD OWNER ===================== */
function doGet(e) {
  const key = (e && e.parameter && e.parameter.key) || '';
  const t = HtmlService.createTemplateFromFile('Dashboard');
  t.key = key;
  t.valid = key === KODE_RAHASIA;
  t.url = ScriptApp.getService().getUrl();
  return t.evaluate()
    .setTitle('JAJAN — Laporan Owner')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function txt_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(v === null || v === undefined ? '' : v);
}
function num_(v) { const n = Number(v); return isFinite(n) ? n : 0; }

function readSheet_(k) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEETS[k].name);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, SHEETS[k].header.length).getValues();
}

/** Dipanggil dari Dashboard.html. from/to: 'yyyy-MM-dd' */
function getReport(key, from, to) {
  if (key !== KODE_RAHASIA) throw new Error('Kode akses salah');
  from = from || '0000-00-00'; to = to || '9999-99-99';
  const inRange = function (d) { return d >= from && d <= to; };

  // --- transaksi ---
  const trx = readSheet_('trx').map(function (r) {
    return { no: txt_(r[0]), date: txt_(r[1]), time: txt_(r[2]), channel: txt_(r[3]), customer: txt_(r[4]), table: txt_(r[5]),
      cashier: txt_(r[7]), method: txt_(r[8]), status: txt_(r[9]), subtotal: num_(r[10]), discount: num_(r[11]), tax: num_(r[12]),
      service: num_(r[13]), shipping: num_(r[14]), total: num_(r[15]), hpp: num_(r[16]), profit: num_(r[17]), paid: num_(r[18]),
      outstanding: num_(r[19]), cash: num_(r[20]), items: num_(r[23]), products: txt_(r[24]), device: txt_(r[26]) };
  }).filter(function (t) { return t.no && inRange(t.date); });
  const valid = trx.filter(function (t) { return t.status !== 'refunded'; });
  const sum = function (arr, f) { return arr.reduce(function (s, x) { return s + f(x); }, 0); };
  const omzet = sum(valid, function (t) { return t.subtotal - t.discount; });
  const hpp = sum(valid, function (t) { return t.hpp; });

  // --- per hari, metode, kasir ---
  const days = {}, methods = {}, cashiers = {};
  valid.forEach(function (t) {
    const d = days[t.date] || (days[t.date] = { date: t.date, trx: 0, items: 0, omzet: 0, profit: 0, cash: 0 });
    d.trx++; d.items += t.items; d.omzet += t.subtotal - t.discount; d.profit += t.subtotal - t.discount - t.hpp; d.cash += t.cash;
    const m = methods[t.method] || (methods[t.method] = { name: t.method, trx: 0, total: 0 }); m.trx++; m.total += t.total;
    const c = cashiers[t.cashier] || (cashiers[t.cashier] = { name: t.cashier, trx: 0, omzet: 0 }); c.trx++; c.omzet += t.subtotal - t.discount;
  });

  // --- per produk ---
  const prods = {};
  readSheet_('item').forEach(function (r) {
    const date = txt_(r[2]); if (!inRange(date) || txt_(r[14]) === 'refunded') return;
    const name = txt_(r[4]); const k = name.toLowerCase();
    const p = prods[k] || (prods[k] = { name: name, cat: txt_(r[6]), qty: 0, omzet: 0, hpp: 0, trx: {} });
    p.qty += num_(r[7]); p.omzet += num_(r[11]); p.hpp += num_(r[12]); p.trx[txt_(r[1])] = 1;
  });
  const produk = Object.keys(prods).map(function (k) { const p = prods[k]; return { name: p.name, cat: p.cat, qty: p.qty, omzet: p.omzet, hpp: p.hpp, profit: p.omzet - p.hpp, trx: Object.keys(p.trx).length }; })
    .sort(function (a, b) { return b.qty - a.qty || b.omzet - a.omzet; });

  // --- stok ---
  const stok = readSheet_('stok').filter(function (r) { return txt_(r[0]); }).map(function (r) {
    return { name: txt_(r[0]), cat: txt_(r[1]), stock: num_(r[5]), unit: txt_(r[6]), threshold: num_(r[7]), cost: num_(r[9]), price: num_(r[11]) };
  });

  // --- info ---
  const info = {};
  readSheet_('info').forEach(function (r) { info[txt_(r[0])] = txt_(r[1]); });

  return {
    range: [from, to],
    cards: {
      omzet: omzet, hpp: hpp, profit: omzet - hpp, margin: omzet ? (omzet - hpp) / omzet * 100 : 0,
      trx: valid.length, items: sum(valid, function (t) { return t.items; }), cash: sum(valid, function (t) { return t.cash; }),
      piutang: sum(valid, function (t) { return t.outstanding; }), refunded: trx.length - valid.length,
      avg: valid.length ? omzet / valid.length : 0,
    },
    days: Object.keys(days).sort().reverse().map(function (k) { return days[k]; }),
    methods: Object.keys(methods).map(function (k) { return methods[k]; }).sort(function (a, b) { return b.total - a.total; }),
    cashiers: Object.keys(cashiers).map(function (k) { return cashiers[k]; }).sort(function (a, b) { return b.omzet - a.omzet; }),
    produk: produk,
    recent: trx.sort(function (a, b) { return (b.date + b.time).localeCompare(a.date + a.time); }).slice(0, 50),
    stok: stok,
    info: info,
  };
}
