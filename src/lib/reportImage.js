/**
 * reportImage.js — Ubah laporan menjadi format gambar (.png).
 *
 * Tabel dirender ke canvas (skala 2x agar tajam) lalu diunduh sebagai PNG
 * berisi: Nama Siswa | Hadir | Sakit | Izin | Alpa | Rata-rata Nilai Ujian.
 *
 * Tersedia dua mode:
 *  - unduhLaporanGambar        : satu tabel untuk satu tingkat kelas.
 *  - unduhLaporanSemuaGambar   : tiga tabel (kelas 7, 8, 9) dalam satu gambar.
 */

import { saveAs } from 'file-saver'
import { APP_NAME, KELAS_LIST } from './constants.js'

const F = "'Segoe UI', Tahoma, Arial, sans-serif"

const W = {
  judul: '#0f172a',
  sub: '#64748b',
  garis: '#e2e8f0',
  kepala: '#1d4ed8',
  teks: '#334155',
  zebra: '#f8fafc',
  kartu: '#f1f5f9',
  merah: '#e11d48',
  hijau: '#166534',
}

/* Konstanta layout tabel (dipakai bersama semua mode) */
const LEBAR = 1080
const MARGIN = 30
const LEBAR_KOLOM = [56, 336, 92, 92, 92, 92, 260] // No, Nama, Hadir, Sakit, Izin, Alpa, Rata-rata
const TINGGI_KEPALA = 52
const TINGGI_BARIS = 44

/** Kunci penghubung data: Nama + tingkat kelas (sama dengan excelDB). */
function kunciOf(nama, kelas) {
  const tingkat = (String(kelas).match(/\d+/) || [''])[0]
  return `${String(nama || '').trim().toLowerCase()}|${tingkat}`
}

/** Rata-rata seluruh nilai ujian per siswa. */
function hitungNilai(nilai, kunciSet) {
  const map = new Map()
  for (const n of nilai || []) {
    const kunci = kunciOf(n.Nama, n.Kelas)
    if (!kunciSet.has(kunci)) continue
    const angka = Number(n.Nilai)
    if (Number.isNaN(angka)) continue
    if (!map.has(kunci)) map.set(kunci, { total: 0, jumlah: 0 })
    const it = map.get(kunci)
    it.total += angka
    it.jumlah += 1
  }
  return map
}

/**
 * Susun data laporan satu tingkat kelas untuk dirender sebagai gambar.
 * @returns {object|null} { judul, kolom, baris, ringkasan, dicetak }
 */
export function susunLaporanGambar(tingkat, data) {
  const t = String(tingkat)
  const siswaT = (data.siswa || []).filter((s) => kunciOf(s.Nama, s.Kelas).endsWith(`|${t}`))
  if (siswaT.length === 0) return null

  const kunciSet = new Set(siswaT.map((s) => kunciOf(s.Nama, s.Kelas)))

  // Hitung kehadiran per siswa
  const hitung = { Hadir: new Map(), Sakit: new Map(), Izin: new Map(), Alpa: new Map() }
  for (const k of data.kehadiran || []) {
    const kunci = kunciOf(k.Nama, k.Kelas)
    if (!kunciSet.has(kunci)) continue
    const m = hitung[k.Status]
    if (m) m.set(kunci, (m.get(kunci) || 0) + 1)
  }

  const nilaiMap = hitungNilai(data.nilai, kunciSet)

  const baris = siswaT.map((s) => {
    const kunci = kunciOf(s.Nama, s.Kelas)
    const nv = nilaiMap.get(kunci)
    return {
      nama: s.Nama,
      hadir: hitung.Hadir.get(kunci) || 0,
      sakit: hitung.Sakit.get(kunci) || 0,
      izin: hitung.Izin.get(kunci) || 0,
      alpa: hitung.Alpa.get(kunci) || 0,
      rataNilai: nv && nv.jumlah > 0 ? Number((nv.total / nv.jumlah).toFixed(1)) : null,
    }
  })

  const ringkasan = {
    siswa: siswaT.length,
    hadir: baris.reduce((a, b) => a + b.hadir, 0),
    sakit: baris.reduce((a, b) => a + b.sakit, 0),
    izin: baris.reduce((a, b) => a + b.izin, 0),
    alpa: baris.reduce((a, b) => a + b.alpa, 0),
  }

  return {
    judul: `Laporan Kelas ${t}`,
    kolom: ['No', 'Nama Siswa', 'Hadir', 'Sakit', 'Izin', 'Alpa', 'Rata-rata Nilai'],
    baris,
    ringkasan,
    dicetak: new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

/** Susun laporan gabungan beberapa tingkat (default: semua kelas yang punya siswa). */
export function susunLaporanSemua(data, tingkatList = KELAS_LIST) {
  const laporans = (tingkatList || []).map((t) => susunLaporanGambar(t, data)).filter(Boolean)
  if (laporans.length === 0) return null
  return {
    judul: `Laporan Seluruh Kelas (${laporans.map((l) => l.judul.replace('Laporan Kelas ', '')).join(', ')})`,
    laporans,
    dicetak: new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

/* ===== Blok gambar yang dipakai bersama ===== */

function gambarKop(ctx, judul, dicetak, tinggiJudul) {
  ctx.fillStyle = W.kepala
  ctx.fillRect(0, 0, LEBAR, tinggiJudul)
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.font = `bold 24px ${F}`
  ctx.fillText(APP_NAME, MARGIN, 36)
  ctx.font = `600 17px ${F}`
  ctx.fillStyle = '#bfdbfe'
  ctx.fillText(judul, MARGIN, 68)
  ctx.font = `12px ${F}`
  ctx.fillStyle = '#93c5fd'
  ctx.fillText(`Dicetak: ${dicetak}`, MARGIN, 94)
}

function hitungLebarTabel() {
  const x0 = MARGIN
  const xKolom = []
  let xj = x0
  for (const w of LEBAR_KOLOM) {
    xKolom.push(xj)
    xj += w
  }
  return { x0, xKolom, lebarTabel: xj - x0 }
}

/** Gambar satu tabel laporan mulai di y. Mengembalikan y setelah tabel. */
function gambarTabel(ctx, laporan, y, x0, xKolom, lebarTabel) {
  const { kolom, baris } = laporan

  // Kepala tabel
  ctx.fillStyle = W.kepala
  ctx.fillRect(x0, y, lebarTabel, TINGGI_KEPALA)
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold 14px ${F}`
  kolom.forEach((k, i) => {
    ctx.textAlign = i === 1 ? 'left' : 'center'
    const cx = i === 1 ? xKolom[i] + 14 : xKolom[i] + LEBAR_KOLOM[i] / 2
    ctx.fillText(k, cx, y + TINGGI_KEPALA / 2)
  })
  y += TINGGI_KEPALA

  // Baris data
  baris.forEach((r, idx) => {
    if (idx % 2 === 1) {
      ctx.fillStyle = W.zebra
      ctx.fillRect(x0, y, lebarTabel, TINGGI_BARIS)
    }
    ctx.strokeStyle = W.garis
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x0, y + TINGGI_BARIS)
    ctx.lineTo(x0 + lebarTabel, y + TINGGI_BARIS)
    ctx.stroke()

    ctx.textBaseline = 'middle'
    ctx.fillStyle = W.teks
    ctx.font = `13px ${F}`
    const cy = y + TINGGI_BARIS / 2

    // No
    ctx.textAlign = 'center'
    ctx.fillText(String(idx + 1), xKolom[0] + LEBAR_KOLOM[0] / 2, cy)

    // Nama
    ctx.textAlign = 'left'
    ctx.font = `600 13.5px ${F}`
    ctx.fillText(String(r.nama).slice(0, 42), xKolom[1] + 14, cy)

    // Hadir (hijau) / Sakit (amber) / Izin (biru) / Alpa (merah)
    ctx.textAlign = 'center'
    ctx.font = `bold 13.5px ${F}`
    ctx.fillStyle = W.hijau
    ctx.fillText(String(r.hadir), xKolom[2] + LEBAR_KOLOM[2] / 2, cy)
    ctx.fillStyle = '#b45309'
    ctx.fillText(String(r.sakit), xKolom[3] + LEBAR_KOLOM[3] / 2, cy)
    ctx.fillStyle = '#0369a1'
    ctx.fillText(String(r.izin), xKolom[4] + LEBAR_KOLOM[4] / 2, cy)
    ctx.fillStyle = W.merah
    ctx.fillText(String(r.alpa), xKolom[5] + LEBAR_KOLOM[5] / 2, cy)

    // Rata-rata nilai semua ujian
    const rata = r.rataNilai === null ? '-' : String(r.rataNilai)
    ctx.fillStyle = r.rataNilai === null ? W.sub : r.rataNilai < 75 ? W.merah : W.hijau
    ctx.fillText(rata, xKolom[6] + LEBAR_KOLOM[6] / 2, cy)

    y += TINGGI_BARIS
  })
  ctx.textAlign = 'left'
  return y
}

/** Gambar kartu ringkasan. Mengembalikan y setelah blok ringkasan. */
function gambarRingkasan(ctx, ringkasan, y, x0, lebarTabel) {
  y += 20
  ctx.textAlign = 'left'
  ctx.font = `bold 15px ${F}`
  ctx.fillStyle = W.judul
  ctx.fillText('Ringkasan', x0, y)
  y += 16

  const kartu = [
    ['Total Siswa', ringkasan.siswa],
    ['Total Hadir', ringkasan.hadir],
    ['Total Sakit', ringkasan.sakit],
    ['Total Izin', ringkasan.izin],
    ['Total Alpa', ringkasan.alpa],
  ]
  const gap = 12
  const lebarKartu = (lebarTabel - gap * (kartu.length - 1)) / kartu.length
  kartu.forEach(([label, nilai], i) => {
    const x = x0 + i * (lebarKartu + gap)
    ctx.fillStyle = W.kartu
    ctx.fillRect(x, y, lebarKartu, 64)
    ctx.fillStyle = W.sub
    ctx.font = `11.5px ${F}`
    ctx.textAlign = 'center'
    ctx.fillText(label, x + lebarKartu / 2, y + 22)
    ctx.fillStyle = W.judul
    ctx.font = `bold 22px ${F}`
    ctx.fillText(String(nilai), x + lebarKartu / 2, y + 45)
  })
  ctx.textAlign = 'left'
  return y + 64
}

function unduhCanvas(canvas, namaFile) {
  canvas.toBlob((blob) => {
    if (blob) saveAs(blob, `${namaFile}.png`)
  }, 'image/png')
}

/**
 * Render laporan satu kelas ke canvas lalu unduh sebagai PNG.
 * @param {object} laporan Hasil susunLaporanGambar
 * @param {string} namaFile Nama file unduhan tanpa ekstensi
 */
export function unduhLaporanGambar(laporan, namaFile) {
  const { baris, ringkasan, judul, dicetak } = laporan

  const SCALE = 2
  const tinggiJudul = 118
  const tinggiKaki = 52
  const tinggi = tinggiJudul + TINGGI_KEPALA + TINGGI_BARIS * baris.length + 150 + tinggiKaki

  const canvas = document.createElement('canvas')
  canvas.width = LEBAR * SCALE
  canvas.height = tinggi * SCALE
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, LEBAR, tinggi)
  gambarKop(ctx, judul, dicetak, tinggiJudul)

  const { x0, xKolom, lebarTabel } = hitungLebarTabel()
  let y = tinggiJudul
  y = gambarTabel(ctx, laporan, y, x0, xKolom, lebarTabel)
  y = gambarRingkasan(ctx, ringkasan, y, x0, lebarTabel)

  ctx.fillStyle = W.sub
  ctx.font = `11px ${F}`
  ctx.fillText(
    'Rata-rata nilai dihitung dari seluruh nilai ujian/penilaian siswa. KKM 75 (merah = belum tuntas, hijau = tuntas).',
    x0,
    tinggi - 20,
  )

  unduhCanvas(canvas, namaFile)
  return { ok: true, jumlahSiswa: baris.length }
}

/**
 * Render laporan TIGA kelas (7, 8, 9) menjadi SATU gambar bertumpuk,
 * lalu unduh sebagai PNG.
 * @param {object} laporanSemua Hasil susunLaporanSemua
 * @param {string} namaFile Nama file unduhan tanpa ekstensi
 */
export function unduhLaporanSemuaGambar(laporanSemua, namaFile) {
  const { laporans, judul, dicetak } = laporanSemua

  const SCALE = 2
  const tinggiJudul = 118
  const tinggiPita = 46 // pita judul per kelas
  const jarakBlok = 34 // jarak antar blok kelas
  const tinggiKaki = 52
  const tinggiRingkasan = 20 + 16 + 64

  // Total tinggi = kop + jumlah tinggi tiap blok kelas + kaki
  const tinggiBlok = (l) => tinggiPita + TINGGI_KEPALA + TINGGI_BARIS * l.baris.length + tinggiRingkasan
  const tinggi =
    tinggiJudul + laporans.reduce((a, l) => a + tinggiBlok(l) + jarakBlok, 0) - jarakBlok + tinggiKaki

  const canvas = document.createElement('canvas')
  canvas.width = LEBAR * SCALE
  canvas.height = tinggi * SCALE
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, LEBAR, tinggi)
  gambarKop(ctx, judul, dicetak, tinggiJudul)

  const { x0, xKolom, lebarTabel } = hitungLebarTabel()

  let y = tinggiJudul
  laporans.forEach((l, idx) => {
    // Pita judul kelas
    ctx.fillStyle = '#eff6ff'
    ctx.fillRect(x0, y, lebarTabel, tinggiPita)
    ctx.fillStyle = W.kepala
    ctx.font = `bold 16px ${F}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.fillText(l.judul, x0 + 14, y + tinggiPita / 2)
    ctx.font = `12px ${F}`
    ctx.fillStyle = W.sub
    ctx.textAlign = 'right'
    ctx.fillText(`${l.ringkasan.siswa} siswa`, x0 + lebarTabel - 14, y + tinggiPita / 2)
    ctx.textAlign = 'left'
    y += tinggiPita

    // Tabel + ringkasan kelas ini
    y = gambarTabel(ctx, l, y, x0, xKolom, lebarTabel)
    y = gambarRingkasan(ctx, l.ringkasan, y, x0, lebarTabel)
    if (idx < laporans.length - 1) y += jarakBlok
  })

  // Catatan kaki
  ctx.fillStyle = W.sub
  ctx.font = `11px ${F}`
  ctx.fillText(
    'Rata-rata nilai dihitung dari seluruh nilai ujian/penilaian siswa. KKM 75 (merah = belum tuntas, hijau = tuntas).',
    x0,
    tinggi - 20,
  )

  unduhCanvas(canvas, namaFile)
  const totalSiswa = laporans.reduce((a, l) => a + l.ringkasan.siswa, 0)
  return { ok: true, jumlahSiswa: totalSiswa, jumlahKelas: laporans.length }
}
