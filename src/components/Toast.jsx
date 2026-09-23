import React, { useEffect } from 'react'
import { registerToastHandler } from '../context/DataContext.jsx'

const DURASI_MS = 3500

const THEME = {
  success: {
    border: 'border-emerald-200',
    bg: 'bg-white',
    iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    iconColor: 'text-white',
    progress: 'bg-emerald-500',
    judul: 'text-emerald-700',
    label: 'Berhasil',
    icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  error: {
    border: 'border-rose-200',
    bg: 'bg-white',
    iconBg: 'bg-gradient-to-br from-rose-400 to-rose-600',
    iconColor: 'text-white',
    progress: 'bg-rose-500',
    judul: 'text-rose-700',
    label: 'Gagal',
    icon: 'M12 9v3.75m-9.303 3.376c.866 1.5 2.25 2.5 3.606 2.5h11.394c1.357 0 2.74-1 3.606-2.5l.742-1.285a3 3 0 000-2.5l-5.697-9.866a3 3 0 00-5.196 0l-5.697 9.866a3 3 0 000 2.5l.742 1.285zM12 15.75h.007v.008H12v-.008z',
  },
  info: {
    border: 'border-sky-200',
    bg: 'bg-white',
    iconBg: 'bg-gradient-to-br from-sky-400 to-sky-600',
    iconColor: 'text-white',
    progress: 'bg-sky-500',
    judul: 'text-sky-700',
    label: 'Informasi',
    icon: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
  },
  download: {
    border: 'border-primary-200',
    bg: 'bg-white',
    iconBg: 'bg-gradient-to-br from-primary-400 to-primary-700',
    iconColor: 'text-white',
    progress: 'bg-primary-600',
    judul: 'text-primary-700',
    label: 'Siap Diunduh',
    icon: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3',
  },
}

/* Confetti mini untuk perayaan sukses */
function Confetti() {
  const warna = ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e', '#8b5cf6']
  return (
    <div className="pointer-events-none absolute -top-1 left-6 flex gap-1">
      {warna.map((c, i) => (
        <span
          key={i}
          className="animate-confetti block h-1.5 w-1.5 rounded-[2px]"
          style={{ backgroundColor: c, animationDelay: `${0.15 + i * 0.08}s` }}
        />
      ))}
    </div>
  )
}

function ToastItem({ toast, onTutup }) {
  const t = THEME[toast.type] || THEME.info

  return (
    <div
      className={`pointer-events-auto relative w-80 overflow-hidden rounded-2xl border ${t.border} ${t.bg} shadow-2xl ${
        toast.keluar ? 'animate-toast-out' : 'animate-toast-in'
      }`}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Ikon bulat besar dengan animasi pop */}
        <div className={`animate-pop-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.iconBg} shadow-lg`}>
          <svg className={`h-5 w-5 ${t.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
          </svg>
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-extrabold ${t.judul}`}>{toast.judul || t.label}</p>
            {toast.type === 'success' && <Confetti />}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{toast.message}</p>
        </div>

        {/* Tombol tutup */}
        <button
          onClick={() => onTutup(toast.id)}
          className="shrink-0 rounded-lg p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-500"
          aria-label="Tutup notifikasi"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar waktu */}
      <div className="h-1 w-full bg-slate-100">
        <div
          className={`animate-progress h-full ${t.progress}`}
          style={{ animationDuration: `${toast.durasi || DURASI_MS}ms` }}
        />
      </div>
    </div>
  )
}

export default function ToastHost() {
  const [toasts, setToasts] = React.useState([])

  React.useEffect(() => {
    registerToastHandler((message, type = 'success', judul = null) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [
        ...prev.slice(-3),
        { id, message, type, judul, durasi: DURASI_MS, keluar: false },
      ])
      // Mulai animasi keluar sebelum benar-benar dihapus
      setTimeout(() => {
        setToasts((prev) => prev.map((x) => (x.id === id ? { ...x, keluar: true } : x)))
      }, DURASI_MS - 250)
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id))
      }, DURASI_MS)
    })
    return () => registerToastHandler(null)
  }, [])

  const tutup = (id) => {
    setToasts((prev) => prev.map((x) => (x.id === id ? { ...x, keluar: true } : x)))
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 250)
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col-reverse gap-2.5">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onTutup={tutup} />
      ))}
    </div>
  )
}
