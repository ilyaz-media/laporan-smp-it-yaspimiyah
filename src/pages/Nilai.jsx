import React, { useMemo, useState } from 'react'
import { useData } from '../context/DataContext.jsx'
import Modal from '../components/Modal.jsx'
import { Input, Select, Field } from '../components/FormControls.jsx'
import { JENIS_NILAI, KELAS_LIST } from '../lib/constants.js'

const EMPTY_FORM = {
  Nama: '',
  Kelas: '7',
  MataPelajaran: '',
  Jenis: 'Ulangan Harian',
  Nilai: '',
}

/** Kunci penghubung data nilai ke siswa: Nama + Kelas. */
const kunciSiswa = (s) => `${String(s?.Nama || '').trim().toLowerCase()}|${String(s?.Kelas || '').trim()}`

export default function NilaiPage() {
  const { siswa, nilai, mapel, addNilai, updateNilai, deleteNilai } = useData()
  const [filterKelas, setFilterKelas] = useState('Semua')
  const [filterMapel, setFilterMapel] = useState('Semua')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [pilihSiswa, setPilihSiswa] = useState('')
  const [error, setError] = useState('')

  const daftarMapel = useMemo(() => mapel.map((m) => m.Nama), [mapel])

  /** Siswa sesuai kelas yang dipilih di modal input (terfilter + terurut abjad). */
  const siswaKelasModal = useMemo(
    () =>
      siswa
        .filter((s) => s.Kelas === form.Kelas)
        .sort((a, b) => String(a.Nama).localeCompare(String(b.Nama))),
    [siswa, form.Kelas],
  )

  const filtered = useMemo(() => {
    return nilai.filter((n) => {
      const cocokKelas = filterKelas === 'Semua' || n.Kelas === filterKelas
      const cocokMapel = filterMapel === 'Semua' || n.MataPelajaran === filterMapel
      return cocokKelas && cocokMapel
    })
  }, [nilai, filterKelas, filterMapel])

  const rekapSiswa = useMemo(() => {
    const map = new Map()
    siswa.forEach((s) => {
      map.set(kunciSiswa(s), { Nama: s.Nama, Kelas: s.Kelas, nilai: [] })
    })
    filtered.forEach((n) => {
      const row = map.get(kunciSiswa(n))
      if (row) row.nilai.push(Number(n.Nilai) || 0)
    })
    return [...map.values()]
      .map((r) => ({
        ...r,
        jumlah: r.nilai.length,
        rata: r.nilai.length ? (r.nilai.reduce((a, b) => a + b, 0) / r.nilai.length).toFixed(1) : null,
      }))
      .filter((r) => r.jumlah > 0)
      .sort((a, b) => a.Kelas.localeCompare(b.Kelas) || a.Nama.localeCompare(b.Nama))
  }, [siswa, filtered])

  function bukaTambah() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, MataPelajaran: daftarMapel[0] || '' })
    setPilihSiswa('')
    setError('')
    setModalOpen(true)
  }

  function bukaEdit(n) {
    setEditing(n)
    setForm({ ...EMPTY_FORM, ...n })
    setError('')
    setModalOpen(true)
  }

  function handleSiswaChange(id) {
    setPilihSiswa(id)
    const s = siswa.find((x) => x.id === id)
    if (s) {
      setForm((f) => ({ ...f, Nama: s.Nama, Kelas: s.Kelas }))
    }
  }

  /** Ganti kelas di modal input -> reset pilihan siswa agar terfilter ulang. */
  function handleKelasChange(k) {
    setForm((f) => ({ ...f, Kelas: k, Nama: '' }))
    setPilihSiswa('')
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const angka = Number(form.Nilai)
    if (form.Nilai === '' || Number.isNaN(angka) || angka < 0 || angka > 100) {
      setError('Nilai harus berupa angka antara 0 - 100.')
      return
    }
    if (editing) {
      updateNilai(editing.id, { ...form, Nilai: angka })
    } else {
      addNilai([{ ...form, Nilai: angka }])
    }
    setModalOpen(false)
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          >
            <option value="Semua">Semua Kelas</option>
            {[...new Set(siswa.map((s) => s.Kelas))].map((k) => (
              <option key={k} value={k}>
                Kelas {k}
              </option>
            ))}
          </select>
          <select
            value={filterMapel}
            onChange={(e) => setFilterMapel(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          >
            <option value="Semua">Semua Mapel</option>
            {daftarMapel.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={bukaTambah}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition hover:bg-primary-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Input Nilai
        </button>
      </div>

      {/* Tabel entri nilai */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-primary-50/60">
              <tr>
                {['Nama', 'Kelas', 'Mata Pelajaran', 'Jenis', 'Nilai', 'Aksi'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-primary-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((n) => {
                const tuntas = Number(n.Nilai) >= 75
                return (
                  <tr key={n.id} className="transition hover:bg-primary-50/40">
                    <td className="px-4 py-3 font-semibold text-slate-700">{n.Nama}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-lg bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700">{n.Kelas}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{n.MataPelajaran}</td>
                    <td className="px-4 py-3 text-slate-500">{n.Jenis}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                          tuntas ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {n.Nilai}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => bukaEdit(n)}
                          className="rounded-lg p-2 text-primary-600 transition hover:bg-primary-50"
                          title="Edit"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteNilai(n.id)}
                          className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50"
                          title="Hapus"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    Belum ada data nilai. Klik "Input Nilai" untuk menambahkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-500">
          {filtered.length} entri nilai · Tersinkron ke sheet "Nilai" di file Excel
        </div>
      </div>

      {/* Rekap rata-rata per siswa */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800">Rekap Rata-rata per Siswa</h3>
        <p className="text-xs text-slate-500">Sesuai filter aktif · tuntas jika rata-rata ≥ 75</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4">Nama</th>
                <th className="py-2 pr-4">Kelas</th>
                <th className="py-2 pr-4">Jumlah Nilai</th>
                <th className="py-2 pr-4">Rata-rata</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rekapSiswa.map((r) => (
                <tr key={`${r.Nama}|${r.Kelas}`}>
                  <td className="py-2.5 pr-4 font-semibold text-slate-700">{r.Nama}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{r.Kelas}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{r.jumlah}</td>
                  <td className="py-2.5 pr-4 font-bold text-primary-700">{r.rata}</td>
                  <td className="py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        r.rata >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {r.rata >= 75 ? 'Tuntas' : 'Belum Tuntas'}
                    </span>
                  </td>
                </tr>
              ))}
              {rekapSiswa.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada data untuk direkap.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal input/edit nilai */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Nilai' : 'Input Nilai Siswa'}
        subtitle="Nilai akan tersimpan ke sheet Nilai pada file Excel"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editing && (
            <>
              <Field label="Kelas">
                <select
                  value={form.Kelas}
                  onChange={(e) => handleKelasChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100"
                >
                  {KELAS_LIST.map((k) => (
                    <option key={k} value={k}>
                      Kelas {k}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Pilih Siswa">
                <select
                  value={pilihSiswa}
                  onChange={(e) => handleSiswaChange(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100"
                >
                  <option value="">— Pilih siswa —</option>
                  {siswaKelasModal.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.Nama}
                    </option>
                  ))}
                  {siswaKelasModal.length === 0 && <option value="">(Tidak ada siswa di kelas ini)</option>}
                </select>
              </Field>
            </>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Mata Pelajaran" name="MataPelajaran" value={form.MataPelajaran} onChange={handleChange} options={daftarMapel} required />
            <Select label="Jenis Penilaian" name="Jenis" value={form.Jenis} onChange={handleChange} options={JENIS_NILAI} />
            <Input label="Nilai (0-100)" name="Nilai" type="number" min="0" max="100" value={form.Nilai} onChange={handleChange} required />
          </div>
          {error && <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">{error}</p>}
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
              {editing ? 'Simpan Perubahan' : 'Simpan Nilai'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
