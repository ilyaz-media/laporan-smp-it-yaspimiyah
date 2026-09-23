import React, { useMemo, useState } from 'react'
import { useData, toast } from '../context/DataContext.jsx'
import { Select } from '../components/FormControls.jsx'
import { KELAS_LIST, STATUS_HADIR, tanggalIndo, todayISO } from '../lib/constants.js'

const STATUS_STYLE = {
  Hadir: 'bg-emerald-100 text-emerald-700',
  Sakit: 'bg-amber-100 text-amber-700',
  Izin: 'bg-sky-100 text-sky-700',
  Alpa: 'bg-rose-100 text-rose-700',
}

const STATUS_HEX = {
  Hadir: '#10b981',
  Sakit: '#f59e0b',
  Izin: '#0ea5e9',
  Alpa: '#f43f5e',
}

export default function HadirPage() {
  const { siswa, kehadiran, replaceKehadiranHarian, deleteKehadiran } = useData()
  const [tanggal, setTanggal] = useState(todayISO())
  const [kelas, setKelas] = useState('7')
  const [statuses, setStatuses] = useState({}) // idSiswa -> status
  const [tersimpanKey, setTersimpanKey] = useState(null) // "tanggal|kelas" yang baru saja disimpan

  const siswaKelas = useMemo(() => siswa.filter((s) => s.Kelas === kelas), [siswa, kelas])

  const sudahAbsen = useMemo(
    () => kehadiran.filter((k) => k.Tanggal === tanggal && k.Kelas === kelas),
    [kehadiran, tanggal, kelas],
  )

  // Status tersimpan per nama siswa (untuk tampilan mode "sudah diabsen")
  const statusTersimpan = useMemo(() => {
    const map = {}
    sudahAbsen.forEach((k) => {
      map[k.Nama] = k.Status
    })
    return map
  }, [sudahAbsen])

  // Mode "sudah diabsen": kunci cocok dengan tanggal+kelas aktif DAN datanya masih ada
  // (kalau riwayatnya dihapus, otomatis kembali ke mode input)
  const kunciAktif = `${tanggal}|${kelas}`
  const tersimpan = tersimpanKey === kunciAktif && sudahAbsen.length > 0

  // Ganti tanggal/kelas -> kembali ke setelan "belum diabsen"
  React.useEffect(() => {
    setTersimpanKey(null)
  }, [tanggal, kelas])

  const rekapHari = useMemo(() => {
    const counters = { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 }
    sudahAbsen.forEach((k) => {
      if (counters[k.Status] !== undefined) counters[k.Status] += 1
    })
    return counters
  }, [sudahAbsen])

  const riwayatTanggal = useMemo(() => {
    const map = new Map()
    kehadiran.forEach((k) => {
      const key = `${k.Tanggal}|${k.Kelas}`
      if (!map.has(key)) {
        map.set(key, { Tanggal: k.Tanggal, Kelas: k.Kelas, Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 })
      }
      const row = map.get(key)
      if (row[k.Status] !== undefined) row[k.Status] += 1
    })
    return [...map.values()].sort((a, b) => (a.Tanggal < b.Tanggal ? 1 : -1)).slice(0, 7)
  }, [kehadiran])

  React.useEffect(() => {
    const next = {}
    siswaKelas.forEach((s) => {
      next[s.id] = 'Hadir'
    })
    setStatuses(next)
  }, [kelas, tanggal, siswaKelas.length]) // eslint-disable-line react-hooks/exhaustive-deps

  function setSemua(status) {
    const next = {}
    siswaKelas.forEach((s) => (next[s.id] = status))
    setStatuses(next)
  }

  function simpan() {
    if (siswaKelas.length === 0) return
    const rows = siswaKelas.map((s) => ({
      Tanggal: tanggal,
      Nama: s.Nama,
      Kelas: kelas,
      Status: statuses[s.id] || 'Hadir',
      Catatan: '',
    }))
    // Timpa absensi lama tanggal+kelas yang sama (tanpa duplikat), lalu
    // tersimpan ke file Excel/localStorage sebagai riwayat yang ikut ke laporan.
    replaceKehadiranHarian(
      rows,
      `Absensi Kelas ${kelas} (${tanggalIndo(tanggal)}) tersimpan & masuk ke data laporan.`,
    )
    setTersimpanKey(`${tanggal}|${kelas}`)
  }

  /** Kembali ke mode input, status terisi dari data yang sudah tersimpan. */
  function editAbsensi() {
    const next = {}
    siswaKelas.forEach((s) => {
      next[s.id] = statusTersimpan[s.Nama] || 'Hadir'
    })
    setStatuses(next)
    setTersimpanKey(null)
  }

  return (
    <div className="space-y-5">
      {/* Panel kontrol */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tanggal Absensi</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <Select label="Pilih Kelas" name="kelas" value={kelas} onChange={(e) => setKelas(e.target.value)} options={KELAS_LIST} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Tandai semua:</span>
          {STATUS_HADIR.map((s) => (
            <button
              key={s}
              onClick={() => setSemua(s)}
              disabled={tersimpan}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: STATUS_HEX[s] }}
            >
              {s}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-400">
            {tersimpan
              ? `✓ Absensi ${sudahAbsen.length} siswa tersimpan & masuk ke data laporan`
              : sudahAbsen.length > 0
                ? `${sudahAbsen.length} siswa sudah diabsen untuk tanggal & kelas ini`
                : 'Belum ada absensi untuk tanggal & kelas ini'}
          </span>
        </div>
      </div>

      {/* Daftar siswa untuk diabsen */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="font-bold text-slate-800">
              Absensi Kelas {kelas} — {tanggalIndo(tanggal)}
            </h3>
            <p className="text-xs text-slate-500">{siswaKelas.length} siswa terdaftar</p>
          </div>
          {tersimpan ? (
            <button
              onClick={editAbsensi}
              className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
              Edit Absensi
            </button>
          ) : (
            <button
              onClick={simpan}
              disabled={siswaKelas.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition hover:bg-primary-700 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
              Simpan ke Excel
            </button>
          )}
        </div>

        {siswaKelas.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-400">
            Belum ada siswa di kelas {kelas}. Tambahkan siswa terlebih dahulu di menu Data Siswa.
          </div>
        ) : tersimpan ? (
          /* Mode "sudah diabsen": tampil status tersimpan (terkunci) */
          <div className="divide-y divide-slate-100">
            {sudahAbsen.map((k, i) => (
              <div key={k.id || i} className="flex items-center gap-4 px-5 py-3">
                <span className="w-6 text-xs font-bold text-slate-400">{i + 1}</span>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                  {(k.Nama || '?')
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-700">{k.Nama}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${STATUS_STYLE[k.Status] || 'bg-slate-100 text-slate-500'}`}
                >
                  {k.Status}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 border-t border-slate-100 bg-emerald-50/60 px-5 py-3 text-sm text-emerald-700">
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Absensi Kelas {kelas} — {tanggalIndo(tanggal)} sudah tersimpan ke Excel & masuk ke data laporan. Klik "Edit Absensi" untuk mengubah.
            </div>
          </div>
        ) : (
          /* Mode input: tombol status aktif */
          <div className="divide-y divide-slate-100">
            {siswaKelas.map((s, i) => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-3 transition hover:bg-slate-50/60">
                <span className="w-6 text-xs font-bold text-slate-400">{i + 1}</span>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                  {(s.Nama || '?')
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-700">{s.Nama}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_HADIR.map((st) => {
                    const aktif = statuses[s.id] === st
                    return (
                      <button
                        key={st}
                        onClick={() => setStatuses((prev) => ({ ...prev, [s.id]: st }))}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          aktif ? 'text-white shadow' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                        style={aktif ? { backgroundColor: STATUS_HEX[st] } : undefined}
                      >
                        {st}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rekap hari ini + riwayat */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800">
            Rekap {tanggalIndo(tanggal)} — Kelas {kelas}
          </h3>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {Object.entries(rekapHari).map(([st, n]) => (
              <div key={st} className={`rounded-xl p-3 text-center ${STATUS_STYLE[st]}`}>
                <p className="text-2xl font-extrabold">{n}</p>
                <p className="text-xs font-medium">{st}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800">Riwayat Absensi Terakhir</h3>
          <div className="mt-4 space-y-2.5">
            {riwayatTanggal.map((r) => (
              <div
                key={`${r.Tanggal}|${r.Kelas}`}
                className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-700">
                    {tanggalIndo(r.Tanggal)} · Kelas {r.Kelas}
                  </p>
                  <p className="text-xs text-slate-500">
                    H: {r.Hadir} · S: {r.Sakit} · I: {r.Izin} · A: {r.Alpa}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const baris = kehadiran.filter((k) => k.Tanggal === r.Tanggal && k.Kelas === r.Kelas)
                    baris.forEach((b) => deleteKehadiran(b.id))
                  }}
                  className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50"
                  title="Hapus seluruh absensi tanggal & kelas ini"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            ))}
            {riwayatTanggal.length === 0 && <p className="text-sm text-slate-400">Belum ada riwayat absensi.</p>}
          </div>
          <div className="mt-4 rounded-xl bg-primary-50 px-4 py-3 text-xs text-primary-700">
            Tips: untuk mengubah absensi tanggal yang sama, hapus dulu data tanggal tersebut lalu input ulang.
          </div>
        </div>
      </div>
    </div>
  )
}
