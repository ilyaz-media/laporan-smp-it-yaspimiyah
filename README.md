# Dashboard SMP IT Yaspimiyah

Dashboard pengelolaan data sekolah dengan **React + Tailwind CSS** (tema biru modern) yang menggunakan **file Excel (.xlsx) sebagai database**.

## Fitur

- 📊 **Dashboard** — statistik siswa, kehadiran hari ini, rata-rata nilai, dan visualisasi ringkas
- 👨‍🎓 **Data Siswa** — CRUD data induk siswa (NIS, NISN, nama, JK, kelas, TTL, alamat, telepon)
- ✅ **Daftar Hadir** — absensi harian per kelas (Hadir/Sakit/Izin/Alpa), rekap & riwayat
- 📝 **Daftar Nilai** — input nilai per siswa per mapel, filter, rekap rata-rata & status tuntas (KKM 75)
- 📚 **Mata Pelajaran** — CRUD mapel beserta KKM dan guru pengampu
- 📥 **Impor Excel** — muat data dari file .xlsx eksternal (header fleksibel, sheet apa saja opsional)
- 📤 **Laporan per Tingkat** — unduh laporan Kelas 7/8/9 (A/B digabung) berisi profil, presensi, dan rekap nilai

## Excel sebagai Database

Seluruh data tersimpan dalam satu file `database-yaspimiyah.xlsx` dengan 4 sheet:

| Sheet           | Isi                                              |
| --------------- | ------------------------------------------------ |
| `Siswa`         | NIS, NISN, Nama, JenisKelamin, Kelas, TTL, Alamat, Telepon        |
| `Kehadiran`     | Tanggal, NIS, Nama, Kelas, Status, Catatan        |
| `Nilai`         | NIS, Nama, Kelas, MataPelajaran, Jenis, Nilai     |
| `MataPelajaran` | Kode, Nama, KKM, Guru                             |

### Cara penyimpanan

1. **Browser Chromium (Chrome/Edge)** — file Excel tersimpan otomatis di folder OPFS `yaspimiyah-dashboard/database-yaspimiyah.xlsx`. Setiap tambah/ubah/hapus langsung ditulis ke file.
2. **Browser lain** — data tersimpan di localStorage dan dapat diekspor/impor manual.

### Impor Excel

Tombol **Impor Excel** menerima file .xlsx/.xls dengan sheet `Siswa`, `Kehadiran`, `Nilai`, dan/atau `MataPelajaran` (sheet yang tidak ada dilewati). Header kolom fleksibel, misalnya `Nama`/`Nama Siswa`/`Nama Lengkap` atau `HP`/`No Telepon` tetap dikenali. Data yang diimpor langsung mengisi aplikasi, termasuk halaman Data Siswa.

### Laporan per Tingkat

Tombol **Unduh Laporan** memilih tingkat (7/8/9, menggabungkan A/B) dan menghasilkan file `Laporan_Kelas_7_yaspimiyah.xlsx` berisi 3 sheet: profil siswa tingkat tersebut, rekap presensi (Hadir/Sakit/Izin/Alpa per siswa), dan rekap nilai (rata-rata per mapel + rata-rata akhir + status KKM).

## Struktur Proyek

```
├── public/              # Aset statis (disalin apa adanya ke hasil build)
├── src/
│   ├── components/      # Komponen UI (Header, Sidebar, Modal, Toast, dll)
│   ├── context/         # DataContext — state global + sinkronisasi Excel
│   ├── lib/             # excelDB.js (database Excel), reportImage.js, constants.js
│   ├── pages/           # Halaman (Dashboard, Siswa, Hadir, Riwayat, Nilai, Mapel, Pengaturan)
│   ├── App.jsx          # Shell aplikasi + routing halaman
│   ├── main.jsx         # Entry point React
│   └── index.css        # Tailwind + tema warna + animasi
├── index.html           # Template HTML
├── vite.config.js       # Konfigurasi Vite
└── vercel.json          # Konfigurasi deploy Vercel (SPA rewrite + cache)
```

## Menjalankan

```bash
npm install
npm run dev      # buka http://localhost:5173
npm run build    # build produksi ke folder dist/
npm run preview  # pratinjau hasil build produksi
```

## Deploy ke Vercel

Aplikasi ini siap deploy tanpa konfigurasi tambahan (`vercel.json` sudah menyediakan SPA rewrite dan cache header).

### Cara 1 — Via Dashboard Vercel (disarankan)

1. Push proyek ini ke repositori GitHub/GitLab/Bitbucket.
2. Buka [vercel.com/new](https://vercel.com/new) dan impor repositorinya.
3. Vercel mendeteksi **Vite** otomatis:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Klik **Deploy** — selesai. Setiap push ke branch utama akan otomatis redeploy.

### Cara 2 — Via Vercel CLI

```bash
npm i -g vercel
vercel          # deploy preview
vercel --prod   # deploy produksi
```

> Catatan: tidak perlu environment variables — seluruh data tersimpan di browser pengguna
> (OPFS/localStorage) sehingga aplikasi sepenuhnya berjalan sisi klien.
