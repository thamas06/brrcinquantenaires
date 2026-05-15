import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import Admin from './pages/Admin'
import Manager from './pages/Manager'
import Cashier from './pages/Cashier'
import Login from './pages/Login'
import Register from './pages/Register'
import { initDemoData, getEmployees } from './utils/storage'
import { getToken, setToken, authFetch } from './utils/api'

export default function App(){
  const [role, setRole] = useState('admin')
  const [employees, setEmployees] = useState([])
  const [isAuthed, setIsAuthed] = useState(!!getToken())
  const [currentUser, setCurrentUser] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(()=>{
    initDemoData()
    async function load(){
      setEmployees(await getEmployees())
    }
    load()
    if(getToken()){
      authFetch('/api/user').then(r=>r.json()).then(u=>{ setCurrentUser(u); if(u && u.role) setRole(u.role) }).catch(()=>{})
    }
  },[])

  function handleLogout(){
    setToken(null)
    setIsAuthed(false)
    setCurrentUser(null)
    navigate('/')
  }

  async function handleLogin(data){
    setIsAuthed(true)
    setEmployees(await getEmployees())
    if(data && data.user){ setCurrentUser(data.user); if(data.user.role) setRole(data.user.role) }
    navigate('/admin')
  }

  async function handleRegister(data){
    setIsAuthed(true)
    setEmployees(await getEmployees())
    if(data && data.user){ setCurrentUser(data.user); if(data.user.role) setRole(data.user.role) }
    navigate('/admin')
  }

  // Menu items selon le rôle
  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: 'dashboard', roles: ['admin', 'manager'] },
    { path: '/caissier', label: 'POS System', icon: 'point_of_sale', roles: ['admin', 'manager', 'caissier'] },
    { path: '/manager', label: 'Manager', icon: 'analytics', roles: ['admin', 'manager'] },
  ].filter(item => item.roles.includes(role))

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-surface text-on-background">
      {/* Navigation Drawer - Desktop */}
      <aside className="nav-drawer">
        {/* Header avec logo et profil */}
        <div className="flex flex-col px-4 mb-8">
          <span className="text-2xl font-bold tracking-tight text-secondary font-headline italic mb-6">
            Bar restaurant le cinquantenaire
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
                  {currentUser.name || 'Utilisateur'}
                </span>
                <span className="text-xs text-on-primary-container capitalize">
                  {role === 'admin' ? 'Administrateur' : role === 'manager' ? 'Manager' : 'Caissier'}
                </span>
                {isAuthed && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="w-2 h-2 bg-tertiary rounded-full"></span>
                    <span className="text-[10px] text-tertiary font-semibold uppercase tracking-widest">Connecté</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation menu */}
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

        {/* Market Sentiment Widget */}
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

      {/* Main Content */}
      <main className="md:ml-72 min-h-screen flex flex-col">
        {/* Top App Bar */}
        <header className="sticky top-0 z-40 w-full h-20 px-8 flex justify-between items-center bg-surface/90 backdrop-blur-md border-b border-outline-variant/10">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-primary">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-2xl font-extrabold text-secondary font-headline italic">
              Bar restaurant le cinquantenaire
            </h1>
          </div>

          <div className="flex items-center gap-6">
            {/* Navigation liens desktop */}
            <div className="hidden lg:flex items-center gap-8 text-primary font-semibold text-sm">
              <Link to="/" className="hover:text-tertiary transition-colors">Vue d'ensemble</Link>
              <Link to="/caissier" className="hover:text-tertiary transition-colors">Caisse</Link>
              <Link to="/manager" className="hover:text-tertiary transition-colors">Manager</Link>
            </div>

            {/* Notifications et profil */}
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 flex items-center justify-center text-primary-fixed-dim hover:bg-surface-container-high rounded-full transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>

              {isAuthed && currentUser && (
                <div className="relative group">
                  <img
                    className="w-10 h-10 rounded-full border border-secondary/20 object-cover cursor-pointer hover:scale-105 transition-transform"
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}&background=e9c176&color=412d00&size=128`}
                    alt="Profil"
                  />
                  {/* Dropdown menu (placeholder) */}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <section className="flex-grow p-8 max-w-7xl mx-auto w-full">
        <Routes>
            <Route path="/" element={<DashboardHome role={role} employees={employees} currentUser={currentUser} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register onRegister={handleRegister} />} />
            <Route path="/admin" element={<Admin role={role} employees={employees} currentUser={currentUser} onLogout={handleLogout} />} />
            <Route path="/manager" element={<Manager role={role} employees={employees} currentUser={currentUser} onLogout={handleLogout} />} />
            <Route path="/caissier" element={<Cashier role={role} employees={employees} currentUser={currentUser} onLogout={handleLogout} />} />
        </Routes>
        </section>

        {/* Footer spacing */}
        <div className="h-24"></div>
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-surface/95 backdrop-blur-2xl rounded-t-[2rem] shadow-floating">
        <Link to="/admin" className={`flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-200 ${
          location.pathname === '/admin' ? 'bg-gradient-to-br from-secondary to-secondary-fixed-dim text-on-secondary shadow-lg' : 'text-primary/60 hover:text-primary hover:translate-y-[-2px]'
        }`}>
          <span className="material-symbols-outlined" style={location.pathname === '/admin' ? {fontVariationSettings: "'FILL' 1"} : {}}>dashboard</span>
          <span className="font-label text-[10px] font-semibold uppercase tracking-wider mt-1">Accueil</span>
        </Link>
        <Link to="/caissier" className={`flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-200 ${
          location.pathname === '/caissier' ? 'bg-gradient-to-br from-secondary to-secondary-fixed-dim text-on-secondary shadow-lg' : 'text-primary/60 hover:text-primary hover:translate-y-[-2px]'
        }`}>
          <span className="material-symbols-outlined" style={location.pathname === '/caissier' ? {fontVariationSettings: "'FILL' 1"} : {}}>point_of_sale</span>
          <span className="font-label text-[10px] font-semibold uppercase tracking-wider mt-1">Caisse</span>
        </Link>
        <Link to="/manager" className={`flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-200 ${
          location.pathname === '/manager' ? 'bg-gradient-to-br from-secondary to-secondary-fixed-dim text-on-secondary shadow-lg' : 'text-primary/60 hover:text-primary hover:translate-y-[-2px]'
        }`}>
          <span className="material-symbols-outlined" style={location.pathname === '/manager' ? {fontVariationSettings: "'FILL' 1"} : {}}>analytics</span>
          <span className="font-label text-[10px] font-semibold uppercase tracking-wider mt-1">Manager</span>
        </Link>
        <button onClick={handleLogout} className="flex flex-col items-center justify-center text-primary/60 hover:text-primary hover:translate-y-[-2px] transition-transform">
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label text-[10px] font-semibold uppercase tracking-wider mt-1">Sortir</span>
        </button>
      </nav>
    </div>
  )
}

// Composant Dashboard Home (page d'accueil)
function DashboardHome({ role, employees, currentUser }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-on-background font-headline">
            Vue d'ensemble
          </h2>
          <p className="text-on-primary-container mt-2 font-medium">
            Performance en temps réel de votre établissement.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">
            Exporter PDF
          </button>
          <button className="btn-primary">
            Rapport Trimestriel
          </button>
        </div>
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="metric-card">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-secondary/10 text-secondary rounded-lg">
              <span className="material-symbols-outlined">payments</span>
            </span>
            <span className="badge badge-positive">+18%</span>
          </div>
          <p className="text-on-primary-container text-sm font-semibold uppercase tracking-wider">Revenue Total</p>
          <h3 className="text-3xl font-bold text-on-background mt-1 font-headline">€452,890</h3>
          <div className="mt-4 h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full w-[72%] bg-secondary rounded-full"></div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="metric-card">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-primary/10 text-primary rounded-lg">
              <span className="material-symbols-outlined">receipt_long</span>
            </span>
            <span className="badge badge-positive">+5.2%</span>
          </div>
          <p className="text-on-primary-container text-sm font-semibold uppercase tracking-wider">Commandes</p>
          <h3 className="text-3xl font-bold text-on-background mt-1 font-headline">12,402</h3>
          <p className="text-xs text-on-primary-container mt-4">Moy. €36.52 par ticket</p>
        </div>

        {/* Active Guests */}
        <div className="metric-card">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-tertiary/10 text-tertiary rounded-lg">
              <span className="material-symbols-outlined">group</span>
            </span>
            <span className="badge badge-negative">-2%</span>
          </div>
          <p className="text-on-primary-container text-sm font-semibold uppercase tracking-wider">Clients Actifs</p>
          <h3 className="text-3xl font-bold text-on-background mt-1 font-headline">8,920</h3>
          <div className="flex -space-x-2 mt-4">
            <img className="w-6 h-6 rounded-full border-2 border-surface-container-low" src="https://i.pravatar.cc/40?img=1" alt="Avatar" />
            <img className="w-6 h-6 rounded-full border-2 border-surface-container-low" src="https://i.pravatar.cc/40?img=2" alt="Avatar" />
            <img className="w-6 h-6 rounded-full border-2 border-surface-container-low" src="https://i.pravatar.cc/40?img=3" alt="Avatar" />
            <div className="w-6 h-6 rounded-full border-2 border-surface-container-low bg-surface-container-highest flex items-center justify-center text-[10px] font-bold">+24</div>
          </div>
        </div>

        {/* Inventory Health */}
        <div className="metric-card">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-on-tertiary-container/10 text-tertiary rounded-lg">
              <span className="material-symbols-outlined">wine_bar</span>
            </span>
          </div>
          <p className="text-on-primary-container text-sm font-semibold uppercase tracking-wider">Valeur Stock</p>
          <h3 className="text-3xl font-bold text-on-background mt-1 font-headline">€1.2M</h3>
          <p className="text-xs text-tertiary mt-4 font-bold">98% en stock</p>
        </div>
      </div>

      {/* Deuxième ligne: Map et Activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map et liste d'établissements */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-low rounded-[2rem] overflow-hidden">
            <div className="p-6 flex justify-between items-center">
              <h3 className="text-xl font-bold font-headline">Établissements</h3>
              <span className="badge badge-positive">4 Actifs</span>
            </div>
            <div className="relative h-[300px] w-full bg-slate-900 overflow-hidden">
              <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-surface-container-high to-surface-tint"></div>
              {/* Map markers simulés */}
              <div className="absolute top-1/4 left-1/3 group cursor-pointer">
                <div className="bg-secondary p-3 rounded-full shadow-lg glow-effect">
                  <span className="material-symbols-outlined text-on-secondary">restaurant</span>
                </div>
                <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-surface-container-highest p-3 rounded-xl shadow-xl w-48 opacity-0 group-hover:opacity-100 transition-opacity glass-panel">
                  <p className="font-headline font-bold text-sm">Lounge Principal</p>
                  <p className="text-[10px] text-tertiary font-bold">Trafic élevé • +20% Revenue</p>
                </div>
              </div>
              <div className="absolute top-1/2 right-1/4 group cursor-pointer">
                <div className="bg-secondary p-3 rounded-full shadow-lg glow-effect">
                  <span className="material-symbols-outlined text-on-secondary">local_bar</span>
                </div>
                <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-surface-container-highest p-3 rounded-xl shadow-xl w-48 opacity-0 group-hover:opacity-100 transition-opacity glass-panel">
                  <p className="font-headline font-bold text-sm">Terrasse Rooftop</p>
                  <p className="text-[10px] text-tertiary font-bold">Capacité maximale</p>
                </div>
              </div>
            </div>
          </div>

          {/* Liste rapide des établissements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-elevated border-l-4 border-tertiary">
              <h4 className="font-headline font-bold text-on-background">Place Grand-Place</h4>
              <p className="text-xs text-on-primary-container">Moyenne: €45.00</p>
              <div className="text-right mt-2">
                <p className="text-tertiary font-bold">€12.4k</p>
                <p className="text-[10px] text-on-primary-container uppercase tracking-widest font-bold">Aujourd'hui</p>
              </div>
            </div>
            <div className="card-elevated border-l-4 border-secondary">
              <h4 className="font-headline font-bold text-on-background">Réserve Anvers</h4>
              <p className="text-xs text-on-primary-container">Moyenne: €82.00</p>
              <div className="text-right mt-2">
                <p className="text-secondary font-bold">€8.1k</p>
                <p className="text-[10px] text-on-primary-container uppercase tracking-widest font-bold">Aujourd'hui</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-surface-container-low rounded-[2rem] p-8 flex flex-col h-full">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold font-headline">Activité Récente</h3>
            <span className="material-symbols-outlined text-primary cursor-pointer">more_vert</span>
          </div>

          <div className="space-y-8 flex-grow">
            <div className="activity-item">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0 z-10">
                <span className="material-symbols-outlined text-[14px] text-on-secondary" style={{fontVariationSettings: "'FILL' 1"}}>stars</span>
              </div>
              <div>
                <p className="text-sm font-bold font-headline text-on-background">Table VIP fermée</p>
                <p className="text-xs text-on-primary-container mt-1">Table 12 - Rooftop. Total: €1,450.00</p>
                <span className="text-[10px] text-outline font-medium mt-2 block">Il y a 12 min</span>
              </div>
            </div>

            <div className="activity-item">
              <div className="w-6 h-6 rounded-full bg-tertiary flex items-center justify-center shrink-0 z-10">
                <span className="material-symbols-outlined text-[14px] text-on-tertiary" style={{fontVariationSettings: "'FILL' 1"}}>inventory</span>
              </div>
              <div>
                <p className="text-sm font-bold font-headline text-on-background">Stock réapprovisionné</p>
                <p className="text-xs text-on-primary-container mt-1">Château Margaux 2015 - Cave principale</p>
                <span className="text-[10px] text-outline font-medium mt-2 block">Il y a 45 min</span>
              </div>
            </div>

            <div className="activity-item">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 z-10">
                <span className="material-symbols-outlined text-[14px] text-on-primary" style={{fontVariationSettings: "'FILL' 1"}}>person_add</span>
              </div>
              <div>
                <p className="text-sm font-bold font-headline text-on-background">Nouvel employé</p>
                <p className="text-xs text-on-primary-container mt-1">Jean-Claude, sommelier - Hub Bruxelles</p>
                <span className="text-[10px] text-outline font-medium mt-2 block">Il y a 2h</span>
              </div>
            </div>

            <div className="activity-item">
              <div className="w-6 h-6 rounded-full bg-error flex items-center justify-center shrink-0 z-10">
                <span className="material-symbols-outlined text-[14px] text-on-error" style={{fontVariationSettings: "'FILL' 1"}}>error</span>
              </div>
              <div>
                <p className="text-sm font-bold font-headline text-on-background">Commande annulée</p>
                <p className="text-xs text-on-primary-container mt-1">Commande #8892 par le manager</p>
                <span className="text-[10px] text-outline font-medium mt-2 block">Il y a 4h</span>
              </div>
            </div>
          </div>

          <button className="w-full mt-8 py-3 rounded-xl border border-outline-variant text-primary font-headline font-bold text-sm hover:bg-surface-container-highest transition-colors">
            Voir Journal d'Audit
          </button>
        </div>
      </div>
    </div>
  )
}
