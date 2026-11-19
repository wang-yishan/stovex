# Panduan Penggunaan Aplikasi Toko

> **Status dokumen:** draft placeholder
> **Untuk siapa:** pembeli (halaman toko) dan admin/merchant (dashboard)
> **Bahasa:** Bahasa Indonesia
>
> Nama toko, warna, logo, nomor WhatsApp, dan teks footer mengikuti pengaturan di halaman
> **Brand & Store Settings** — kalau nama tokomu diganti, tampilan di bawah ikut berubah.

Dokumen ini merangkum **fitur** dan **halaman** yang sudah dibuat, lengkap dengan **alur
penggunaannya** dengan bahasa sehari-hari.

Tanda yang dipakai:

- ✅ **Tersedia** — sudah bisa dipakai sekarang.
- ⏳ **Placeholder** — masih berupa rencana/tampilan, belum bisa dipakai.
- 📝 **TODO** — bagian yang perlu dilengkapi saat dokumentasi ini difinalisasi.

---

## Daftar isi

1. [Peta singkat aplikasi](#1-peta-singkat-aplikasi)
2. [Bagian A — Panduan untuk Pembeli](#bagian-a--panduan-untuk-pembeli)
   - [A1. Daftar halaman pembeli](#a1-daftar-halaman-pembeli)
   - [A2. Fitur yang bisa dipakai pembeli](#a2-fitur-yang-bisa-dipakai-pembeli)
   - [A3. Alur belanja](#a3-alur-belanja)
   - [A4. Yang perlu diketahui pembeli](#a4-yang-perlu-diketahui-pembeli)
3. [Bagian B — Panduan untuk Admin / Merchant](#bagian-b--panduan-untuk-admin--merchant)
   - [B1. Masuk ke dashboard](#b1-masuk-ke-dashboard)
   - [B2. Daftar halaman dashboard](#b2-daftar-halaman-dashboard)
   - [B3. Fitur dashboard per grup](#b3-fitur-dashboard-per-grup)
   - [B4. Alur kerja utama admin](#b4-alur-kerja-utama-admin)
   - [B5. Notifikasi](#b5-notifikasi)
4. [Fitur & halaman yang masih placeholder](#4-fitur--halaman-yang-masih-placeholder)
5. [Istilah umum](#5-istilah-umum)
6. [TODO — rencana pelengkap dokumen](#6-todo--rencana-pelengkap-dokumen)

---

## 1. Peta singkat aplikasi

Aplikasi ini punya dua sisi:

| Sisi | Siapa yang pakai | Alamat |
| --- | --- | --- |
| **Storefront** (toko) | Pembeli / pengunjung | `/`, `/catalog`, `/catalog/[slug]` |
| **Dashboard** (admin) | Pemilik toko & staf admin | `/dashboard/*` |

- **Storefront** adalah etalase toko. Pembeli bisa melihat produk, mencari, memfilter, lalu
  memesan lewat WhatsApp.
- **Dashboard** adalah ruang kerja admin untuk mengelola produk, stok, pesanan, pengiriman,
  dan tampilan toko.

Halaman `/login`, `/signup`, dan `/verify-email` **bukan** untuk pembeli — ketiganya hanya
untuk admin/staf yang ingin masuk ke dashboard.

---

# Bagian A — Panduan untuk Pembeli

## A1. Daftar halaman pembeli

| Alamat | Nama halaman | Fungsi | Status |
| --- | --- | --- | --- |
| `/` | Beranda | Perkenalan toko, pilihan kategori, produk unggulan, tautan ke katalog dan WhatsApp | ✅ |
| `/catalog` | Katalog | Lihat semua produk; cari, filter, dan urutkan | ✅ |
| `/catalog/[slug]` | Detail produk | Lihat foto, pilih warna/ukuran/jumlah, lalu pesan | ✅ |
| — | Halaman khusus pembeli / riwayat pesanan | Belum ada | ⏳ |

`[slug]` artinya alamat produk mengikuti nama produknya, misalnya `/catalog/tote-hitam`.

## A2. Fitur yang bisa dipakai pembeli

**Di Beranda**

- Tombol **Jelajahi koleksi** dan **Kenali toko** untuk langsung menuju bagian tertentu.
- Pilihan **kategori** (misalnya Semua, Tote, Shoulder) untuk menyaring produk di halaman.
- Kartu produk: klik untuk melihat detail, atau tombol **+** untuk memasukkan ke keranjang.
- Tombol **WhatsApp** untuk menghubungi toko langsung.
- **Keranjang kecil** di kanan atas: lihat isi, hapus item, dan lanjut pesan via WhatsApp.

**Di Katalog**

- **Cari** produk (nama, warna, kategori).
- **Filter**: kategori, koleksi, warna, ukuran, rentang harga, stok tersedia, sedang diskon,
  pilihan kami.
- **Urutkan**: Pilihan kami, Terbaru, Harga terendah, Harga tertinggi, Nama A–Z.
- Filter tersimpan di alamat halaman, jadi tautan hasil filter bisa dibagikan.
- Tombol **Hapus semua** untuk mengembalikan tampilan awal.

**Di Detail Produk**

- **Galeri foto** dengan panah, thumbnail, dan zoom (bisa diklik atau digeser).
- Pilih **warna**, lalu **ukuran** (pilihan ukuran menyesuaikan warna).
- Atur **jumlah** dengan tombol − dan + (maksimal 20 atau sesuai stok).
- **Beli via WhatsApp** — langsung memesan satu produk.
- **Tambah ke keranjang** — menyimpan produk untuk digabung dengan produk lain.
- **Tanya produk ini** — membuka WhatsApp dengan pertanyaan yang sudah ditulis otomatis.
- Informasi: spesifikasi, pengiriman, perawatan, retur & penukaran.
- **Ulasan pembeli** — sementara dinonaktifkan dan tidak ditampilkan di toko (fitur disimpan). ⏳
- **Produk terkait** di bagian bawah.

## A3. Alur belanja

### Alur 1 — Pesan langsung dari produk

1. Buka **Beranda** atau **Katalog**.
2. Klik produk yang diinginkan.
3. Pilih **warna** → pilih **ukuran** → tentukan **jumlah**.
4. Klik **Beli via WhatsApp**.
5. Isi **nama pembeli** dan **catatan** (opsional, misalnya warna khusus).
6. Klik **Lanjut ke WhatsApp**.
7. WhatsApp terbuka dengan pesan berisi kode pesanan dan rincian produk — kirim pesan itu.
8. Admin toko akan memeriksa dan **memverifikasi** pesananmu di dashboard.

### Alur 2 — Beli beberapa produk sekaligus

1. Di Beranda/Katalog/Detail produk, klik tombol **+** pada produk yang diinginkan.
2. Klik ikon **keranjang** di kanan atas.
3. Periksa daftar produk dan total harganya. Tombol **hapus** tersedia kalau ada yang salah.
4. Klik **Pesan via WhatsApp**.
5. Isi nama dan catatan, lalu klik **Lanjut ke WhatsApp**.
6. Pesan terkirim ke toko dan pesananmu tercatat untuk diverifikasi admin.

### Alur 3 — Bertanya dulu sebelum membeli

1. Buka detail produk.
2. Klik **Tanya produk ini** (atau tombol WhatsApp di halaman mana pun).
3. Ketik pertanyaanmu di WhatsApp dan kirim.

## A4. Yang perlu diketahui pembeli

- **Pemesanan dilakukan lewat WhatsApp.** Tidak ada pembayaran online di dalam aplikasi.
  Pembayaran dan pengiriman disepakati langsung dengan toko lewat chat. 📝 *TODO: tambahkan
  penjelasan metode pembayaran/ongkir jika tersedia.*
- **Keranjang bersifat sementara.** Isi keranjang akan hilang kalau halaman di-refresh atau
  browser ditutup. Sebelum memesan, pastikan keranjang masih berisi.
- **Belum ada akun pembeli.** Tidak perlu daftar/login untuk belanja, dan belum ada halaman
  "Pesanan Saya". Cek status pesanan lewat chat WhatsApp. ⏳
- **Tombol hati (wishlist)** di detail produk saat ini hanya sekedar tanda visual, belum
  menyimpan produk ke daftar favorit. ⏳
- **Ulasan pembeli** sementara dinonaktifkan di halaman produk; fiturnya tidak dihapus. ⏳
- Kalau data toko gagal dimuat, akan muncul pesan **"Sebagian data gagal dimuat…"** dengan
  tombol **Coba lagi**.

---

# Bagian B — Panduan untuk Admin / Merchant

## B1. Masuk ke dashboard

| Alamat | Fungsi |
| --- | --- |
| `/login` | Masuk dengan email/username + kata sandi, atau lanjut dengan Google |
| `/signup` | Daftar akun admin baru (harus disetujui pemilik toko dulu) |
| `/verify-email` | Verifikasi email dengan kode 6 digit |
| `/logout` | Keluar dari akun |

**Alur akun admin baru:**

1. Isi formulir di `/signup` (nama, username, email, kata sandi minimal 8 karakter).
2. Setelah daftar, akun berstatus **menunggu aktivasi** dan belum bisa masuk dashboard.
3. Pemilik toko membuka **Users & Permissions** dan menekan **Aktifkan Akun**.
4. Akun tersebut baru bisa login di `/login`.
5. Jika email perlu diverifikasi, buka `/verify-email`, masukkan email + kode OTP, lalu
   tekan **Verify**.

**Peran (role):**

- **Owner / pemilik toko** — akses penuh, termasuk menu Brand & Store Settings, Integrations,
  dan Users & Permissions. Tidak bisa dinonaktifkan.
- **Admin / staf** — mengelola produk, pesanan, dan stok. Tiga menu khusus owner tidak
  ditampilkan di sidebar.

## B2. Daftar halaman dashboard

Daftar di bawah mengikuti grup menu di sidebar dashboard.

### GENERAL

| Alamat | Nama | Fungsi | Status |
| --- | --- | --- | --- |
| `/dashboard` | Overview | Ringkasan toko: jumlah produk aktif, stok menipis, pesanan, aktivitas terbaru | ✅ (sebagian data contoh) 📝 |

### ACCOUNT

| Alamat | Nama | Fungsi | Status |
| --- | --- | --- | --- |
| `/dashboard/profile` | Profile | Ubah nama, julukan, telepon, alamat, dan foto profil sendiri | ✅ |

Email login tidak bisa diubah dari halaman ini (hubungi pendukung aplikasi).

### CATALOG

| Alamat | Nama | Fungsi | Status |
| --- | --- | --- | --- |
| `/dashboard/products` | Products | Daftar produk: cari, filter, urutkan, tambah, edit, duplikat, arsip, hapus, aksi massal | ✅ |
| `/dashboard/products/new` | New Product | Buat produk baru lewat formulir, atau impor dari XLSX/JSON | ✅ |
| `/dashboard/products/[id]` | Detail produk | Lihat foto, deskripsi, varian, harga, stok, dan 5 pergerakan stok terakhir | ✅ |
| `/dashboard/products/[id]/edit` | Edit Product | Ubah seluruh data produk | ✅ |
| `/dashboard/categories` | Categories | Tambah, ubah, hapus kategori produk | ✅ |
| `/dashboard/collections` | Collections | Kelola koleksi, pilih produk anggota, atur urutan | ✅ |
| `/dashboard/bundles` | Product Bundles | Rencana penggabungan beberapa produk jadi satu bundling | ⏳ |
| `/dashboard/inventory` | Inventory | Lihat stok per produk/varian, sesuaikan stok, lihat riwayat pergerakan | ✅ |

### SALES

| Alamat | Nama | Fungsi | Status |
| --- | --- | --- | --- |
| `/dashboard/orders` | Orders | Daftar pesanan WhatsApp: cari, filter, lihat detail, verifikasi atau batalkan | ✅ |
| `/dashboard/shipping` | Shipping | Buat pengiriman dan pantau statusnya | ✅ |
| `/dashboard/shipping/[id]` | Detail pengiriman | Lihat timeline tracking dan tambah catatan perjalanan paket | ✅ |
| `/dashboard/customers` | Customers | Daftar pelanggan | ⏳ |

### CONTENT

| Alamat | Nama | Fungsi | Status |
| --- | --- | --- | --- |
| `/dashboard/pages` | Pages & Landing Pages | Kelola halaman/landing page dan tentukan homepage | ✅ (belum tersimpan permanen) 📝 |
| `/dashboard/pages/new` | New Page | Buat halaman dari section + SEO | ✅ (belum tersimpan permanen) 📝 |
| `/dashboard/pages/[id]` | Page detail | Pratinjau halaman dan riwayat versi | ✅ (belum tersimpan permanen) 📝 |
| `/dashboard/pages/[id]/edit` | Edit Page | Ubah section, pengaturan, dan SEO | ✅ (belum tersimpan permanen) 📝 |
| `/dashboard/media` | Media Library | Lihat kumpulan gambar yang sudah diunggah | ✅ (pratinjau saja) |
| `/dashboard/promotions` | Promotions | Kelola promosi | ⏳ |
| `/dashboard/navigation` | Navigation | Kelola menu navigasi | ⏳ |

### SYSTEM

| Alamat | Nama | Fungsi | Status |
| --- | --- | --- | --- |
| `/dashboard/brand` | Brand & Store Settings | Identitas toko, logo, warna, font, WhatsApp, SEO, footer, menu toko, kuota admin (khusus owner) | ✅ |
| `/dashboard/integrations` | Integrations | Daftar rencana integrasi pihak ketiga (khusus owner di sidebar) | ⏳ |
| `/dashboard/users-perms` | Users & Permissions | Aktifkan/nonaktifkan akun admin dan lihat kuota (khusus owner) | ✅ |
| `/dashboard/storefront` | Storefront Preview | Pratinjau halaman + produk aktif apa adanya (baca saja) | ✅ |
| `/dashboard/store-settings` | Store Settings | Dialihkan otomatis ke `/dashboard/brand` | ✅ |

## B3. Fitur dashboard per grup

**Produk & katalog (CATALOG)**

- **Products**: cari berdasarkan nama/SKU, saring berdasarkan status/kategori/stok, urutkan,
  pilih banyak produk sekaligus untuk **Activate**, **Archive**, atau **Delete**.
- Aksi per produk: **Edit**, **Archive/Reactivate**, **Duplicate**, **WhatsApp enquiry**
  (membuka tautan WhatsApp), **Delete** (dengan konfirmasi).
- **New Product / Edit Product**: isi nama, slug, SKU, deskripsi, bahan; unggah beberapa foto
  (JPG/PNG/WebP, maks. 5 MB) dan tentukan foto utama; unggah Banner Produk; atur harga dan
  harga coret; atur stok dan batas stok menipis; buat **varian** (warna/ukuran, maks. 50
  kombinasi) beserta SKU/harga/stok masing-masing; pilih kategori & koleksi (bisa dibuat
  langsung dari form); isi SEO; lalu pilih **Publish Product**, **Save as Draft**, atau **Archive**.
- **Impor produk**: tab **XLSX** atau **JSON** di halaman New Product → unduh/copy template →
  isi → unggah/tempel → periksa tiap slide → **Mark as done** → **Save all as drafts**.
  Hasil impor selalu berupa **draft**; foto ditambahkan kemudian lewat Edit.
- **Categories**: buat/ubah/hapus kategori. Kalau kategori masih dipakai produk, hapusannya
  harus disertai pilihan **Reassign products to** (pindahkan produknya ke kategori lain).
- **Collections**: buat koleksi, pilih produk anggota lewat kotak centang, naik/turunkan
  urutan lewat tombol panah, ubah, atau hapus.
- **Inventory**: cari produk, lihat stok & batas stok menipis, klik **Adjust** untuk mengubah
  stok. Isi jumlah perubahan (misal `5` atau `-2`), pilih **alasan** (Restock / Correction /
  Damaged), tambahkan catatan, lalu konfirmasi. Semua perubahan tercatat di **Movement history**.

**Penjualan (SALES)**

- **Orders**: pesanan masuk otomatis dari pemesanan WhatsApp di toko. Ada 4 angka ringkasan
  (menunggu, terverifikasi, dibatalkan, total). Cari berdasarkan kode/nama/produk/SKU/catatan,
  saring berdasarkan status, sumber (Keranjang / Produk langsung), dan rentang tanggal.
  Klik **Detail** untuk melihat pembeli, item, total, dan pesan WhatsApp (bisa disalin).
  Klik **Verifikasi** atau **Batalkan**, tambahkan catatan bila perlu, lalu konfirmasi.
- **Shipping**: klik **New shipment**, isi nomor pesanan, resi, nama penerima, telepon, kota,
  alamat, kurir/layanan, barang, jumlah, berat, ongkir, dan total pesanan. Setelah dibuat,
  status awalnya `pending` dan timeline otomatis mendapat catatan "Warehouse".
  Gunakan **Update** untuk mengubah status, **Details** untuk membuka timeline, atau **Delete**
  untuk menghapus.
- **Detail pengiriman**: klik **Add tracking update**, pilih status, isi lokasi dan keterangan,
  lalu **Add tracking event**. Status pengiriman ikut berubah dan timeline bertambah.

**Konten (CONTENT)**

- **Pages & Landing Pages**: buat halaman baru, tambahkan **section** (hero, produk unggulan,
  grid koleksi, kategori, promo, teks, CTA, benefit, galeri, testimoni), atur SEO, simpan draft
  atau publish, lalu tentukan salah satu sebagai **homepage** lewat **Set homepage**.
  Halaman bisa diduplikat, diarsipkan, dihapus, dan versi lama bisa dipulihkan lewat **Restore**.
- **Storefront Preview**: pilih halaman yang ingin dilihat, lalu periksa tampilan section dan
  grid produk aktif. Halaman ini hanya untuk melihat, bukan mengubah.
- **Media Library**: gambar muncul di sini setelah diunggah lewat formulir produk atau pengaturan
  brand. Untuk menambah gambar, gunakan halaman **New Product**.

**Sistem (SYSTEM)**

- **Brand & Store Settings** (owner): ubah nama toko, tagline, logo/favicon, warna per peran
  (dengan penilaian kontras WCAG), font, nomor WhatsApp beserta template pesan, tautan sosial,
  SEO default, teks footer, tautan menu toko, dan **Max admins** (kuota pendaftaran admin).
  Ada **Live preview** di sebelah kanan. Simpan dengan **Save changes**.
- **Users & Permissions** (owner): lihat jumlah admin aktif, admin menunggu aktivasi, dan kuota.
  Klik **Aktifkan Akun** untuk admin baru atau **Nonaktifkan** untuk admin lama. Baris **Owner**
  tidak bisa dinonaktifkan.
- **Profile**: setiap pengguna bisa mengubah data dirinya sendiri dan foto profil, lalu **Save changes**.
- **Integrations** (owner): melihat daftar rencana integrasi (CJdropshipping, AutoDS, Printful,
  ShipStation, Shopee, Meta Ads). Tombol **Connect** saat ini hanya menampilkan pesan bahwa
  koneksi belum tersedia. ⏳

## B4. Alur kerja utama admin

**Alur 1 — Menyiapkan toko (owner)**

1. Buka **Brand & Store Settings**.
2. Isi nama toko, tagline, logo, warna, font, nomor WhatsApp, dan SEO.
3. Periksa **Live preview** dan badge kontras warna.
4. Klik **Save changes**.
5. Buka **Users & Permissions**, atur kuota admin lewat tautan **Store Settings** bila perlu.
6. Aktifkan akun admin yang menunggu persetujuan.

**Alur 2 — Menambah produk baru**

1. Buka **Products** → klik **Add Product**.
2. Isi nama, deskripsi, harga, dan data lain di tab **Inputs**.
3. Unggah minimal satu foto dan tentukan foto utama.
4. Atur varian + stok, lalu pilih kategori dan koleksi.
5. Klik **Publish Product** agar langsung tampil di toko, atau **Save as Draft** untuk disimpan
   dulu. (Produk aktif = tampil di storefront.)

**Alur 3 — Menyesuaikan stok**

1. Buka **Inventory**.
2. Cari produk/varian yang ingin diubah.
3. Klik **Adjust**.
4. Masukkan jumlah perubahan (boleh negatif), pilih alasan, tambahkan catatan.
5. Klik konfirmasi — stok berubah dan riwayat pergerakan bertambah.

**Alur 4 — Memproses pesanan masuk**

1. Lihat lonceng **Notifikasi** di kanan atas, atau buka **Orders**.
2. Cari pesanan yang belum diverifikasi.
3. Klik **Detail** untuk memeriksa pembeli, item, total, dan pesan WhatsApp.
4. Klik **Verifikasi** (atau **Batalkan** kalau ada masalah), tambahkan catatan bila perlu.
5. Konfirmasi — status pesanan tersimpan.

**Alur 5 — Mengirim pesanan**

1. Dari **Orders** atau **Shipping**, klik **New shipment**.
2. Isi data resi, penerima, alamat, kurir, berat, ongkir, dan total.
3. Klik **Create** — pengiriman dibuat dengan status `pending`.
4. Saat paket bergerak, buka **Update** atau halaman **Detail pengiriman**.
5. Tambahkan **tracking event** baru (status, lokasi, keterangan).
6. Ulangi sampai paket berstatus delivered/returned.

**Alur 6 — Mengubah tampilan toko**

1. Buka **Pages & Landing Pages** → buat halaman baru atau ubah yang ada.
2. Tambahkan section, isi konten, atur SEO.
3. Simpan/publish, lalu klik **Set homepage** kalau halaman itu yang ingin ditampilkan.
4. Buka **Storefront Preview** untuk memastikan tampilannya sudah benar.
   📝 *TODO: jelaskan bahwa perubahan halaman saat ini belum tersimpan permanen.*

**Alur 7 — Menambah admin baru**

1. Staf mendaftar lewat `/signup` → statusnya **menunggu aktivasi**.
2. Owner membuka **Users & Permissions**.
3. Klik **Aktifkan Akun** pada baris staf tersebut.
4. Staf bisa login di `/login`.

## B5. Notifikasi

- Ikon **lonceng** di kanan atas menampilkan jumlah notifikasi yang belum dibaca.
- Klik notifikasi untuk membukanya (statusnya otomatis jadi terbaca).
- **Mark all read** menandai semuanya sudah dibaca; tombol **X** menghapus satu notifikasi.
- Notifikasi dibuat otomatis antara lain saat ada pesanan masuk atau perubahan pesanan/pengiriman.

---

# 4. Fitur & halaman yang masih placeholder

| Fitur / halaman | Penjelasan singkat |
| --- | --- |
| Product Bundles | Tampilan "bundle builder" sudah ada, tetapi tombolnya masih **Not available yet**. |
| Customers | Belum ada daftar pelanggan. |
| Promotions | Belum ada kelola promosi. |
| Navigation | Belum ada kelola menu navigasi. |
| Integrations | Daftar penyedia sudah tampil, tapi tombol **Connect** belum berfungsi. |
| Wishlist pembeli | Tombol hati hanya kosmetik, belum menyimpan favorit. |
| Akun & riwayat pesanan pembeli | Belum ada. |
| Ulasan pembeli | Sementara dinonaktifkan (disembunyikan), fitur tidak dihapus. |
| Pembayaran online | Belum ada — pemesanan lewat WhatsApp. |
| Halaman (Pages) | Bisa diedit, tapi perubahan **belum tersimpan permanen** (hilang setelah reload). 📝 |
| Overview | Sebagian angka (pesanan/aktivitas) masih data contoh; tombol **Today** belum berfungsi. |
| Media Library | Hanya melihat gambar; hapus/ubah belum tersedia di halaman ini. |

---

# 5. Istilah umum

| Istilah | Arti sederhana |
| --- | --- |
| **Storefront** | Tampilan toko yang dilihat pembeli. |
| **Dashboard** | Ruang kerja admin untuk mengelola toko. |
| **Owner** | Pemilik toko, akses penuh. |
| **Admin** | Staf yang membantu mengelola toko; harus diaktifkan owner. |
| **SKU** | Kode unik untuk produk/varian, dipakai untuk pencarian dan stok. |
| **Varian** | Pilihan produk, misalnya warna dan ukuran. |
| **Draft** | Produk/halaman tersimpan tapi belum tampil di toko. |
| **Publish** | Menerbitkan produk/halaman agar tampil di toko. |
| **Archive** | Menyembunyikan produk tanpa menghapusnya. |
| **Homepage** | Halaman utama yang pertama kali dilihat pembeli. |
| **Stok menipis** | Stok sudah di bawah batas yang ditentukan admin. |
| **Resi** | Nomor pelacakan paket dari kurir. |
| **Tracking event** | Catatan perjalanan paket pada timeline pengiriman. |
| **WA / WhatsApp** | Sarana pemesanan dan komunikasi dengan toko. |

---

# 6. TODO — rencana pelengkap dokumen

Bagian ini untuk orang yang melanjutkan dokumentasi:

- 📝 Tambahkan **tangkapan layar** (screenshot) untuk tiap halaman utama.
- 📝 Isi **contoh nama toko, nomor WhatsApp, dan alamat website** yang sebenarnya.
- 📝 Lengkapi penjelasan **cara pembayaran dan pengiriman** setelah kebijakan toko ditentukan.
- 📝 Tulis ulang bagian **Pages** setelah perubahan halaman bisa tersimpan permanen.
- 📝 Hapus penanda ⏳ untuk fitur yang sudah rilis, dan perbarui tabel status.
- 📝 Tambahkan ** FAQ** dari pertanyaan yang sering masuk lewat WhatsApp.
- 📝 Buat versi **Bahasa Inggris** bila dokumen ini juga dipakai pengguna internasional
  (proyek sudah menyiapkan `en` + `id` lewat Paraglide).
- 📝 Sesuaikan isi dengan perubahan fitur di masa depan — status di tabel di atas mengikuti
  kondisi saat dokumen ini dibuat.

---

*Dokumen placeholder — diperbarui mengikuti fitur yang sudah ada di codebase.*
