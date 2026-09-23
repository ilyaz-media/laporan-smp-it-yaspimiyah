import React, { useEffect, useRef, useState } from 'react'
import { useData } from '../context/DataContext.jsx'
import { KELAS_LIST } from '../lib/constants.js'

/** Gabungkan daftar tingkat unik dari data siswa dengan daftar kelas bawaan. */
function daftarTingkatGabungan(siswa) {
  const tingkatData = [...new Set(siswa.map((s) => String(s.Kelas || '').match(/\d+/)?.[0]).filter(Boolean))]
  const gabungan = tingkatData.length > 0 ? [...new Set([...tingkatData, ...KELAS_LIST])] : [...KELAS_LIST]
  return gabungan.sort()
}

export default function Header({ title, subtitle, onMenuClick }) {
  const { exportClassReportImage, exportClassReportAllImage, siswa } = useData()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const daftarTingkat = daftarTingkatGabungan(siswa)

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-8">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-slate-500 transition hover:bg-primary-50 hover:text-primary-600 lg:hidden"
          aria-label="Buka menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-slate-800 sm:text-xl">{title}</h1>
          {subtitle && <p className="truncate text-xs text-slate-500 sm:text-sm">{subtitle}</p>}
        </div>

        {/* Dropdown laporan per tingkat */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition hover:bg-primary-700 sm:px-4"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span className="hidden sm:inline">Unduh Laporan</span>
            <span className="sm:hidden">Laporan</span>
            <svg className={`h-3.5 w-3.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-100 bg-white py-2 shadow-2xl animate-fade-up">
              <p className="px-4 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Pilih Tingkat Kelas
              </p>
              {/* Laporan gabungan seluruh kelas dalam satu gambar */}
              <button
                onClick={() => {
                  exportClassReportAllImage()
                  setMenuOpen(false)
                }}
                disabled={siswa.length === 0}
                className="mb-1 flex w-full items-center gap-3 border-b border-slate-100 px-4 pb-2.5 pt-1 text-sm text-slate-700 transition hover:bg-primary-50 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-[10px] font-bold text-white">
                  ALL
                </span>
                <span className="font-semibold">Semua Kelas (1 Gambar)</span>
              </button>
              {daftarTingkat.map((t) => {
                const jumlah = siswa.filter((s) => String(s.Kelas || '').startsWith(t)).length
                return (
                  <button
                    key={t}
                    onClick={() => {
                      exportClassReportImage(t)
                      setMenuOpen(false)
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-primary-50 hover:text-primary-700"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-700">
                      {t}
                    </span>
                    <span className="font-semibold">Kelas {t}</span>
                    <span className="ml-auto text-xs text-slate-400">{jumlah} siswa</span>
                  </button>
                )
              })}
              <p className="mt-1 border-t border-slate-100 px-4 pb-1 pt-2 text-[11px] leading-relaxed text-slate-400">
                Laporan berupa gambar (PNG): tabel nama siswa, jumlah hadir/sakit/izin/alpa, dan rata-rata nilai semua ujian.
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
