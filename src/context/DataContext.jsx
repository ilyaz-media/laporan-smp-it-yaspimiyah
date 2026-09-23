import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { db } from '../lib/excelDB.js'
import { susunLaporanGambar, unduhLaporanGambar, susunLaporanSemua, unduhLaporanSemuaGambar } from '../lib/reportImage.js'
import { SHEETS, uid, TEMPLATE_SISWA, TEMPLATE_HADIR, TEMPLATE_NILAI, TEMPLATE_MAPEL, todayISO, normalizeKelas } from '../lib/constants.js'

const DataContext = createContext(null)

let toastHandler = null
export function registerToastHandler(fn) {
  toastHandler = fn
}
/**
 * Tampilkan notifikasi toast dari mana saja (dipakai juga oleh halaman).
 * @param {string} msg Isi pesan notifikasi
 * @param {'success'|'error'|'info'|'download'} type Jenis popup
 * @param {string|null} judul Judul kustom popup (opsional)
 */
export function toast(msg, type = 'success', judul = null) {
  if (toastHandler) toastHandler(msg, type, judul)
}

export function DataProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [fileStatus, setFileStatus] = useState(db.status)
  const [siswa, setSiswa] = useState([])
  const [kehadiran, setKehadiran] = useState([])
  const [nilai, setNilai] = useState([])
  const [mapel, setMapel] = useState([])
  const [lastSaved, setLastSaved] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await db.init()
      if (!alive) return
      // Normalisasi kelas format lama (7A/7B/...) ke format baru (7/8/9)
      const siswaMigrasi = (res.data[SHEETS.SISWA] || []).map((s) => ({ ...s, Kelas: normalizeKelas(s.Kelas) }))
      const hadirMigrasi = (res.data[SHEETS.HADIR] || []).map((k) => ({ ...k, Kelas: normalizeKelas(k.Kelas) }))
      const nilaiMigrasi = (res.data[SHEETS.NILAI] || []).map((n) => ({ ...n, Kelas: normalizeKelas(n.Kelas) }))
      setSiswa(siswaMigrasi)
      setKehadiran(hadirMigrasi)
      setNilai(nilaiMigrasi)
      setMapel(res.data[SHEETS.MAPEL] || [])
      // Simpan hasil migrasi agar file Excel ikut terbarui
      await db.writeCollections({
        [SHEETS.SISWA]: siswaMigrasi,
        [SHEETS.HADIR]: hadirMigrasi,
        [SHEETS.NILAI]: nilaiMigrasi,
      })
      setFileStatus(db.status)
      setReady(true)
    })()
    return () => {
      alive = false
    }
  }, [])

  /** Simpan satu koleksi ke sheet terkait di file Excel. */
  const persist = useCallback(async (sheetName, rows, label) => {
    const res = await db.writeCollection(sheetName, rows)
    setFileStatus(db.status)
    setLastSaved(new Date())
    if (res && res.ok === false) {
      toast('Gagal menyimpan ke file Excel — coba simpan ulang via menu Ekspor.', 'error', 'Gagal Menyimpan')
    } else if (label) {
      toast(label.pesan ?? label, label.tipe ?? 'success', label.judul ?? null)
    }
  }, [])

  /* ---------------- Siswa ---------------- */

  const addSiswa = useCallback(
    (data) => {
      const row = { ...TEMPLATE_SISWA, id: uid('sis'), ...data }
      const next = [...siswa, row]
      setSiswa(next)
      persist(SHEETS.SISWA, next, { pesan: `${row.Nama} berhasil ditambahkan & tersimpan ke Excel.`, judul: 'Siswa Ditambahkan' })
      return row
    },
    [siswa, persist],
  )

  const updateSiswa = useCallback(
    (id, data) => {
      const next = siswa.map((s) => (s.id === id ? { ...s, ...data } : s))
      setSiswa(next)
      persist(SHEETS.SISWA, next, { pesan: `Perubahan data ${data.Nama || 'siswa'} tersimpan ke Excel.`, judul: 'Data Diperbarui' })
    },
    [siswa, persist],
  )

  const deleteSiswa = useCallback(
    (id) => {
      const target = siswa.find((s) => s.id === id)
      const next = siswa.filter((s) => s.id !== id)
      setSiswa(next)
      persist(SHEETS.SISWA, next, { pesan: `Data siswa "${target?.Nama || ''}" berhasil dihapus dari Excel.`, judul: 'Data Dihapus' })
    },
    [siswa, persist],
  )

  /**
   * Impor banyak siswa sekaligus dari file Excel yang sudah diparse.
   * Baris duplikat (nama + kelas sama, tidak peduli huruf besar/kecil) dilewati.
   * Sekaligus menulis sheet Siswa dengan satu kali simpan ke Excel.
   */
  const importSiswa = useCallback(
    (rows) => {
      const kunci = (s) => `${String(s.Nama || '').trim().toLowerCase()}|${s.Kelas}`
      const existing = new Set(siswa.map(kunci))
      const baru = []
      let duplikat = 0
      for (const r of rows) {
        const row = { ...TEMPLATE_SISWA, id: uid('sis'), Nama: r.Nama, JenisKelamin: r.JenisKelamin, Kelas: r.Kelas }
        if (existing.has(kunci(row))) {
          duplikat++
          continue
        }
        existing.add(kunci(row))
        baru.push(row)
      }
      if (baru.length > 0) {
        const next = [...siswa, ...baru]
        setSiswa(next)
        persist(SHEETS.SISWA, next)
      }
      return { ditambahkan: baru.length, duplikat }
    },
    [siswa, persist],
  )

  /**
   * Reset total: kosongkan data siswa beserta data nilai dan kehadiran,
   * lalu simpan ketiga sheet ke Excel sekaligus dengan satu kali penulisan.
   */
  const resetAllData = useCallback(() => {
    const jumlahSiswa = siswa.length
    const jumlahNilai = nilai.length
    const jumlahKehadiran = kehadiran.length
    setSiswa([])
    setNilai([])
    setKehadiran([])
    const run = async () => {
      const res = await db.writeCollections({
        [SHEETS.SISWA]: [],
        [SHEETS.NILAI]: [],
        [SHEETS.HADIR]: [],
      })
      setFileStatus(db.status)
      setLastSaved(new Date())
      if (res && res.ok === false) {
        toast('Gagal menyimpan ke file Excel — coba simpan ulang via menu Ekspor.', 'error', 'Gagal Menyimpan')
      } else {
        toast(`Reset berhasil: ${jumlahSiswa} siswa, ${jumlahNilai} nilai, ${jumlahKehadiran} presensi dihapus.`, 'success', 'Reset Selesai')
      }
    }
    run()
    return { jumlahSiswa, jumlahNilai, jumlahKehadiran }
  }, [siswa, nilai, kehadiran])

  /**
   * Ganti bulan: kosongkan riwayat absensi dan daftar nilai (awal bulan baru),
   * sementara data siswa dan mata pelajaran tetap tersimpan.
   */
  const gantiBulan = useCallback(() => {
    const jumlahKehadiran = kehadiran.length
    const jumlahNilai = nilai.length
    setKehadiran([])
    setNilai([])
    const run = async () => {
      const res = await db.writeCollections({
        [SHEETS.HADIR]: [],
        [SHEETS.NILAI]: [],
      })
      setFileStatus(db.status)
      setLastSaved(new Date())
      if (res && res.ok === false) {
        toast('Gagal menyimpan ke file Excel — coba simpan ulang via menu Ekspor.', 'error')
      } else {
        toast(
          `${jumlahKehadiran} absensi & ${jumlahNilai} nilai dikosongkan. Data siswa & mapel tetap ada.`,
          'success',
          'Ganti Bulan Berhasil',
        )
      }
    }
    run()
    return { jumlahKehadiran, jumlahNilai }
  }, [kehadiran, nilai])

  /* ---------------- Kehadiran ---------------- */

  const addKehadiran = useCallback(
    (rows) => {
      const withIds = rows.map((r) => ({ ...TEMPLATE_HADIR, id: uid('hdr'), ...r }))
      const next = [...kehadiran, ...withIds]
      setKehadiran(next)
      persist(SHEETS.HADIR, next, { pesan: 'Absensi berhasil tersimpan ke Excel.', judul: 'Absensi Tersimpan' })
    },
    [kehadiran, persist],
  )

  /**
   * Simpan absensi satu hari (satu tanggal + kelas): seluruh baris lama untuk
   * tanggal+kelas tersebut diganti dengan yang baru, jadi menyimpan ulang
   * memperbarui data alih-alih menambah duplikat. Riwayat tetap tersimpan
   * (file Excel / localStorage) dan ikut masuk ke laporan yang diunduh.
   */
  const replaceKehadiranHarian = useCallback(
    (rows, label = 'Absensi tersimpan ke Excel.') => {
      const t = rows[0]?.Tanggal
      const k = rows[0]?.Kelas
      const denganId = rows.map((r) => ({ ...TEMPLATE_HADIR, id: uid('hdr'), ...r }))
      const next = [...kehadiran.filter((x) => !(x.Tanggal === t && x.Kelas === k)), ...denganId]
      setKehadiran(next)
      persist(SHEETS.HADIR, next, label)
    },
    [kehadiran, persist],
  )

  const updateKehadiran = useCallback(
    (id, data) => {
      const next = kehadiran.map((k) => (k.id === id ? { ...k, ...data } : k))
      setKehadiran(next)
      persist(SHEETS.HADIR, next)
    },
    [kehadiran, persist],
  )

  const deleteKehadiran = useCallback(
    (id) => {
      const next = kehadiran.filter((k) => k.id !== id)
      setKehadiran(next)
      persist(SHEETS.HADIR, next, { pesan: 'Data absensi berhasil dihapus.', judul: 'Absensi Dihapus' })
    },
    [kehadiran, persist],
  )

  /* ---------------- Nilai ---------------- */

  const addNilai = useCallback(
    (rows) => {
      const withIds = rows.map((r) => ({ ...TEMPLATE_NILAI, id: uid('nl'), ...r }))
      const next = [...nilai, ...withIds]
      setNilai(next)
      persist(SHEETS.NILAI, next, { pesan: 'Nilai berhasil tersimpan ke Excel.', judul: 'Nilai Tersimpan' })
    },
    [nilai, persist],
  )

  const updateNilai = useCallback(
    (id, data) => {
      const next = nilai.map((n) => (n.id === id ? { ...n, ...data } : n))
      setNilai(next)
      persist(SHEETS.NILAI, next)
    },
    [nilai, persist],
  )

  const deleteNilai = useCallback(
    (id) => {
      const next = nilai.filter((n) => n.id !== id)
      setNilai(next)
      persist(SHEETS.NILAI, next, { pesan: 'Data nilai berhasil dihapus.', judul: 'Nilai Dihapus' })
    },
    [nilai, persist],
  )

  /* ---------------- Mata Pelajaran ---------------- */

  const addMapel = useCallback(
    (data) => {
      const row = { ...TEMPLATE_MAPEL, id: uid('mpl'), ...data }
      const next = [...mapel, row]
      setMapel(next)
      persist(SHEETS.MAPEL, next, { pesan: `${row.Nama} berhasil ditambahkan ke daftar mapel.`, judul: 'Mapel Ditambahkan' })
    },
    [mapel, persist],
  )

  const updateMapel = useCallback(
    (id, data) => {
      const next = mapel.map((m) => (m.id === id ? { ...m, ...data } : m))
      setMapel(next)
      persist(SHEETS.MAPEL, next)
    },
    [mapel, persist],
  )

  const deleteMapel = useCallback(
    (id) => {
      const target = mapel.find((m) => m.id === id)
      const next = mapel.filter((m) => m.id !== id)
      setMapel(next)
      persist(SHEETS.MAPEL, next, { pesan: `${target?.Nama || 'Mata pelajaran'} berhasil dihapus.`, judul: 'Mapel Dihapus' })
    },
    [mapel, persist],
  )

  /* ---------------- Backup & Restore ---------------- */

  /** Unduh file backup berisi seluruh data (siswa, absensi, nilai, mapel). */
  const backupData = useCallback(() => {
    if (siswa.length + kehadiran.length + nilai.length + mapel.length === 0) {
      toast('Belum ada data untuk dibackup.', 'info')
      return
    }
    const res = db.backupToFile()
    if (res.ok) {
      toast(
        `${siswa.length} siswa, ${kehadiran.length} absensi, ${nilai.length} nilai, ${mapel.length} mapel.`,
        'download',
        'Backup Berhasil Diunduh',
      )
    } else {
      toast('Gagal membuat backup.', 'error', 'Backup Gagal')
    }
  }, [siswa, kehadiran, nilai, mapel])

  /**
   * Pulihkan seluruh data dari file backup. Menggantikan SEMUA data aktif
   * dengan isi file backup lalu menyimpannya ke tempat penyimpanan aktif.
   */
  const restoreData = useCallback(
    async (file) => {
      try {
        const data = await db.restoreFromFile(file)
        const norm = (rows) => (rows || []).map((r) => ({ ...r, Kelas: normalizeKelas(r.Kelas) }))
        const siswaBaru = norm(data[SHEETS.SISWA])
        setSiswa(siswaBaru)
        setKehadiran(norm(data[SHEETS.HADIR]))
        setNilai(norm(data[SHEETS.NILAI]))
        setMapel(data[SHEETS.MAPEL] || [])
        setFileStatus(db.status)
        setLastSaved(new Date())
        toast(
          `${siswaBaru.length} siswa, ${(data[SHEETS.HADIR] || []).length} absensi, ${(data[SHEETS.NILAI] || []).length} nilai, ${(data[SHEETS.MAPEL] || []).length} mapel.`,
          'success',
          'Data Berhasil Dipulihkan',
        )
        return { ok: true }
      } catch (err) {
        console.warn('Restore gagal:', err)
        toast('Pastikan file adalah hasil backup aplikasi ini (.xlsx).', 'error', 'Restore Gagal')
        return { ok: false }
      }
    },
    [],
  )

  /* ---------------- Laporan ---------------- */

  const exportClassReport = useCallback(
    (tingkat) => {
      const res = db.exportClassReport(tingkat, { siswa, kehadiran, nilai, mapel })
      if (res.ok) {
        toast(`Laporan Kelas ${tingkat} (${res.jumlahSiswa} siswa) berhasil diunduh.`, 'download', 'Laporan Diunduh')
      } else {
        toast(`Tidak ada siswa di tingkat ${tingkat} untuk dilaporkan.`, 'info', 'Data Kosong')
      }
    },
    [siswa, kehadiran, nilai, mapel],
  )

  /** Laporan per tingkat dalam format gambar (PNG) siap dibagikan/dicetak. */
  const exportClassReportImage = useCallback(
    (tingkat) => {
      const laporan = susunLaporanGambar(tingkat, { siswa, kehadiran, nilai, mapel })
      if (!laporan) {
        toast(`Tidak ada siswa di tingkat ${tingkat} untuk dilaporkan.`, 'info')
        return
      }
      unduhLaporanGambar(laporan, `Laporan_Kelas_${tingkat}_yaspimiyah`)
      toast(
        `Laporan Kelas ${tingkat} (${laporan.ringkasan.siswa} siswa) berhasil diunduh sebagai gambar.`,
        'download',
        'Laporan Gambar Siap',
      )
    },
    [siswa, kehadiran, nilai, mapel],
  )

  /** Laporan gabungan SELURUH kelas: tiga tabel dalam satu gambar PNG. */
  const exportClassReportAllImage = useCallback(() => {
    const gabungan = susunLaporanSemua({ siswa, kehadiran, nilai, mapel })
    if (!gabungan) {
      toast('Belum ada data siswa untuk dilaporkan.', 'info')
      return
    }      unduhLaporanSemuaGambar(gabungan, 'Laporan_Semua_Kelas_yaspimiyah')
      toast(
        `Laporan ${gabungan.jumlahKelas} kelas (${gabungan.jumlahSiswa} siswa) berhasil diunduh sebagai satu gambar.`,
        'download',
        'Laporan Semua Kelas Siap',
      )
  }, [siswa, kehadiran, nilai, mapel])

  const value = {
    ready,
    fileStatus,
    lastSaved,
    siswa,
    kehadiran,
    nilai,
    mapel,
    addSiswa,
    updateSiswa,
    deleteSiswa,
    importSiswa,
    resetAllData,
    gantiBulan,
    addKehadiran,
    replaceKehadiranHarian,
    updateKehadiran,
    deleteKehadiran,
    addNilai,
    updateNilai,
    deleteNilai,
    addMapel,
    updateMapel,
    deleteMapel,
    exportClassReport,
    exportClassReportImage,
    exportClassReportAllImage,
    backupData,
    restoreData,
    tanggalHariIni: todayISO(),
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData harus dipakai di dalam <DataProvider>')
  return ctx
}
