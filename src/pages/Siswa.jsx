import React, { useMemo, useRef, useState } from 'react'
import { useData } from '../context/DataContext.jsx'
import Modal from '../components/Modal.jsx'
import { Input, Select } from '../components/FormControls.jsx'
import { KELAS_LIST } from '../lib/constants.js'
import { readWorkbookFromFile, parseSiswaWorkbook, downloadTemplateSiswa } from '../lib/excelDB.js'
import { toast } from '../context/DataContext.jsx'

const EMPTY_FORM = {
  Nama: '',
  JenisKelamin: 'L',
  Kelas: '7',
}

export default function SiswaPage() {
  const { siswa, addSiswa, updateSiswa, deleteSiswa, importSiswa } = useData()
  const [cari, setCari] = useState('')
  const [filterKelas, setFilterKelas] = useState('Semua')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null) // objek siswa yang sedang diedit
  const [form, setForm] = useState(EMPTY_FORM)
  const [hapusTarget, setHapusTarget] = useState(null)

  /* Impor Excel */
  const fileInputRef = useRef(null)
  const [imporOpen, setImporOpen] = useState(false)
  const [imporPreview, setImporPreview] = useState(null) // { rows, fileName }
  const [imporError, setImporError] = useState('')
  const [imporLoading, setImporLoading] = useState(false)

  const filtered = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return siswa.filter((s) => {
      const cocokKelas = filterKelas === 'Semua' || s.Kelas === filterKelas
      const cocokCari = !q || String(s.Nama).toLowerCase().includes(q)
      return cocokKelas && cocokCari
    })
  }, [siswa, cari, filterKelas])

  function bukaTambah() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function bukaEdit(s) {
    setEditing(s)
    setForm({ ...EMPTY_FORM, ...s })
    setModalOpen(true)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (editing) {
      updateSiswa(editing.id, form)
    } else {
      addSiswa(form)
    }
    setModalOpen(false)
  }

  function bukaImpor() {
    setImporPreview(null)
    setImporError('')
    setImporOpen(true)
  }

  function tutupImpor() {
    setImporOpen(false)
    setImporPreview(null)
    setImporError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleFilePilih(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporError('')
    setImporPreview(null)
    setImporLoading(true)
    try {
      const wb = await readWorkbookFromFile(file)
      const rows = parseSiswaWorkbook(wb)
      if (rows.length === 0) {
        setImporError(
          'Tidak ada data siswa yang terbaca. Pastikan file memiliki kolom "Nama" (beserta "JenisKelamin" dan "Kelas") pada baris pertama.',
        )
      } else {
        setImporPreview({ rows, fileName: file.name })
      }
    } catch {
      setImporError('Gagal membaca file. Gunakan file Excel (.xlsx / .xls) yang valid.')
    } finally {
      setImporLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleImporSubmit() {
    if (!imporPreview) return
    const res = importSiswa(imporPreview.rows)
    tutupImpor()
    if (res.ditambahkan > 0) {
      toast(
        res.duplikat > 0
          ? `${res.ditambahkan} siswa diimpor & tersimpan ke Excel. ${res.duplikat} baris duplikat dilewati.`
          : `${res.ditambahkan} siswa diimpor & tersimpan ke Excel.`,
        'success',
        'Impor Berhasil',
      )
    } else {
      toast('Tidak ada siswa baru — semua baris sudah ada di data.', 'info', 'Tidak Ada Data Baru')
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
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
        </div>
        <div className="flex gap-3">
          <button
            onClick={bukaImpor}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            Impor Excel
          </button>
          <button
            onClick={bukaTambah}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition hover:bg-primary-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-primary-50/60">
              <tr>
                {['Nama', 'JK', 'Kelas', 'Aksi'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-primary-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="transition hover:bg-primary-50/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                        {(s.Nama || '?').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">{s.Nama}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        s.JenisKelamin === 'L' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'
                      }`}
                    >
                      {s.JenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-lg bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700">
                      {s.Kelas}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => bukaEdit(s)}
                        className="rounded-lg p-2 text-primary-600 transition hover:bg-primary-50"
                        title="Edit"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setHapusTarget(s)}
                        className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50"
                        title="Hapus"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                    {siswa.length === 0 ? 'Belum ada data siswa. Klik "Tambah Siswa" untuk memulai.' : 'Tidak ada siswa yang cocok dengan pencarian.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-500">
          Menampilkan {filtered.length} dari {siswa.length} siswa · Tersinkron ke sheet "Siswa" di file Excel
        </div>
      </div>

      {/* Modal tambah/edit */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
        subtitle="Data akan langsung tersimpan ke sheet Siswa pada file Excel"
        wide
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Nama Lengkap" name="Nama" value={form.Nama} onChange={handleChange} required placeholder="Nama siswa" />
            <Select label="Jenis Kelamin" name="JenisKelamin" value={form.JenisKelamin} onChange={handleChange} options={['L', 'P']} />
            <Select label="Kelas" name="Kelas" value={form.Kelas} onChange={handleChange} options={KELAS_LIST} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition hover:bg-primary-700"
            >
              {editing ? 'Simpan Perubahan' : 'Tambah Siswa'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal impor Excel */}
      <Modal
        open={imporOpen}
        onClose={tutupImpor}
        title="Impor Data Siswa dari Excel"
        subtitle="Unggah file .xlsx / .xls berisi daftar siswa"
        wide
      >
        <div className="space-y-4">
          {/* Petunjuk format */}
          <div className="rounded-xl border border-primary-100 bg-primary-50/60 p-4">
            <p className="text-sm font-bold text-primary-800">Format file Excel</p>
            <p className="mt-1 text-sm text-primary-700">
              Baris pertama harus berisi header kolom <span className="font-mono font-semibold">Nama</span>,{' '}
              <span className="font-mono font-semibold">JenisKelamin</span> (L/P), dan{' '}
              <span className="font-mono font-semibold">Kelas</span> (7/8/9). Baris berikutnya berisi data siswa.
            </p>
            <button
              onClick={downloadTemplateSiswa}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 shadow-sm transition hover:bg-primary-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Unduh Template Excel
            </button>
          </div>

          {/* Area unggah */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFilePilih}
            className="hidden"
          />
          {!imporPreview && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={imporLoading}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-4 py-10 text-center transition hover:border-primary-400 hover:bg-primary-50/40 disabled:opacity-50"
            >
              <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-sm font-semibold text-slate-600">
                {imporLoading ? 'Membaca file...' : 'Klik untuk pilih file Excel'}
              </span>
              <span className="text-xs text-slate-400">Format yang didukung: .xlsx, .xls</span>
            </button>
          )}

          {/* Pesan error */}
          {imporError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <svg className="h-5 w-5 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c.866 1.5 2.25 2.5 3.606 2.5h11.394c1.357 0 2.74-1 3.606-2.5l.742-1.285a3 3 0 000-2.5l-5.697-9.866a3 3 0 00-5.196 0l-5.697 9.866a3 3 0 000 2.5l.742 1.285zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-sm text-rose-700">{imporError}</p>
            </div>
          )}

          {/* Preview data terbaca */}
          {imporPreview && (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                <svg className="h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-emerald-700">
                  <span className="font-bold">{imporPreview.rows.length} siswa</span> terbaca dari{' '}
                  <span className="font-semibold">{imporPreview.fileName}</span>.
                </p>
              </div>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      {['Nama', 'JK', 'Kelas'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {imporPreview.rows.map((s, i) => (
                      <tr key={i} className="transition hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-700">{s.Nama}</td>
                        <td className="px-3 py-2 text-slate-500">{s.JenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                        <td className="px-3 py-2 text-slate-500">{s.Kelas}</td>
                      </tr>
                    ))}
                  </tbody>
                  {imporPreview.rows.length > 8 && (
                    <tfoot className="-mt-px">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-center text-xs text-slate-400">
                          Menampilkan 8 baris pertama dari {imporPreview.rows.length} siswa
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => {
                    setImporPreview(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
                >
                  Ganti File
                </button>
                <button
                  onClick={handleImporSubmit}
                  className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition hover:bg-primary-700"
                >
                  Impor {imporPreview.rows.length} Siswa
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Konfirmasi hapus */}
      <Modal open={!!hapusTarget} onClose={() => setHapusTarget(null)} title="Hapus Data Siswa">
        <p className="text-sm text-slate-600">
          Yakin ingin menghapus data <span className="font-bold text-slate-800">{hapusTarget?.Nama}</span>? Tindakan ini akan
          menghapus baris tersebut dari sheet "Siswa" di file Excel.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setHapusTarget(null)}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            onClick={() => {
              deleteSiswa(hapusTarget.id)
              setHapusTarget(null)
            }}
            className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-700"
          >
            Ya, Hapus
          </button>
        </div>
      </Modal>


    </div>
  )
}
