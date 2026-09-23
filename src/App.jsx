import React, { useState } from 'react'
import { DataProvider, useData } from './context/DataContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import ToastHost from './components/Toast.jsx'
import Dashboard from './pages/Dashboard.jsx'
import SiswaPage from './pages/Siswa.jsx'
import HadirPage from './pages/Hadir.jsx'
import RiwayatPage from './pages/Riwayat.jsx'
import NilaiPage from './pages/Nilai.jsx'
import MapelPage from './pages/Mapel.jsx'
import PengaturanPage from './pages/Pengaturan.jsx'
import { APP_NAME } from './lib/constants.js'

const PAGE_META = {
  dashboard: { title: 'Dashboard', subtitle: 'Ringkasan data sekolah' },
  siswa: { title: 'Data Siswa', subtitle: 'Kelola data induk siswa' },
  hadir: { title: 'Daftar Hadir', subtitle: 'Input absensi harian per kelas' },
  riwayat: { title: 'Riwayat Absensi', subtitle: 'Semua riwayat absensi per kelas' },
  nilai: { title: 'Daftar Nilai', subtitle: 'Input dan rekap nilai siswa' },
  mapel: { title: 'Mata Pelajaran', subtitle: 'Kelola mata pelajaran & KKM' },
  pengaturan: { title: 'Pengaturan', subtitle: 'Backup, pulihkan, dan reset data aplikasi' },
}

function Shell() {
  const [page, setPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { ready, siswa } = useData()

  const meta = PAGE_META[page]

  return (
    <div className="min-h-screen">
      <Sidebar page={page} onNavigate={setPage} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-72">
        <Header title={meta.title} subtitle={meta.subtitle} onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
          {!ready ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                <p className="text-sm text-slate-500">Menyiapkan database Excel...</p>
              </div>
            </div>
          ) : (
            <>
              {page === 'dashboard' && <Dashboard />}
              {page === 'siswa' && <SiswaPage />}
              {page === 'hadir' && <HadirPage />}
              {page === 'riwayat' && <RiwayatPage />}
              {page === 'nilai' && <NilaiPage />}
              {page === 'mapel' && <MapelPage />}
              {page === 'pengaturan' && <PengaturanPage />}
            </>
          )}
        </main>
        <footer className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-400 sm:px-8">
          {APP_NAME} · Data tersimpan dalam file Excel (.xlsx)
        </footer>
      </div>
      <ToastHost />
    </div>
  )
}

export default function App() {
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  )
}
