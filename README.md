# Stovex

![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)
![SvelteKit](https://img.shields.io/badge/SvelteKit-3-FF3E00?logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-package_manager-FBF0DF?logo=bun&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-libSQL-003B57?logo=sqlite&logoColor=white)

**Toko online ringan dengan dashboard admin lengkap — katalog, stok, pesanan WhatsApp, dan
pengiriman dalam satu aplikasi SvelteKit.**

Stovex terdiri dari dua sisi: **storefront** untuk pembeli (beranda, katalog, detail produk,
pemesanan lewat WhatsApp) dan **dashboard** untuk pemilik toko/staf (kelola produk, stok,
pesanan, pengiriman, konten, dan pengaturan toko). data tersimpan di SQLite saat pengembangan
dan bisa dipindah ke Turso/libSQL saat produksi.

> 📘 Panduan penggunaan untuk pembeli dan admin ada di [USAGE.md](./USAGE.md).

---

## ✨ Fitur

**Storefront (pembeli)**

- Beranda toko dengan pilihan kategori dan produk unggulan
- Katalog lengkap dengan pencarian, filter (kategori, koleksi, warna, ukuran, harga, stok,
  diskon) dan pengurutan
- Detail produk: galeri foto + zoom, pilihan warna/ukuran, jumlah, spesifikasi, dan informasi
  pengiriman
- Keranjang sementara dan pemesanan langsung lewat WhatsApp (tanpa payment gateway)
- Tampilan responsif, dark mode, dan dua bahasa (Indonesia / Inggris)

**Dashboard (admin)**

- Kelola produk beserta varian, foto, harga, SEO, dan status (publish / draft / arsip)
- Impor produk massal dari XLSX atau JSON
- Kategori, koleksi, dan pengaturan urutan koleksi
- Manajemen stok per varian dengan riwayat pergerakan dan alasan penyesuaian
- Pesanan WhatsApp: pencarian, filter, detail, verifikasi, dan pembatalan
- Pengiriman: buat paket, ubah status, dan tambahkan catatan pelacakan (tracking timeline)
- Halaman & landing page dengan section, SEO, homepage, dan pratinjau storefront
- Brand & store settings: identitas, logo, palet warna + pengecekan kontras WCAG, font,
  WhatsApp, footer, dan menu toko
- Akun admin dengan peran owner/admin, aktivasi akun, dan kuota pendaftaran
- Notifikasi untuk aktivitas toko

**Masih dalam pengembangan (⏳):** Product Bundles, Customers, Promotions, Navigation,
Integrations, wishlist permanen, akun & riwayat pesanan pembeli, dan pembayaran online.

---

## 📸 Screenshot

> 📝 TODO: tambahkan screenshot storefront dan dashboard di sini.

```md
![Beranda storefront](docs/screenshots/storefront-home.png)
![Dashboard overview](docs/screenshots/dashboard-overview.png)
![Halaman produk](docs/screenshots/dashboard-products.png)
```

---

## 🛠 Tech stack

| Grup | Teknologi |
| --- | --- |
| Framework | SvelteKit 3, Svelte 5 (runes), TypeScript, Vite 8 |
| Styling | Tailwind CSS v4, shadcn-svelte, bits-ui, Lucide, tw-animate-css |
| Data | Drizzle ORM, libSQL / SQLite (`local.db`), Turso untuk produksi |
| Auth | Better Auth (email/password + Google OAuth opsional) |
| Internasionalisasi | Paraglide (`en` sebagai base, `id`) |
| Lainnya | mdsvex, enhanced-img, mode-watcher, xlsx, dnd-kit-svelte |
| Tooling | Bun, Prettier, svelte-check, drizzle-kit |

---

## 🚀 Getting started

### Prasyarat

- [Bun](https://bun.sh) (package manager satu-satunya di proyek ini — **jangan** pakai npm/pnpm/npx)
- Git

### Langkah instalasi

```sh
git clone https://github.com/your-username/stovex.git
cd stovex
cp .env.example .env
bun install
```

Isi variabel wajib di `.env` minimal:

```env
PROJECT_STATUS=DEV
DATABASE_URL="file:local.db"
ORIGIN="http://localhost:5173"
BETTER_AUTH_SECRET="rahasia-panjang-minimal-32-karakter"
```

Lalu jalankan migrasi schema dan server pengembangan:

```sh
bun run db:push
bun run dev
```

Buka `http://localhost:5173` untuk storefront, `/catalog` untuk katalog, `/login` untuk masuk
ke dashboard, dan `/dashboard` setelah login.

> Catatan: `drizzle-kit` (`db:push` / `db:migrate`) membaca kredensial database dari
> `TURSO_DATABASE_URL` (dan `TURSO_AUTH_TOKEN`). Untuk lokal, isi dengan `file:local.db`;
> untuk produksi gunakan URL Turso.

---

## ⚙️ Environment variables

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `PROJECT_STATUS` | Tidak | `DEV` (default) = SQLite lokal; `PROD` = Turso/libSQL |
| `DATABASE_URL` | DEV | URL database lokal, mis. `file:local.db` |
| `TURSO_DATABASE_URL` | PROD | URL database Turso, `libsql://<db>.turso.io` |
| `TURSO_AUTH_TOKEN` | PROD | Token akses Turso (juga dipakai drizzle-kit) |
| `ORIGIN` | Ya | Origin aplikasi, mis. `http://localhost:5173` — dipakai Better Auth sebagai `baseURL` |
| `BETTER_AUTH_SECRET` | Ya | Rahasia untuk menandatangani token; produksi minimal 32 karakter |
| `GOOGLE_CLIENT_ID` | Tidak | Untuk tombol "Continue with Google" |
| `GOOGLE_CLIENT_SECRET` | Tidak | Pasangan dari client ID Google |

Salin `.env.example` sebagai acuan. File `.env` tidak ikut ter-commit.

---

## 📜 Scripts

| Perintah | Fungsi |
| --- | --- |
| `bun run dev` | Menjalankan dev server Vite |
| `bun run build` | Build produksi |
| `bun run preview` | Pratinjau hasil build |
| `bun run check` | Sinkronisasi SvelteKit + pengecekan tipe (svelte-check) |
| `bun run check:watch` | Sama seperti `check`, tapi terus berjalan |
| `bun run lint` | Prettier check (tanpa ESLint) |
| `bun run format` | Prettier write |
| `bun run contrast` | Audit kontras warna (tambahkan argumen fg/bg untuk cek tunggal) |
| `bun run db:push` | Push schema Drizzle ke database |
| `bun run db:generate` | Generate file migrasi |
| `bun run db:migrate` | Jalankan migrasi |
| `bun run db:studio` | Buka Drizzle Studio |
| `bun run auth:schema` | Regenerasi schema Better Auth |

Belum ada test runner maupun CI di proyek ini.

---

## 📁 Struktur proyek

```txt
.
├── messages/                 # Terjemahan Paraglide (en.json, id.json)
├── project.inlang/           # Konfigurasi i18n
├── scripts/                  # Utilitas (contrast.ts, provisioning owner)
├── src/
│   ├── lib/
│   │   ├── admin/            # State runes & komponen dashboard
│   │   ├── components/       # Komponen storefront + UI kit (shadcn-svelte)
│   │   ├── server/           # DB/Drizzle, Better Auth, repositori katalog
│   │   └── paraglide/        # Kode i18n hasil generate (gitignored)
│   └── routes/
│       ├── (auth)/           # Login, signup, verify-email
│       ├── api/              # Endpoint server (products, orders, shipping, ...)
│       ├── catalog/          # Katalog & detail produk
│       ├── dashboard/        # Halaman admin
│       └── +page.svelte      # Beranda storefront
├── uploads/                  # Gambar hasil unggahan (gitignored, runtime)
├── .env.example
├── drizzle.config.ts
├── vite.config.ts
├── USAGE.md                  # Panduan pengguna
└── README.md
```

---

## 🧩 Arsitektur singkat

- **Database:** Drizzle ORM di atas libSQL. Schema ada di `src/lib/server/db/schema.ts`;
  seluruh baca/tulis katalog lewat `src/lib/server/catalog/repository.ts`.
- **Autentikasi:** Better Auth dengan peran `owner` dan `admin`. Akun admin baru berstatus
  `pending` sampai diaktifkan owner di halaman Users & Permissions.
- **Internasionalisasi:** Paraglide menghasilkan kode ke `src/lib/paraglide/` (gitignored).
  Edit terjemahan di `messages/*.json`, jangan edit hasil generate.
- **Branding:** warna & font toko disimpan di baris `store_setting` lalu disuntikkan sebagai
  CSS variable `--brand-*` oleh root layout, supaya warna sudah benar sejak paint pertama.
- **Upload:** gambar disimpan sebagai file nyata di `uploads/` dan disajikan lewat
  `/uploads/[...path]` — bukan `URL.createObjectURL`.
- **Dua akar tampilan:** `.forma-root` untuk storefront dan `.admin-root` untuk dashboard.

---

## 📚 Dokumentasi

- [USAGE.md](./USAGE.md) — panduan lengkap untuk pembeli dan admin, lengkap dengan daftar
  fitur, halaman, dan alur penggunaan.

---

## 🗺 Roadmap

- [ ] Product Bundles
- [ ] Customers
- [ ] Promotions
- [ ] Navigation
- [ ] Integrasi pihak ketiga (CJdropshipping, AutoDS, Printful, ShipStation, Shopee, Meta Ads)
- [ ] Wishlist permanen & akun pembeli / riwayat pesanan
- [ ] Pembayaran online

---

## 🤝 Contributing

1. Fork repository dan buat branch dari `main`.
2. `bun install` lalu `bun run dev` untuk mencoba perubahan.
3. Pastikan `bun run check` dan `bun run lint` lolos sebelum commit.
4. Gunakan `bun run format` untuk menyamakan gaya kode.
5. Buat pull request dengan penjelasan perubahan yang singkat.

---

## 📄 License

> 📝 TODO: tentukan lisensi proyek dan tambahkan file `LICENSE` (mis. MIT) sebelum rilis.

---

Dibangun dengan SvelteKit dan Bun.
