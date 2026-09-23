import React, { useRef, useState } from 'react'
import { useData } from '../context/DataContext.jsx'
import Modal from '../components/Modal.jsx'

export default function PengaturanPage() {
  const {
    fileStatus,
    lastSaved,
    siswa,
    kehadiran,
    nilai,
    mapel,
    backupData,
    restoreData,
    resetAllData,
    gantiBulan,
  } = useData()

  const [restoreOpen, setRestoreOpen] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [konfirmasiCentang, setKonfirmasiCentang] = useState(false)
  const [gantiBulanOpen, setGantiBulanOpen] = useState(false)
  const backupInputRef = useRef(null)

  const totalData = siswa.length + kehadiran.length + nilai.length + mapel.length

  return (
    <div className="space-y-6">
      {/* Info penyimpanan */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800">Penyimpanan</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mode</p>
            <p className="mt-1 text-sm font-bold text-slate-700">{fileStatus.label}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">File Database</p>
            <p className="mt-1 truncate text-sm font-bold text-slate-700">{fileStatus.fileName || 'database-yaspimiyah.xlsx'}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Terakhir Disimpan</p>
            <p className="mt-1 text-sm font-bold text-slate-700">
              {lastSaved ? lastSaved.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Data</p>
            <p className="mt-1 text-sm font-bold text-slate-700">{totalData} baris</p>
          </div>
        </div>
      </div>

      {/* Backup & Pulihkan */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75v6l3.75-2.25L16.5 12m.75 7.5a9 9 0 11-9-9 9 9 0 019 9z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Backup Data</h3>
              <p className="mt-1 text-sm text-slate-500">
                Unduh salinan seluruh data ke file Excel: {siswa.length} siswa, {kehadiran.length} absensi, {nilai.length} nilai, dan {mapel.length} mapel.
              </p>
            </div>
          </div>
          <button
            onClick={backupData}
            disabled={totalData === 0}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Unduh Backup Sekarang
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M2.985 14.652L6.166 11.47a8.25 8.25 0 0113.803 3.7" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Pulihkan Data</h3>
              <p className="mt-1 text-sm text-slate-500">
                Gunakan kembali data dari file backup. Seluruh data aktif akan diganti dengan isi file backup.
              </p>
            </div>
          </div>
          <button
            onClick={() => setRestoreOpen(true)}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-5 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Pilih File Backup (.xlsx)
          </button>
        </div>
      </div>

      {/* Ganti bulan */}
      <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Ganti Bulan</h3>
            <p className="mt-1 text-sm text-slate-500">
              Untuk awal bulan baru: mengosongkan riwayat absensi ({kehadiran.length} baris) dan daftar nilai ({nilai.length} entri).
              Data siswa dan mata pelajaran <span className="font-semibold">tetap tersimpan</span>.
            </p>
          </div>
        </div>
        <button
          onClick={() => setGantiBulanOpen(true)}
          disabled={kehadiran.length + nilai.length === 0}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M2.985 14.652L6.166 11.47a8.25 8.25 0 0113.803 3.7" />
          </svg>
          Ganti Bulan (Kosongkan Absensi & Nilai)
        </button>
      </div>

      {/* Zona bahaya: Reset seluruh data */}
      <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Reset Seluruh Data</h3>
            <p className="mt-1 text-sm text-slate-500">
              Mengosongkan permanen semua data siswa, riwayat absensi, dan daftar nilai dari file Excel.
              Daftar mata pelajaran tetap tersimpan.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setKonfirmasiCentang(false)
            setResetOpen(true)
          }}
          disabled={totalData === 0}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M2.985 14.652L6.166 11.47a8.25 8.25 0 0113.803 3.7" />
          </svg>
          Reset Semua Data (Siswa, Absensi, Nilai)
        </button>
      </div>

      {/* Modal ganti bulan */}
      <Modal
        open={gantiBulanOpen}
        onClose={() => setGantiBulanOpen(false)}
        title="Ganti Bulan?"
        subtitle="Awali bulan baru dengan absensi & nilai yang kosong"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <svg className="h-6 w-6 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c.866 1.5 2.25 2.5 3.606 2.5h11.394c1.357 0 2.74-1 3.606-2.5l.742-1.285a3 3 0 000-2.5l-5.697-9.866a3 3 0 00-5.196 0l-5.697 9.866a3 3 0 000 2.5l.742 1.285zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-amber-700">Yang akan dikosongkan</p>
              <ul className="mt-1 list-inside list-disc text-sm text-amber-600">
                <li>Riwayat absensi: {kehadiran.length} baris</li>
                <li>Daftar nilai: {nilai.length} entri</li>
              </ul>
            </div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-sm font-bold text-emerald-700">Yang tetap tersimpan</p>
            <ul className="mt-1 list-inside list-disc text-sm text-emerald-600">
              <li>Data siswa: {siswa.length} siswa</li>
              <li>Mata pelajaran: {mapel.length} mapel</li>
            </ul>
          </div>
          <p className="text-xs text-slate-400">
            Tips: unduh backup terlebih dahulu di atas jika rekap bulan ini masih diperlukan.
          </p>
          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={() => setGantiBulanOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              onClick={() => {
                gantiBulan()
                setGantiBulanOpen(false)
              }}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-600"
            >
              Ya, Ganti Bulan
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal pulihkan dari backup */}
      <Modal
        open={restoreOpen}
        onClose={() => !restoring && setRestoreOpen(false)}
        title="Pulihkan Data dari Backup"
        subtitle="Isi file backup akan MENGGANTIKAN seluruh data aktif saat ini"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <svg className="h-6 w-6 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c.866 1.5 2.25 2.5 3.606 2.5h11.394c1.357 0 2.74-1 3.606-2.5l.742-1.285a3 3 0 000-2.5l-5.697-9.866a3 3 0 00-5.196 0l-5.697 9.866a3 3 0 000 2.5l.742 1.285zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-amber-700">Perhatian</p>
              <p className="mt-1 text-sm text-amber-600">
                Data aktif saat ini ({siswa.length} siswa, {kehadiran.length} absensi, {nilai.length} nilai, {mapel.length} mapel)
                akan ditimpa sepenuhnya oleh isi file backup.
              </p>
            </div>
          </div>
          <input
            ref={backupInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setRestoring(true)
              await restoreData(file)
              setRestoring(false)
              setRestoreOpen(false)
              if (backupInputRef.current) backupInputRef.current.value = ''
            }}
          />
          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={() => setRestoreOpen(false)}
              disabled={restoring}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={() => backupInputRef.current?.click()}
              disabled={restoring}
              className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition hover:bg-primary-700 disabled:opacity-50"
            >
              {restoring ? 'Memulihkan...' : 'Pilih File Backup (.xlsx)'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal reset seluruh data */}
      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Hapus Semua Data?"
        subtitle={`Tindakan ini akan mereset ${siswa.length} data siswa, ${nilai.length} data nilai, dan ${kehadiran.length} data kehadiran sekaligus`}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <svg className="h-6 w-6 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c.866 1.5 2.25 2.5 3.606 2.5h11.394c1.357 0 2.74-1 3.606-2.5l.742-1.285a3 3 0 000-2.5l-5.697-9.866a3 3 0 00-5.196 0l-5.697 9.866a3 3 0 000 2.5l.742 1.285zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-rose-700">Tindakan ini tidak dapat dibatalkan</p>
              <p className="mt-1 text-sm text-rose-600">
                Seluruh data siswa, data nilai, dan data kehadiran pada file Excel akan dikosongkan permanen.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Himbauan sebelum melanjutkan:</p>
            <ul className="mt-2.5 space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary-600">1.</span>
                Unduh terlebih dahulu backup melalui tombol <span className="font-semibold">Unduh Backup Sekarang</span> di atas sebagai cadangan.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary-600">2.</span>
                Pastikan data yang dihapus benar-benar tidak diperlukan lagi — seluruh rekap presensi dan rekap nilai ikut terhapus.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary-600">3.</span>
                Yang dihapus: sheet "Siswa", "Nilai", dan "Kehadiran". Daftar <span className="font-semibold">Mata Pelajaran</span> tetap tersimpan.
              </li>
            </ul>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
            <input
              type="checkbox"
              checked={konfirmasiCentang}
              onChange={(e) => setKonfirmasiCentang(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-rose-600"
            />
            <span className="text-sm text-slate-600">
              Saya sudah memahami risikonya dan <span className="font-bold text-slate-800">yakin</span> ingin menghapus seluruh data siswa, nilai, dan kehadiran.
            </span>
          </label>

          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={() => setResetOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              onClick={() => {
                resetAllData()
                setKonfirmasiCentang(false)
                setResetOpen(false)
              }}
              disabled={!konfirmasiCentang}
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Ya, Reset Semua Data
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
