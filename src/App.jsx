import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import Admin from './pages/Admin'
import Manager from './pages/Manager'
import Cashier from './pages/Cashier'
import Login from './pages/Login'
import Register from './pages/Register'
import { initDemoData, getEmployees } from './utils/storage'
import { getToken, setToken, authFetch } from './utils/api'

// Composant de protection de route
function ProtectedRoute({ children, allowedRoles, role }) {
  const location = useLocation()
  if (!getToken()) return <Navigate to="/login" state={{ from: location }} replace />
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to={roleHome(role)} replace />
  return children
}

function roleHome(role) {
  if (role === 'admin') return '/admin'
  if (role === 'manager') return '/manager'
  return '/caissier'
}

export default function App() {
  const [role, setRole] = useState(null)
  const [employees, setEmployees] = useState([])
  const [isAuthed, setIsAuthed] = useState(!!getToken())
  const [currentUser, setCurrentUser] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'dark')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const isLightMode = theme === 'light'

  useEffect(() => {
    initDemoData()
    async function load() {
      if (getToken()) {
        try {
          const r = await authFetch('/api/user')
          const u = await r.json()
          if (u && u.id) {
            setCurrentUser(u)
            setRole(u.role)
            setIsAuthed(true)
          } else {
            setToken(null)
            setIsAuthed(false)
          }
        } catch {
          setToken(null)
          setIsAuthed(false)
        }
      }
      setEmployees(await getEmployees())
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('light', theme === 'light')
    localStorage.setItem('appTheme', theme)
  }, [theme])

  function handleLogout() {
    setToken(null)
    setIsAuthed(false)
    setCurrentUser(null)
    setRole(null)
    navigate('/login')
  }

  async function handleLogin(data) {
    setIsAuthed(true)
    if (data?.user) {
      setCurrentUser(data.user)
      setRole(data.user.role)
    }
    setEmployees(await getEmployees())
  }

  async function handleRegister(data) {
    // Après inscription → redirection login (géré dans Register.jsx)
  }

  const menuItems = [
    { path: '/admin',    label: 'Admin',      icon: 'dashboard',     roles: ['admin'] },
    { path: '/manager',  label: 'Manager',    icon: 'analytics',     roles: ['admin', 'manager'] },
    { path: '/caissier', label: 'Caissier',   icon: 'point_of_sale', roles: ['admin', 'manager', 'caissier', 'employee'] },
  ].filter(item => role && item.roles.includes(role))

  const isActive = (path) => location.pathname === path

  const isAuthPage = ['/login', '/register'].includes(location.pathname)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <span className="material-symbols-outlined animate-spin text-secondary text-4xl">refresh</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface text-on-background md:flex">

      {/* Navigation Drawer - Desktop static */}
      {isAuthed && !isAuthPage && (
        <aside className="nav-drawer sticky top-0 self-start">
          <div className="flex flex-col px-4 mb-8">
            <span className="text-xl font-bold tracking-tight text-secondary font-headline italic mb-6">
              Bar Restaurant Le Cinquantenaires
            </span>
            {currentUser && (
              <div className="flex items-center gap-3 w-full">
                <img
                  className="w-12 h-12 rounded-full object-cover border-2 border-secondary/30"
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}&background=e9c176&color=412d00&size=128`}
                  alt="Avatar"
                />
                <div className="flex flex-col">
                  <span className="font-headline text-sm font-bold text-on-background">
                    {currentUser.name}
                  </span>
                  <span className="text-xs text-on-primary-container capitalize">
                    {role === 'admin' ? 'Administrateur' : role === 'manager' ? 'Manager' : role === 'caissier' ? 'Caissier' : 'Employé'}
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="w-2 h-2 bg-tertiary rounded-full"></span>
                    <span className="text-[10px] text-tertiary font-semibold uppercase tracking-widest">Connecté</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <nav className="flex flex-col gap-2 flex-grow">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="font-headline">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto p-4 bg-surface-container-low rounded-2xl">
            <p className="text-[10px] uppercase tracking-tighter text-on-primary-container mb-2">
              Performance Aujourd'hui
            </p>
            <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-tertiary rounded-full"></div>
            </div>
            <p className="text-[10px] text-tertiary mt-2 font-bold">+12.4% vs Hier</p>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={`${isAuthed && !isAuthPage ? 'flex-1 min-w-0' : ''} min-h-screen flex flex-col`}>

        {/* Top App Bar */}
        {isAuthed && !isAuthPage && (
          <header className="mobile-header">
            <div className="flex items-center gap-3">
              <button className="md:hidden text-primary">
                <span className="material-symbols-outlined">menu</span>
              </button>
              <h1 className="text-lg md:text-2xl font-extrabold text-secondary font-headline italic truncate">
                Bar Le Cinquantenaire
              </h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setTheme(isLightMode ? 'dark' : 'light')}
                className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-primary-fixed-dim hover:bg-surface-container-high rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] md:text-[24px]">{isLightMode ? 'dark_mode' : 'light_mode'}</span>
              </button>
              <button className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-primary-fixed-dim hover:bg-surface-container-high rounded-full transition-colors">
                <span className="material-symbols-outlined text-[20px] md:text-[24px]">notifications</span>
              </button>
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-surface-container-high text-primary font-headline font-bold rounded-xl hover:bg-surface-container-highest transition-colors text-sm"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                Déconnexion
              </button>
            </div>
          </header>
        )}

        {/* Page Content */}
        <section className={`flex-grow ${isAuthed && !isAuthPage ? 'page-section pb-24' : ''}`}>
          <Routes>
            <Route path="/login"    element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register onRegister={handleRegister} />} />

            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']} role={role}>
                <Admin role={role} employees={employees} currentUser={currentUser} onLogout={handleLogout} />
              </ProtectedRoute>
            } />

            <Route path="/manager" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']} role={role}>
                <Manager role={role} employees={employees} currentUser={currentUser} onLogout={handleLogout} />
              </ProtectedRoute>
            } />

            <Route path="/caissier" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'caissier', 'employee']} role={role}>
                <Cashier role={role} employees={employees} currentUser={currentUser} onLogout={handleLogout} />
              </ProtectedRoute>
            } />

            {/* Redirection par défaut */}
            <Route path="/" element={
              isAuthed
                ? <Navigate to={roleHome(role)} replace />
                : <Navigate to="/login" replace />
            } />
            <Route path="*" element={<Navigate to={isAuthed ? roleHome(role) : '/login'} replace />} />
          </Routes>
        </section>

        {!isAuthPage && <div className="h-24"></div>}
      </main>

      {/* Bottom Navigation - Mobile */}
      {isAuthed && !isAuthPage && (
        <nav className="bottom-nav">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`bottom-nav-item ${isActive(item.path) ? 'bottom-nav-item-active' : ''}`}
            >
              <span className="material-symbols-outlined text-[22px]" style={isActive(item.path) ? {fontVariationSettings: "'FILL' 1"} : {}}>{item.icon}</span>
              <span className="font-label text-[9px] font-semibold uppercase tracking-wider mt-0.5">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="bottom-nav-item"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
            <span className="font-label text-[9px] font-semibold uppercase tracking-wider mt-0.5">Sortir</span>
          </button>
        </nav>
      )}
    </div>
  )
}
