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
