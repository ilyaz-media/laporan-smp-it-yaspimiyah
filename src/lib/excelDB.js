/**
 * ExcelDatabase — Excel (.xlsx) sebagai database aplikasi.
 *
 * File database berisi 4 sheet:
 *  - Siswa           : Nama | JenisKelamin | Kelas
 *  - Kehadiran       : Tanggal | Nama | Kelas | Status | Catatan
 *  - Nilai           : Nama | Kelas | MataPelajaran | Jenis | Nilai
 *  - MataPelajaran   : Kode | Nama | KKM | Guru
 *
 * Mode penyimpanan:
 *  1. "browser-fs"  — File System Access API: koneksi langsung ke file Excel
 *                     di komputer (Chrome/Edge). Setiap perubahan otomatis
 *                     tersimpan ke file tersebut.
 *  2. "local"       — Tanpa akses file: data tersimpan di localStorage dan
 *                     dapat diekspor/impor manual sebagai file Excel.
 *
 * Laporan per tingkat (Kelas 7/8/9) diekspor sebagai file .xlsx terpisah
 * berisi 3 sheet: profil siswa, rekap presensi, dan rekap nilai.
 */

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  SHEETS,
  XLSX_MIME,
  STORAGE_KEY,
  uid,
  normalizeKelas,
  normalizeJK,
} from "./constants.js";

const HEADERS = {
  [SHEETS.SISWA]: ["Nama", "JenisKelamin", "Kelas"],
  [SHEETS.HADIR]: ["Tanggal", "Nama", "Kelas", "Status", "Catatan"],
  [SHEETS.NILAI]: ["Nama", "Kelas", "MataPelajaran", "Jenis", "Nilai"],
  [SHEETS.MAPEL]: ["Kode", "Nama", "KKM", "Guru"],
};

// Pemetaan header fleksibel agar impor dari Excel eksternal tetap dikenali
const HEADER_ALIASES = {
  nama: "Nama",
  namasiswa: "Nama",
  namalengkap: "Nama",
  jeniskelamin: "JenisKelamin",
  jk: "JenisKelamin",
  lp: "JenisKelamin",
  kelas: "Kelas",
  tanggal: "Tanggal",
  status: "Status",
  catatan: "Catatan",
  matapelajaran: "MataPelajaran",
  mapel: "MataPelajaran",
  jenis: "Jenis",
  jenistest: "Jenis",
  nilai: "Nilai",
  angka: "Nilai",
  kode: "Kode",
  kodemapel: "Kode",
  kkm: "KKM",
  guru: "Guru",
  gurupengampu: "Guru",
};

const EMPTY = () => ({
  [SHEETS.SISWA]: [],
  [SHEETS.HADIR]: [],
  [SHEETS.NILAI]: [],
  [SHEETS.MAPEL]: [],
});

/* ---------------- Bantu: konversi baris <-> objek ---------------- */

function normalizeHeader(h) {
  const key = String(h ?? "")
    .toLowerCase()
    .replace(/[\s_\-./]/g, "");
  return HEADER_ALIASES[key] || null;
}

function coerceValue(field, v) {
  if (field === "Tanggal") return cellToISO(v);
  if (field === "KKM" || field === "Nilai") {
    if (v === "" || v === null || v === undefined) return "";
    const n = Number(v);
    return Number.isNaN(n) ? "" : n;
  }
  return v === "" || v === null || v === undefined ? "" : v;
}

/** Baris Excel -> objek aplikasi (hanya field yang dikenali; kolom lain diabaikan). */
function rowsToObjects(aoa) {
  if (!aoa || aoa.length < 2) return [];
  const headerRow = aoa[0].map(normalizeHeader);
  return aoa
    .slice(1)
    .filter((row) =>
      row.some((cell) => cell !== "" && cell !== null && cell !== undefined),
    )
    .map((row) => {
      const obj = { id: uid("row") };
      headerRow.forEach((field, i) => {
        if (field) obj[field] = coerceValue(field, row[i]);
      });
      return obj;
    });
}

function cellToISO(v) {
  if (!v) return "";
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof v === "number") {
    // Serial date Excel
    const parsed = XLSX.SSF.parse_date_code(v);
    if (parsed) {
      const m = String(parsed.m).padStart(2, "0");
      const d = String(parsed.d).padStart(2, "0");
      return `${parsed.y}-${m}-${d}`;
    }
  }
  return String(v);
}

function objectsToSheet(sheetName, rows) {
  const headers = HEADERS[sheetName];
  const aoa = [headers];
  for (const r of rows) {
    aoa.push(
      headers.map((h) => (r[h] !== undefined && r[h] !== null ? r[h] : "")),
    );
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(12, h.length + 4) }));
  return ws;
}

function sheetFromAoa(aoa, widths) {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  if (widths) ws["!cols"] = widths;
  return ws;
}

/** Baca file .xlsx/.xls (dari input file) menjadi workbook XLSX. */
export async function readWorkbookFromFile(file) {
  const buf = await file.arrayBuffer();
  return XLSX.read(buf, { type: "array", cellDates: true });
}

/**
 * Parse workbook impor menjadi daftar siswa.
 * Mengenali kolom fleksibel (Nama/Name/Nama Siswa, JK/L/P, Kelas/Class)
 * dan baris kosong otomatis dilewati.
 */
export function parseSiswaWorkbook(wb) {
  let aoa = [];
  // Cari sheet "Siswa" dulu; kalau tidak ada, pakai sheet pertama
  const sheetName =
    wb.SheetNames.find((n) => n.toLowerCase().trim() === "siswa") ||
    wb.SheetNames[0];
  if (sheetName) {
    aoa = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
      header: 1,
      raw: true,
      defval: "",
    });
  }
  if (aoa.length < 2) return [];

  const headerRow = aoa[0].map(normalizeHeader);
  const idxNama = headerRow.indexOf("Nama");
  const idxJK = headerRow.indexOf("JenisKelamin");
  const idxKelas = headerRow.indexOf("Kelas");
  if (idxNama === -1) return []; // tidak ada kolom nama — anggap file tidak valid

  return aoa
    .slice(1)
    .filter((row) => String(row[idxNama] ?? "").trim() !== "")
    .map((row) => ({
      Nama: String(row[idxNama] ?? "").trim(),
      JenisKelamin: normalizeJK(idxJK !== -1 ? row[idxJK] : "L"),
      Kelas: normalizeKelas(idxKelas !== -1 ? row[idxKelas] : "7"),
    }));
}

/** Unduh file Excel template berisi contoh format impor data siswa. */
export function downloadTemplateSiswa() {
  const aoa = [
    ["Nama", "JenisKelamin", "Kelas"],
    ["Ahmad Fauzi", "L", "7"],
    ["Siti Aminah", "P", "8"],
  ];
  const ws = sheetFromAoa(aoa, [{ wch: 28 }, { wch: 14 }, { wch: 10 }]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, SHEETS.SISWA);
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([out], { type: XLSX_MIME }), "Template_Import_Siswa.xlsx");
}

/* ---------------- Buku kerja -> objek data ---------------- */

/** Baca workbook apa pun (milik aplikasi atau eksternal) menjadi data aplikasi. */
function workbookToData(wb) {
  const data = EMPTY();
  for (const name of Object.values(SHEETS)) {
    const ws = wb.Sheets[name];
    if (!ws) continue; // sheet tidak ada (file eksternal) — biarkan kosong
    const aoa = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      raw: true,
      defval: "",
    });
    data[name] = rowsToObjects(aoa);
  }
  return data;
}

/* ---------------- Kelas utama ---------------- */

export class ExcelDatabase {
  constructor() {
    this.mode = "local"; // 'browser-fs' | 'local'
    this.handle = null; // FileSystemFileHandle
    this.wb = null;
    this.listeners = new Set();
  }

  notify() {
    this.listeners.forEach((fn) => fn());
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  get status() {
    if (this.mode === "browser-fs") {
      return {
        mode: "browser-fs",
        label: "Excel terhubung",
        fileName: this.handle?.name,
      };
    }
    return { mode: "local", label: "Mode lokal", fileName: null };
  }

  /* ---------- Inisialisasi ---------- */

  async init() {
    if ("storage" in navigator && "getDirectory" in navigator.storage) {
      try {
        const root = await navigator.storage.getDirectory();
        const dirHandle = await root.getDirectoryHandle(
          "yaspimiyah-dashboard",
          { create: true },
        );
        this.dirHandle = dirHandle;
        try {
          const handle = await dirHandle.getFileHandle(
            "database-yaspimiyah.xlsx",
            { create: false },
          );
          this.handle = handle;
          this.mode = "browser-fs";
          const file = await handle.getFile();
          const buf = await file.arrayBuffer();
          this.wb = XLSX.read(buf, { type: "array", cellDates: true });
          return { ok: true, created: false, data: workbookToData(this.wb) };
        } catch {
          // Belum ada file — buat baru
          const created = await this._createNewWorkbook();
          this.handle = created.handle;
          this.mode = "browser-fs";
          this.wb = created.wb;
          return { ok: true, created: true, data: workbookToData(this.wb) };
        }
      } catch (err) {
        console.warn(
          "File System Access tidak tersedia, fallback ke localStorage:",
          err,
        );
      }
    }
    // Fallback localStorage
    this.mode = "local";
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const buf = Uint8Array.from(atob(saved), (c) => c.charCodeAt(0));
        this.wb = XLSX.read(buf, { type: "array", cellDates: true });
        return { ok: true, created: false, data: workbookToData(this.wb) };
      } catch (err) {
        console.warn("Gagal membaca data tersimpan:", err);
      }
    }
    const wb = this._newWorkbook();
    this.wb = wb;
    return { ok: true, created: true, data: workbookToData(this.wb) };
  }

  _newWorkbook() {
    const wb = XLSX.utils.book_new();
    for (const name of Object.values(SHEETS)) {
      XLSX.utils.book_append_sheet(wb, objectsToSheet(name, []), name);
    }
    return wb;
  }

  async _createNewWorkbook() {
    const wb = this._newWorkbook();
    const handle = await this.dirHandle.getFileHandle(
      "database-yaspimiyah.xlsx",
      { create: true },
    );
    await this._writeToHandle(handle, wb);
    return { handle, wb };
  }

  /* ---------- Penyimpanan ---------- */

  async _writeToHandle(handle, wb) {
    const out = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
      cellDates: true,
    });
    const writable = await handle.createWritable();
    await writable.write(out);
    await writable.close();
  }

  _persistLocal() {
    try {
      const out = XLSX.write(this.wb, {
        bookType: "xlsx",
        type: "array",
        cellDates: true,
      });
      let binary = "";
      const bytes = new Uint8Array(out);
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      localStorage.setItem(STORAGE_KEY, btoa(binary));
    } catch (err) {
      console.warn(
        "Gagal menyimpan ke localStorage (mungkin melebihi kuota):",
        err,
      );
    }
  }

  /** Simpan seluruh workbook ke tempat sesuai mode. */
  async save() {
    if (this.mode === "browser-fs" && this.handle) {
      try {
        await this._writeToHandle(this.handle, this.wb);
        return { ok: true };
      } catch (err) {
        console.error("Gagal menyimpan ke file Excel:", err);
        return { ok: false, error: err };
      }
    }
    this._persistLocal();
    return { ok: true };
  }

  /* ---------- Backup & Restore seluruh data ---------- */

  /**
   * Unduh salinan seluruh workbook (siswa, kehadiran, nilai, mapel)
   * sebagai file .xlsx independen — data aplikasi tidak terganggu.
   */
  backupToFile() {
    if (!this.wb) return { ok: false };
    const out = XLSX.write(this.wb, {
      bookType: "xlsx",
      type: "array",
      cellDates: true,
    });
    const tanggal = new Date().toISOString().slice(0, 10);
    const jam = new Date().toTimeString().slice(0, 5).replace(":", "-");
    saveAs(
      new Blob([out], { type: XLSX_MIME }),
      `Backup_yaspimiyah_${tanggal}_${jam}.xlsx`,
    );
    return { ok: true };
  }

  /**
   * Baca file backup (.xlsx hasil backupToFile atau workbook dengan format
   * sheet yang sama) dan terapkan isinya sebagai data aplikasi aktif.
   * Sheet yang tidak ada di file dibiarkan kosong.
   */
  async restoreFromFile(file) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array", cellDates: true });
    const data = workbookToData(wb);
    if (!data[SHEETS.SISWA] && !data[SHEETS.HADIR] && !data[SHEETS.NILAI] && !data[SHEETS.MAPEL]) {
      throw new Error("File tidak berisi sheet data yang dikenali");
    }
    // Ganti workbook aktif dengan isi backup lalu simpan ke tempat penyimpanan aktif
    this.wb = wb;
    await this.save();
    return data;
  }

  /** Tulis koleksi ke workbook lalu simpan. */
  async writeCollection(sheetName, rows) {
    return this.writeCollections({ [sheetName]: rows });
  }

  /** Tulis beberapa koleksi (sheet) sekaligus dengan satu kali simpan. */
  async writeCollections(mapSheetToRows) {
    if (!this.wb) return;
    for (const [sheetName, rows] of Object.entries(mapSheetToRows)) {
      const idx = this.wb.SheetNames.indexOf(sheetName);
      const ws = objectsToSheet(sheetName, rows || []);
      if (idx === -1) {
        XLSX.utils.book_append_sheet(this.wb, ws, sheetName);
      } else {
        this.wb.Sheets[sheetName] = ws;
      }
    }
    return this.save();
  }

  /* ---------- Ekspor laporan per tingkat kelas ---------- */

  /**
   * Unduh laporan satu tingkat (mis. "7" untuk seluruh siswa kelas 7).
   * Menghasilkan file .xlsx dengan 3 sheet:
   *  - "Kelas {tingkat}" : profil siswa tingkat tersebut
   *  - "Presensi"        : rekap Hadir/Sakit/Izin/Alpa per siswa
   *  - "RekapNilai"      : rata-rata per mata pelajaran + rata-rata akhir + status
   */
  exportClassReport(tingkat, data) {
    const t = String(tingkat);
    const tingkatOf = (kelas) => (String(kelas).match(/\d+/) || [""])[0];

    const siswaT = (data.siswa || []).filter((s) => tingkatOf(s.Kelas) === t);
    if (siswaT.length === 0) return { ok: false };

    // Kunci penghubung data = Nama + Kelas (NIS sudah tidak dipakai)
    const kunciOf = (nama, kelas) =>
      `${String(nama || "").trim().toLowerCase()}|${tingkatOf(kelas)}`;
    const kunciSet = new Set(siswaT.map((s) => kunciOf(s.Nama, s.Kelas)));
    const kehadiranT = (data.kehadiran || []).filter((k) =>
      kunciSet.has(kunciOf(k.Nama, k.Kelas)),
    );
    const nilaiT = (data.nilai || []).filter((n) =>
      kunciSet.has(kunciOf(n.Nama, n.Kelas)),
    );
    const mapelNames = [
      ...new Set(nilaiT.map((n) => n.MataPelajaran).filter(Boolean)),
    ];

    // Statistik per siswa
    const stats = new Map();
    siswaT.forEach((s) => {
      stats.set(kunciOf(s.Nama, s.Kelas), {
        siswa: s,
        Hadir: 0,
        Sakit: 0,
        Izin: 0,
        Alpa: 0,
        nilai: {},
      });
    });
    kehadiranT.forEach((k) => {
      const row = stats.get(kunciOf(k.Nama, k.Kelas));
      if (row && row[k.Status] !== undefined) row[k.Status] += 1;
    });
    nilaiT.forEach((n) => {
      const row = stats.get(kunciOf(n.Nama, n.Kelas));
      if (!row) return;
      if (!row.nilai[n.MataPelajaran]) row.nilai[n.MataPelajaran] = [];
      row.nilai[n.MataPelajaran].push(Number(n.Nilai) || 0);
    });

    /* Sheet 1 — Profil siswa */
    const profilAoa = [
      HEADERS[SHEETS.SISWA],
      ...siswaT.map((s) => HEADERS[SHEETS.SISWA].map((h) => s[h] ?? "")),
    ];

    /* Sheet 2 — Rekap presensi */
    const presensiAoa = [
      [
        "Nama",
        "Kelas",
        "Hadir",
        "Sakit",
        "Izin",
        "Alpa",
        "Total Presensi",
      ],
      ...[...stats.values()].map((r) => [
        r.siswa.Nama,
        r.siswa.Kelas,
        r.Hadir,
        r.Sakit,
        r.Izin,
        r.Alpa,
        r.Hadir + r.Sakit + r.Izin + r.Alpa,
      ]),
    ];

    /* Sheet 2b — Riwayat absensi harian (detail per tanggal) */
    const detailPresensiAoa = [
      HEADERS[SHEETS.HADIR],
      ...kehadiranT
        .slice()
        .sort(
          (a, b) =>
            String(a.Tanggal).localeCompare(String(b.Tanggal)) ||
            String(a.Nama).localeCompare(String(b.Nama)),
        )
        .map((k) =>
          HEADERS[SHEETS.HADIR].map((h) => (k[h] ?? "") !== "" ? k[h] : ""),
        ),
    ];

    /* Sheet 3 — Rekap nilai (kolom dinamis per mata pelajaran) */
    const nilaiHeader = [
      "Nama",
      "Kelas",
      ...mapelNames,
      "Rata-rata",
      "Status (KKM 75)",
    ];
    const nilaiRows = [...stats.values()].map((r) => {
      const rataMapel = mapelNames.map((mp) => {
        const arr = r.nilai[mp];
        if (!arr || arr.length === 0) return "";
        return Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1));
      });
      const semua = Object.values(r.nilai).flat();
      const rata = semua.length
        ? Number((semua.reduce((a, b) => a + b, 0) / semua.length).toFixed(1))
        : "";
      const status = rata === "" ? "-" : rata >= 75 ? "Tuntas" : "Belum Tuntas";
      return [
        r.siswa.Nama,
        r.siswa.Kelas,
        ...rataMapel,
        rata,
        status,
      ];
    });

    const wb = XLSX.utils.book_new();
    const lebar = (aoa) =>
      aoa[0].map((h, i) => ({
        wch: Math.max(
          10,
          String(h).length + 4,
          ...aoa.slice(1).map((row) => String(row[i] ?? "").length + 2),
        ),
      }));

    XLSX.utils.book_append_sheet(
      wb,
      sheetFromAoa(profilAoa, lebar(profilAoa)),
      `Kelas ${t}`,
    );
    XLSX.utils.book_append_sheet(
      wb,
      sheetFromAoa(presensiAoa, lebar(presensiAoa)),
      "Presensi",
    );
    XLSX.utils.book_append_sheet(
      wb,
      sheetFromAoa(
        detailPresensiAoa.length > 1 ? detailPresensiAoa : [detailPresensiAoa[0]],
        lebar([detailPresensiAoa[0]]),
      ),
      "DetailPresensi",
    );
    XLSX.utils.book_append_sheet(
      wb,
      sheetFromAoa(
        nilaiRows.length ? [nilaiHeader, ...nilaiRows] : [nilaiHeader],
        lebar([nilaiHeader]),
      ),
      "RekapNilai",
    );

    const out = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
      cellDates: true,
    });
    const blob = new Blob([out], { type: XLSX_MIME });
    saveAs(blob, `Laporan_Kelas_${t}_yaspimiyah.xlsx`);
    return { ok: true, jumlahSiswa: siswaT.length };
  }
}

export const db = new ExcelDatabase();
