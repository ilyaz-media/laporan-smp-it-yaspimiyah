import React from 'react'
import { APP_NAME, APP_TAGLINE } from '../lib/constants.js'
import { useData } from '../context/DataContext.jsx'

const Icon = {
  dashboard: 'M2.25 12.75l3-3m0 0l3-3m-3 3h9m-9 0v6.75A2.25 2.25 0 004.5 21h6a2.25 2.25 0 002.25-2.25V12m6.75 3.75l-3-3m0 0l-3-3m3 3h.01M12 3h6a2.25 2.25 0 012.25 2.25v6a2.25 2.25 0 01-2.25 2.25h-6a2.25 2.25 0 01-2.25-2.25v-6A2.25 2.25 0 0112 3z',
  siswa: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  hadir: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  riwayat: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  nilai: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V7.5A2.25 2.25 0 0018.75 5.25H5.25A2.25 2.25 0 003 7.5v9a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 16.5v-9z',
  mapel: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15h.008v.008H6.75V15z',
  pengaturan: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .442c.008.379.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a7.723 7.723 0 010-.442c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
}

function NavIcon({ path }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  )
}

export default function Sidebar({ page, onNavigate, open, onClose }) {
  const { fileStatus, lastSaved } = useData()
  const menu = [
    { id: 'dashboard', label: 'Dashboard', icon: Icon.dashboard },
    { id: 'siswa', label: 'Data Siswa', icon: Icon.siswa },
    { id: 'hadir', label: 'Daftar Hadir', icon: Icon.hadir },
    { id: 'riwayat', label: 'Riwayat Absensi', icon: Icon.riwayat },
    { id: 'nilai', label: 'Daftar Nilai', icon: Icon.nilai },
    { id: 'mapel', label: 'Mata Pelajaran', icon: Icon.mapel },
    { id: 'pengaturan', label: 'Pengaturan', icon: Icon.pengaturan },
  ]

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-gradient-to-b from-primary-700 via-primary-800 to-primary-950 text-white transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 pb-6 pt-7">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L2 8l10 5 10-5-10-5zm0 12.5L4.5 11 2 12.25l10 5 10-5L19.5 11 12 15.5zM12 20l-6-3-1.5.75L12 22.5l7.5-4.25L18 17l-6 3z" />
            </svg>
            </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-wide">SMP IT YASPIMIYAH</p>
            <p className="truncate text-xs text-primary-200">{APP_TAGLINE}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4">
          {menu.map((item) => {
            const active = page === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id)
                  onClose()
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? 'bg-white text-primary-700 shadow-lg shadow-primary-950/30'
                    : 'text-primary-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <NavIcon path={item.icon} />
                <span>{item.label}</span>
                {active && <span className="ml-auto h-2 w-2 rounded-full bg-primary-500" />}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
              <p className="text-xs font-semibold">{fileStatus.label}</p>
            </div>
            <p className="mt-1 truncate text-[11px] text-primary-200">
              {fileStatus.fileName || 'database-yaspimiyah.xlsx'}
            </p>
            {lastSaved && (
              <p className="mt-0.5 text-[11px] text-primary-300">
                Disimpan {lastSaved.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        <p className="pb-3 text-center text-[10px] font-medium tracking-wide text-primary-300/70">
          Powered by Ilyas Project
        </p>
      </aside>
    </>
  )
}
