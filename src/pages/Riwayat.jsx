import React, { useMemo, useState } from 'react'
import { useData } from '../context/DataContext.jsx'
import { KELAS_LIST, tanggalIndo } from '../lib/constants.js'
import Modal from '../components/Modal.jsx'

const STATUS_STYLE = {
  Hadir: 'bg-emerald-100 text-emerald-700',
  Sakit: 'bg-amber-100 text-amber-700',
  Izin: 'bg-sky-100 text-sky-700',
  Alpa: 'bg-rose-100 text-rose-700',
}

export default function RiwayatPage() {
  const { kehadiran } = useData()
  const [filterKelas, setFilterKelas] = useState('Semua')
  const [cari, setCari] = useState('')
  const [detailTanggal, setDetailTanggal] = useState(null) // "YYYY-MM-DD"

  /** Grup baris kehadiran per tanggal (+kelas). */
  const riwayat = useMemo(() => {
    const q = cari.trim().toLowerCase()
    const map = new Map()
    for (const k of kehadiran) {
      if (filterKelas !== 'Semua' && k.Kelas !== filterKelas) continue
      if (q && !String(k.Nama || '').toLowerCase().includes(q)) continue
      const key = `${k.Tanggal}|${k.Kelas}`
      if (!map.has(key)) {
        map.set(key, {
          Tanggal: k.Tanggal,
          Kelas: k.Kelas,
          rows: [],
          Hadir: 0,
          Sakit: 0,
          Izin: 0,
          Alpa: 0,
        })
      }
      const g = map.get(key)
      g.rows.push(k)
      if (g[k.Status] !== undefined) g[k.Status] += 1
    }
    return [...map.values()].sort((a, b) =>
      a.Tanggal === b.Tanggal
        ? String(b.Kelas).localeCompare(String(a.Kelas))
        : a.Tanggal < b.Tanggal
          ? 1
          : -1,
    )
  }, [kehadiran, filterKelas, cari])

  const totalKehadiran = kehadiran.length

  /** Rekap total per status untuk kelas terpilih. */
  const rekap = useMemo(() => {
    const c = { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 }
    for (const k of kehadiran) {
      if (filterKelas !== 'Semua' && k.Kelas !== filterKelas) continue
      if (c[k.Status] !== undefined) c[k.Status] += 1
    }
    return c
  }, [kehadiran, filterKelas])

  /** Baris detail (sudah terfilter) untuk tanggal yang dibuka di modal. */
  const detailRows = useMemo(() => {
    if (!detailTanggal) return []
    return kehadiran
      .filter((k) => k.Tanggal === detailTanggal && (filterKelas === 'Semua' || k.Kelas === filterKelas))
      .sort((a, b) => String(a.Nama).localeCompare(String(b.Nama)))
  }, [kehadiran, detailTanggal, filterKelas])

  const jumlahTanggal = useMemo(
    () => new Set(kehadiran.map((k) => k.Tanggal)).size,
    [kehadiran],
  )

  return (
    <div className="space-y-5">
      {/* Kartu ringkasan */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Baris Absensi</p>
          <p className="mt-1 text-3xl font-extrabold text-primary-700">{totalKehadiran}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hari Absensi</p>
          <p className="mt-1 text-3xl font-extrabold text-emerald-600">{jumlahTanggal}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sakit + Izin</p>
          <p className="mt-1 text-3xl font-extrabold text-amber-500">{rekap.Sakit + rekap.Izin}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Alpa</p>
          <p className="mt-1 text-3xl font-extrabold text-rose-500">{rekap.Alpa}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama siswa..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <select
          value={filterKelas}
          onChange={(e) => setFilterKelas(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        >
          <option value="Semua">Semua Kelas</option>
          {KELAS_LIST.map((k) => (
            <option key={k} value={k}>
              Kelas {k}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400 sm:ml-auto">
          {riwayat.length} sesi absensi ditemukan
        </span>
      </div>

      {/* Daftar riwayat per tanggal & kelas */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-primary-50/60">
              <tr>
                {['Tanggal', 'Kelas', 'Hadir', 'Sakit', 'Izin', 'Alpa', 'Total', 'Aksi'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-primary-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {riwayat.map((g) => (
                <tr key={`${g.Tanggal}|${g.Kelas}`} className="transition hover:bg-primary-50/40">
                  <td className="px-4 py-3 font-semibold text-slate-700">{tanggalIndo(g.Tanggal)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-lg bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700">
                      Kelas {g.Kelas}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE.Hadir}`}>{g.Hadir}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE.Sakit}`}>{g.Sakit}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE.Izin}`}>{g.Izin}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE.Alpa}`}>{g.Alpa}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-500">{g.rows.length}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDetailTanggal(g.Tanggal)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-primary-600 transition hover:bg-primary-50"
                    >
                      Lihat Detail
                    </button>
                  </td>
                </tr>
              ))}
              {riwayat.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    {kehadiran.length === 0
                      ? 'Belum ada riwayat absensi. Input absensi terlebih dahulu di menu Daftar Hadir.'
                      : 'Tidak ada riwayat yang cocok dengan filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-500">
          Menampilkan {riwayat.length} sesi absensi (per tanggal & kelas) · Sumber: sheet "Kehadiran" di file Excel
        </div>
      </div>

      {/* Modal detail satu tanggal */}
      <Modal
        open={!!detailTanggal}
        onClose={() => setDetailTanggal(null)}
        title={`Detail Absensi — ${detailTanggal ? tanggalIndo(detailTanggal) : ''}`}
        subtitle={filterKelas === 'Semua' ? 'Semua kelas pada tanggal ini' : `Kelas ${filterKelas}`}
        wide
      >
        <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="sticky top-0 bg-slate-50">
              <tr>
                {['No', 'Nama', 'Kelas', 'Status', 'Catatan'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detailRows.map((k, i) => (
                <tr key={k.id || i}>
                  <td className="px-3 py-2 text-xs text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2 font-semibold text-slate-700">{k.Nama}</td>
                  <td className="px-3 py-2 text-slate-500">{k.Kelas}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[k.Status] || 'bg-slate-100 text-slate-500'}`}>
                      {k.Status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">{k.Catatan || '-'}</td>
                </tr>
              ))}
              {detailRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                    Tidak ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setDetailTanggal(null)}
            className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition hover:bg-primary-700"
          >
            Tutup
          </button>
        </div>
      </Modal>
    </div>
  )
}
