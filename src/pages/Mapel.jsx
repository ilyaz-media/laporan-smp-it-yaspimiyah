import React, { useState } from 'react'
import { useData } from '../context/DataContext.jsx'
import Modal from '../components/Modal.jsx'
import { Input } from '../components/FormControls.jsx'

const EMPTY_FORM = { Kode: '', Nama: '', KKM: 75, Guru: '' }

export default function MapelPage() {
  const { mapel, nilai, addMapel, updateMapel, deleteMapel } = useData()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [hapusTarget, setHapusTarget] = useState(null)

  function bukaTambah() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function bukaEdit(m) {
    setEditing(m)
    setForm({ ...EMPTY_FORM, ...m })
    setModalOpen(true)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const data = { ...form, KKM: Number(form.KKM) || 75 }
    if (editing) {
      updateMapel(editing.id, data)
    } else {
      addMapel(data)
    }
    setModalOpen(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          onClick={bukaTambah}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition hover:bg-primary-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Mapel
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {mapel.map((m) => {
          const entriNilai = nilai.filter((n) => n.MataPelajaran === m.Nama)
          const rata = entriNilai.length
            ? (entriNilai.reduce((a, n) => a + (Number(n.Nilai) || 0), 0) / entriNilai.length).toFixed(1)
            : null
          return (
            <div
              key={m.id}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary-300 hover:shadow-lg hover:shadow-primary-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15h.008v.008H6.75V15z" />
                  </svg>
                </div>
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => bukaEdit(m)}
                    className="rounded-lg p-2 text-primary-600 transition hover:bg-primary-50"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setHapusTarget(m)}
                    className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50"
                    title="Hapus"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
              <h3 className="mt-3 font-bold text-slate-800">{m.Nama}</h3>
              <p className="text-xs text-slate-400">Kode: {m.Kode || '—'}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 py-2">
                  <p className="text-lg font-bold text-primary-700">{m.KKM}</p>
                  <p className="text-[10px] font-semibold uppercase text-slate-400">KKM</p>
                </div>
                <div className="rounded-xl bg-slate-50 py-2">
                  <p className="text-lg font-bold text-slate-700">{entriNilai.length}</p>
                  <p className="text-[10px] font-semibold uppercase text-slate-400">Entri</p>
                </div>
                <div className="rounded-xl bg-slate-50 py-2">
                  <p className={`text-lg font-bold ${rata && Number(rata) >= m.KKM ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {rata ?? '—'}
                  </p>
                  <p className="text-[10px] font-semibold uppercase text-slate-400">Rata²</p>
                </div>
              </div>
              {m.Guru && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  {m.Guru}
                </p>
              )}
            </div>
          )
        })}
        {mapel.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
            <p className="text-sm text-slate-400">Belum ada mata pelajaran. Klik "Tambah Mapel" untuk memulai.</p>
          </div>
        )}
      </div>

      {/* Modal tambah/edit */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
        subtitle="Tersimpan ke sheet MataPelajaran pada file Excel"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Kode Mapel" name="Kode" value={form.Kode} onChange={handleChange} required placeholder="cth: MAT" />
            <Input label="Nama Mapel" name="Nama" value={form.Nama} onChange={handleChange} required placeholder="cth: Matematika" />
            <Input label="KKM" name="KKM" type="number" min="0" max="100" value={form.KKM} onChange={handleChange} required />
            <Input label="Guru Pengampu" name="Guru" value={form.Guru} onChange={handleChange} placeholder="opsional" />
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
              {editing ? 'Simpan Perubahan' : 'Tambah Mapel'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Konfirmasi hapus */}
      <Modal open={!!hapusTarget} onClose={() => setHapusTarget(null)} title="Hapus Mata Pelajaran">
        <p className="text-sm text-slate-600">
          Yakin ingin menghapus mapel <span className="font-bold text-slate-800">{hapusTarget?.Nama}</span>? Entri nilai
          terkait mapel ini tetap ada di sheet Nilai.
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
              deleteMapel(hapusTarget.id)
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
