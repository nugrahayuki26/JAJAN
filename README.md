Kasir:
Kartu produk dengan label HABIS, tombol +, dan jumlah item di pesanan.
Tab Aktif, Hold, dan Pesanan Terbuka.
Pelanggan/meja, diskon, catatan, ongkir, dan pisah bill.
Layar Detail Pembayaran dengan split bayar, tombol uang cepat, dan kembalian.
Bayar nanti (piutang) dengan DP.

Rekap Penjualan:
Kartu ringkasan: Omzet, Net Profit, HPP, Margin, Uang Laci, Piutang.
Filter periode, metode bayar, kasir, dan status (Lunas/Piutang/Batal).
Tampilan tabel atau kartu, baris yang bisa dibuka untuk melihat isi pesanan.
Tombol pelunasan, refund, dan cetak ulang.

Manajemen Stok:
Status Aman, Menipis, Minus, dan Habis.
Restok/koreksi stok, scan barcode untuk restok, riwayat pergerakan stok, dan kelola kategori.
Fitur dari aplikasi lama Anda: login PIN dengan peran Owner/Admin/Kasir, scan barcode pakai kamera, struk via dialog cetak atau printer Bluetooth, dan backup/restore .json.

Untuk tablet Android:
1. Cara cepat: buka JAJAN-POS.html di Chrome tablet. Kekurangannya, cara ini tidak bisa dipasang sebagai aplikasi, dan kamera scan serta printer Bluetooth langsung biasanya tidak jalan.
2. Cara yang saya sarankan: unggah isi JAJAN-POS.zip ke hosting gratis yang memakai https, misalnya GitHub Pages atau Netlify Drop. Buka alamatnya sekali di tablet, lalu ketuk “Instal aplikasi”. Setelah itu JAJAN terbuka penuh layar dan tetap jalan tanpa internet. Data penjualan tetap hanya di tablet, tidak dikirim ke hosting.

PIN awalnya Pemilik 1234, Admin 1111, dan Kasir001 0000. Segera ganti di Setelan. Langkah pertama: masuk sebagai Pemilik, buka Stok → Import, lalu pilih file Stok_Produk_Jadi. Panduan lengkapnya ada di PANDUAN.txt.

Untuk struk, cara paling andal adalah printer di-pair lewat Bluetooth tablet, lalu pakai aplikasi RawBT dengan mode “Dialog cetak”. Mode Bluetooth langsung hanya untuk printer jenis BLE.


JAJAN — Sinkron ke Google Sheets & Laporan Owner
================================================

A. SIAPKAN GOOGLE SHEET (sekali saja, pakai akun Google milik owner, di laptop)
 1. Buka sheets.google.com → buat Spreadsheet kosong → beri nama "JAJAN – Laporan Penjualan".
 2. Menu Extensions (Ekstensi) → Apps Script.
 3. Di editor Apps Script:
    a. Hapus isi file Code.gs, lalu tempel seluruh isi file Code.gs dari paket ini.
    b. Pada baris  const KODE_RAHASIA = 'GANTI-DENGAN-KODE-RAHASIA-ANDA';
       ganti dengan kode Anda sendiri, min. 12 karakter, mis. 'JJN-K4NT1N-2026-XQ7'.
       (Bisa juga pakai tombol "Buat" di JAJAN > Setelan, lalu salin kodenya ke sini.)
    c. Klik tanda + di samping "Files" → HTML → beri nama  Dashboard  (tanpa .html)
       → hapus isinya → tempel seluruh isi file Dashboard.html dari paket ini.
    d. Klik ikon Simpan (💾).
 4. Di atas editor, pilih fungsi  setup  → klik Run.
    Google akan meminta izin: Review permissions → pilih akun → Advanced →
    "Go to … (unsafe)" → Allow. (Ini aman: skrip milik Anda sendiri.)
    Setelah selesai, spreadsheet berisi sheet: Transaksi, Item Terjual, Stok, Info Sinkron.
 5. Klik Deploy → New deployment → ikon gerigi → Web app.
      Description     : JAJAN
      Execute as      : Me
      Who has access  : Anyone
    → Deploy → salin "Web app URL" (berakhiran /exec).

B. HUBUNGKAN TABLET KASIR
 1. Buka JAJAN di tablet, login sebagai Pemilik (Owner).
 2. Setelan → kartu "Sinkron ke Google Sheets":
      URL Web App   : tempel URL /exec tadi
      Kode rahasia  : sama persis dengan KODE_RAHASIA di Code.gs
      Nama perangkat: mis. Tablet Kasir 1
 3. Klik "Tes Koneksi" → harus muncul "Terhubung ke …".
 4. Nyalakan sakelar "Aktif" → klik "Simpan".
 5. Klik "Kirim Ulang Semua" sekali agar semua transaksi lama ikut terkirim.
 Pil di kanan atas JAJAN akan menunjukkan status: "Tersinkron 08.21",
 "3 belum tersinkron" (sedang offline/menunggu), atau "Menyinkron…".

C. OWNER MELIHAT LAPORAN DARI MANA SAJA
 - Link dashboard = URL Web App + ?key=KODE_RAHASIA
   (ada di kolom "Link dashboard owner" di Setelan JAJAN → Salin / Kirim WA).
 - Buka di HP owner → di Chrome pilih ⋮ → "Tambahkan ke layar utama" agar seperti aplikasi.
 - Dashboard: Omzet, Laba, Uang Laci, Piutang, Produk Terjual (per hari/rentang),
   Per Hari, Per Metode, Per Kasir, Transaksi terbaru, dan Stok yang perlu restok.
   Memuat ulang otomatis tiap 2 menit.
 - Data mentah juga bisa dibuka langsung di Google Sheets (bisa difilter / dibuat grafik).

D. CARA KERJA & CATATAN
 - Tablet tetap 100% offline-first. Transaksi dikirim otomatis beberapa detik setelah
   terjadi, setiap 2 menit, dan saat internet tersambung kembali. Tidak ada yang hilang
   meskipun tablet offline berhari-hari.
 - Pelunasan piutang, refund/batal, ubah catatan & status pesanan ikut diperbarui.
 - Hapus transaksi dari menu Rekap → ikut terhapus di Sheet.
   "Hapus Riwayat" di Zona Berbahaya → TIDAK menghapus Sheet (Sheet jadi arsip).
 - Sheet "Stok" ditimpa dengan kondisi stok terbaru setiap kali stok berubah.
 - Jangan bagikan link dashboard / kode rahasia ke orang lain. Jika bocor: ganti
   KODE_RAHASIA di Code.gs → Deploy → Manage deployments → Edit → Version: New version
   → Deploy, lalu perbarui kode di JAJAN.
 - Jika Code.gs diubah, selalu Deploy → Manage deployments → Edit → New version
   (URL tetap sama). Jangan buat "New deployment" baru karena URL-nya akan berubah.
 - Beberapa tablet/cabang bisa dikirim ke Sheet yang sama; beri nama perangkat berbeda.
