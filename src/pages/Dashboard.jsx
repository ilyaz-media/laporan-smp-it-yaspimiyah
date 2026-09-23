import React, { useMemo } from 'react'
import { useData } from '../context/DataContext.jsx'
import { tanggalIndo } from '../lib/constants.js'

const BAR_COLORS = ['#2563eb', '#0ea5e9', '#6366f1', '#06b6d4']

function initials(nama) {
  if (!nama) return '?'
  return nama
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

/** Diagram bulat (donut) dengan legenda + persentase di tengah. */
function DonutChart({ data, total, labelKosong }) {
  const SIZE = 200
  const R = 78
  const STROKE = 26
  const C = 2 * Math.PI * R
  const center = SIZE / 2

  // Sudut awal dari atas (jam 12), searah jarum jam
  let offset = 0
  const segmen = data.map((d) => {
    const frac = total > 0 ? d.count / total : 0
    const dash = frac * C
    const seg = { ...d, dash, offset }
    offset += dash
    return seg
  })

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative shrink-0">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle cx={center} cy={center} r={R} fill="none" stroke="#f1f5f9" strokeWidth={STROKE} />
          {segmen.map((s) =>
            s.dash > 0 ? (
              <circle
                key={s.label}
                cx={center}
                cy={center}
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={STROKE}
                strokeDasharray={`${s.dash} ${C - s.dash}`}
                strokeDashoffset={-s.offset}
                strokeLinecap="butt"
                className="transition-all duration-700"
              />
            ) : null,
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-extrabold text-slate-800">{total}</p>
          <p className="text-xs text-slate-400">total absensi</p>
        </div>
      </div>
      <div className="w-full space-y-3">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-3">
            <span className="h-3.5 w-3.5 shrink-0 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="flex-1 text-sm font-medium text-slate-700">{d.label}</span>
            <span className="text-sm font-bold text-slate-600">{d.count}</span>
            <span className="w-12 text-right text-xs text-slate-400">{d.pct}%</span>
          </div>
        ))}
        {total === 0 && <p className="text-sm text-slate-400">{labelKosong}</p>}
      </div>
    </div>
  )
}

/** Bar vertikal rata-rata nilai per mapel (gaya progress bar, arah ke atas). */
function NilaiKolom({ data, kkm = 75 }) {
  if (data.length === 0) {
    return <p className="mt-6 text-sm text-slate-400">Belum ada data nilai.</p>
  }

  return (
    <div className="mt-6">
      <div className="flex items-end justify-around gap-3 overflow-x-auto pb-1">
        {data.map((m) => {
          const lulus = m.rata >= kkm
          const persen = Math.min(100, m.rata)
          return (
            <div
              key={m.nama}
              className="flex w-16 shrink-0 flex-col items-center gap-2"
              title={`${m.nama}: rata-rata ${m.rata || '-'} (${m.jumlah} nilai)`}
            >
              <span className={`text-sm font-bold ${lulus ? 'text-emerald-600' : m.rata ? 'text-rose-500' : 'text-slate-400'}`}>
                {m.rata || '-'}
              </span>
              {/* Track vertikal, terisi dari bawah */}
              <div className="flex h-40 w-6 items-end overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`w-full rounded-full transition-all duration-700 ${lulus ? 'bg-primary-600' : 'bg-rose-500'}`}
                  style={{ height: `${persen}%` }}
                />
              </div>
              <div className="w-full text-center">
                <p className="truncate text-xs font-medium text-slate-600" title={m.nama}>
                  {m.nama}
                </p>
                <p className="text-[10px] text-slate-400">{m.jumlah} nilai</p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex items-center justify-center gap-5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary-600" /> Tuntas (≥ KKM {kkm})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Belum Tuntas
        </span>
      </div>
    </div>
  )
}

const STATUS_STYLE = {
  Hadir: 'bg-emerald-100 text-emerald-700',
  Sakit: 'bg-amber-100 text-amber-700',
  Izin: 'bg-sky-100 text-sky-700',
  Alpa: 'bg-rose-100 text-rose-700',
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        STATUS_STYLE[status] || 'bg-slate-100 text-slate-600'
      }`}
    >
      {status}
    </span>
  )
}

function StatCard({ title, value, subtitle, gradient, icon }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/90">{title}</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight">{value}</p>
          <p className="mt-0.5 text-xs text-white/75">{subtitle}</p>
        </div>
        <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { siswa, kehadiran, nilai, mapel } = useData()

  const stats = useMemo(() => {
    const laki = siswa.filter((s) => s.JenisKelamin === 'L').length
    const perempuan = siswa.filter((s) => s.JenisKelamin === 'P').length
    const hariIni = new Date().toISOString().slice(0, 10)
    const hadirHariIni = kehadiran.filter((k) => k.Tanggal === hariIni && k.Status === 'Hadir').length
    const rataNilai = nilai.length
      ? (nilai.reduce((acc, n) => acc + (Number(n.Nilai) || 0), 0) / nilai.length).toFixed(1)
      : '-'
    return { totalSiswa: siswa.length, laki, perempuan, hadirHariIni, rataNilai, totalMapel: mapel.length }
  }, [siswa, kehadiran, nilai, mapel])

  const kehadiranChart = useMemo(() => {
    const counters = { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 }
    kehadiran.forEach((k) => {
      if (counters[k.Status] !== undefined) counters[k.Status] += 1
    })
    const total = kehadiran.length
    const order = ['Hadir', 'Sakit', 'Izin', 'Alpa']
    return order.map((s, i) => ({
      label: s,
      count: counters[s],
      pct: total ? Math.round((counters[s] / total) * 100) : 0,
      color: BAR_COLORS[i],
    }))
  }, [kehadiran])

  const nilaiPerMapel = useMemo(() => {
    return mapel.map((m) => {
      const list = nilai.filter((n) => n.MataPelajaran === m.Nama)
      const rata = list.length
        ? (list.reduce((acc, n) => acc + (Number(n.Nilai) || 0), 0) / list.length).toFixed(1)
        : 0
      return { nama: m.Nama, rata: Number(rata), jumlah: list.length }
    })
  }, [mapel, nilai])

  return (
    <div className="space-y-6">
      {/* Kartu statistik */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Siswa"
          value={stats.totalSiswa}
          subtitle={`${stats.laki} laki-laki · ${stats.perempuan} perempuan`}
          gradient="from-primary-500 to-primary-700"
          icon="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
        <StatCard
          title="Hadir Hari Ini"
          value={stats.hadirHariIni}
          subtitle="dari total siswa aktif"
          gradient="from-sky-500 to-sky-700"
          icon="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <StatCard
          title="Rata-rata Nilai"
          value={stats.rataNilai}
          subtitle={`${nilai.length} entri nilai`}
          gradient="from-indigo-500 to-indigo-700"
          icon="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V7.5A2.25 2.25 0 0018.75 5.25H5.25A2.25 2.25 0 003 7.5v9a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 16.5v-9z"
        />
        <StatCard
          title="Mata Pelajaran"
          value={stats.totalMapel}
          subtitle="mapel aktif kurikulum"
          gradient="from-cyan-500 to-cyan-700"
          icon="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15h.008v.008H6.75V15z"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Ringkasan kehadiran — diagram bulat */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800">Rekap Kehadiran</h3>
          <p className="text-xs text-slate-500">Dihitung dari {kehadiran.length} baris absensi</p>
          <div className="mt-6">
            <DonutChart data={kehadiranChart} total={kehadiran.length} labelKosong="Belum ada data absensi." />
          </div>
        </div>

        {/* Nilai per mapel — bar vertikal */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800">Rata-rata Nilai per Mapel</h3>
          <p className="text-xs text-slate-500">Biru = tuntas (≥ KKM 75) · Merah = belum tuntas</p>
          <NilaiKolom data={nilaiPerMapel} kkm={75} />
        </div>
      </div>

      {/* Siswa baru & aktivitas terakhir */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800">Siswa Terbaru</h3>
          <div className="mt-4 space-y-3">
            {siswa
              .slice(-5)
              .reverse()
              .map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                    {initials(s.Nama)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-700">{s.Nama}</p>
                    <p className="text-xs text-slate-500">Kelas {s.Kelas}</p>
                  </div>
                </div>
              ))}
            {siswa.length === 0 && <p className="text-sm text-slate-400">Belum ada data siswa.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800">Aktivitas Absensi Terakhir</h3>
          <div className="mt-4 space-y-3">
            {kehadiran
              .slice(-5)
              .reverse()
              .map((k) => (
                <div key={k.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <StatusBadge status={k.Status} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-700">{k.Nama}</p>
                    <p className="text-xs text-slate-500">
                      {tanggalIndo(k.Tanggal)} · Kelas {k.Kelas}
                    </p>
                  </div>
                </div>
              ))}
            {kehadiran.length === 0 && <p className="text-sm text-slate-400">Belum ada data absensi.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
