/**
 * Konstanta & utilitas umum aplikasi
 */

export const APP_NAME = "SMP IT Yaspimiyah";
export const APP_TAGLINE = "Dashboard Pengelolaan Data Sekolah";
export const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const STORAGE_KEY = "yaspimiyah-dashboard-file";

export const SHEETS = {
  SISWA: "Siswa",
  HADIR: "Kehadiran",
  NILAI: "Nilai",
  MAPEL: "MataPelajaran",
};

export const TEMPLATE_SISWA = {
  nama: "",
  jenisKelamin: "L",
  kelas: "7",
};

export const TEMPLATE_HADIR = {
  tanggal: todayISO(),
  kelas: "7",
  status: "Hadir",
  catatan: "",
};

export const TEMPLATE_NILAI = {
  nis: "",
  nama: "",
  kelas: "7",
  mapel: "",
  jenis: "Ulangan Harian",
  nilai: "",
};

export const TEMPLATE_MAPEL = {
  kode: "",
  nama: "",
  kkm: 75,
  guru: "",
};

export const JENIS_NILAI = ["Ulangan Harian", "Tugas", "UTS", "UAS", "Praktik"];

export const STATUS_HADIR = ["Hadir", "Sakit", "Izin", "Alpa"];

export const KELAS_LIST = ["7", "8", "9"];

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function tanggalIndo(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTanggalSingkat(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatNilai(nilai) {
  if (nilai === null || nilai === undefined || nilai === "") return "-";
  return String(nilai);
}

/** Tingkat kelas: terima "7" maupun format lama "7A" dan hasilkan "7". */
export function tingkatKelas(kelas) {
  return (String(kelas).match(/\d+/) || [""])[0];
}

/**
 * Normalisasi nilai kelas dari data lama/impor ke format baru.
 * Contoh: "7A"/"7B"/"7 A" -> "7", " 8 " -> "8", "9" -> "9".
 * Kelas yang tidak dikenal dikembalikan apa adanya (sudah dirapikan).
 */
export function normalizeKelas(kelas) {
  const tingkat = tingkatKelas(kelas);
  if (tingkat && KELAS_LIST.includes(tingkat)) return tingkat;
  return String(kelas ?? "").trim();
}

export function normalizeJK(v) {
  const s = String(v).trim().toUpperCase();
  if (["L", "LK", "PRIA", "LAKI-LAKI", "LAKI LAKI", "MALE", "M"].includes(s))
    return "L";
  if (["P", "PR", "WANITA", "PEREMPUAN", "FEMALE", "F"].includes(s)) return "P";
  return "L";
}
