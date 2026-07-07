import React, { useState, useEffect, useCallback } from 'react'
import ProductList from '../components/ProductList'
import SaleForm from '../components/SaleForm'
import { getProducts, getEmployees, getSales } from '../utils/storage'
import { exportProductSalesToExcel } from '../utils/exportExcel'
import { assignRole } from '../utils/api'
import Swal from 'sweetalert2'

export default function Cashier({ currentUser, onLogout, role }) {
  const [products, setProducts]   = useState([])
  const [employees, setEmployees] = useState([])
  const [selected, setSelected]   = useState(null)
  const [sales, setSales]         = useState([])
  const [openEmpId, setOpenEmpId] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [assignMsg, setAssignMsg] = useState('')

  const pendingUsers = employees.filter(e => e.role === 'pending')

  const saleEmployees = employees.filter(e =>
    e.role === 'employee' && String(e.id) !== String(currentUser?.id)
  )

  const loadAll = useCallback(async () => {
    try {
      const [prods, emps, sls] = await Promise.all([
        getProducts(), getEmployees(), getSales()
      ])
      setProducts(prods)
      setEmployees(emps)
      setSales(sls)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    loadAll().finally(() => setLoading(false))
    const interval = setInterval(loadAll, 10000)
    return () => clearInterval(interval)
  }, [loadAll])

  async function handleActivateEmployee(user) {
    try {
      await assignRole(user.id, 'employee')
      setAssignMsg(`✓ ${user.name} est maintenant activé comme employé`)
      setTimeout(() => setAssignMsg(''), 4000)
      await loadAll()
    } catch (err) {
      Swal.fire({
        icon: 'error', title: 'Erreur',
        text: err.message || "Impossible d'activer cet employé",
        background: '#142034', color: '#d7e2ff',
      })
    }
  }

  // ── Calculs ────────────────────────────────────────────────────────────────

  const toutesLesVentes = sales

  // Ventes faites AU NOM d'un utilisateur DIFFERENT de la caissière
  // = employee_id existe ET employee_id !== id de la caissière
  const ventesParEmploye = toutesLesVentes.filter(s =>
    s.employee_id &&
    String(s.employee_id) !== String(currentUser?.id)
  )

  // Ventes propres à la caissière
  // = pas d'employee_id OU employee_id === id de la caissière
  const ventesPropres = toutesLesVentes.filter(s =>
    !s.employee_id ||
    String(s.employee_id) === String(currentUser?.id)
  )

  // TOTAL caissière = uniquement ses ventes propres
  const totalCaissiere = ventesPropres
    .reduce((a, s) => a + Number(s.total_sale || 0), 0)

  // GRAND TOTAL = toutes les ventes
  const grandTotal = toutesLesVentes
    .reduce((a, s) => a + Number(s.total_sale || 0), 0)

  const totalQty = toutesLesVentes
    .reduce((a, s) => a + Number(s.qty || 0), 0)

  const nbTransactions = toutesLesVentes.length

  // Grouper les ventes au nom d'un utilisateur par utilisateur
  const comptesEmployes = Object.values(
    ventesParEmploye.reduce((acc, s) => {
      const empId = String(s.employee_id)
      if (!acc[empId]) {
        const emp = employees.find(e => String(e.id) === empId)
        acc[empId] = {
          id:     empId,
          name:   emp?.name || s.employeeName || `Utilisateur #${empId}`,
          ventes: []
        }
      }
      acc[empId].ventes.push(s)
      return acc
    }, {})
  )

  // Total de toutes les sommes dues par les utilisateurs
  const totalEmployes = ventesParEmploye
    .reduce((a, s) => a + Number(s.total_sale || 0), 0)

  const myProducts = (role === 'admin' || role === 'manager')
    ? products
    : products.filter(p =>
        String(p.declared_for_user_id) === String(currentUser?.id) ||
        String(p.employeeId) === String(currentUser?.id)
      )

  function getEmployeeName(sale) {
    if (!sale.employee_id) return null
    const emp = employees.find(e => String(e.id) === String(sale.employee_id))
    return emp?.name || sale.employeeName || `Utilisateur #${sale.employee_id}`
  }

  function exportComptes() {
    const rows = []
    comptesEmployes.forEach(compte => {
      compte.ventes.forEach(s => {
        const prod = products.find(p => String(p.id) === String(s.product_id))
        rows.push({
          Utilisateur: compte.name,
          Produit:     prod?.name || s.productName || 'Inconnu',
          Quantité:    Number(s.qty || 0),
          'Total':     Number(s.total_sale || 0),
          Date:        s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : ''
        })
      })
    })
    rows.push({ Utilisateur: '— TOTAL CAISSIÈRE —', Produit: '', Quantité: '', Total: totalCaissiere.toFixed(0), Date: '' })
    rows.push({ Utilisateur: '— GRAND TOTAL —',     Produit: '', Quantité: '', Total: grandTotal.toFixed(0),    Date: '' })
    if (rows.length === 2) { alert('Aucune vente à exporter'); return }
    exportProductSalesToExcel(
      `comptes_${currentUser?.name}_${new Date().toISOString().split('T')[0]}.xlsx`,
      rows
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <span className="material-symbols-outlined animate-spin text-secondary text-4xl">refresh</span>
    </div>
  )

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-on-background font-headline">Point de Vente</h2>
          <p className="text-on-primary-container mt-1">
            Interface de caisse — <strong>{currentUser?.name}</strong>
          </p>
        </div>
        <button onClick={exportComptes} className="btn-secondary">
          <span className="material-symbols-outlined text-sm align-middle mr-1">download</span>
          Exporter les comptes
        </button>
      </div>

      {/* ── Notification ── */}
      {assignMsg && (
        <div className="p-4 bg-tertiary/10 text-tertiary rounded-xl text-sm font-semibold">
          {assignMsg}
        </div>
      )}

      {/* ── Comptes en attente ── */}
      {pendingUsers.length > 0 && (
        <div className="card border-2 border-secondary/40">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-secondary">person_add</span>
            <h3 className="text-lg font-bold font-headline">
              Nouveaux comptes à activer
              <span className="ml-2 text-xs bg-secondary text-on-secondary px-2 py-0.5 rounded-full font-bold">
                {pendingUsers.length}
              </span>
            </h3>
          </div>
          <div className="space-y-3">
            {pendingUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-surface-container-high rounded-xl">
                <div className="flex items-center gap-3">
                  <img className="w-10 h-10 rounded-full"
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=e9c176&color=412d00&size=80`}
                    alt={u.name} />
                  <div>
                    <p className="font-bold text-on-background text-sm">{u.name}</p>
                    <p className="text-xs text-on-primary-container">{u.email}</p>
                  </div>
                </div>
                <button onClick={() => handleActivateEmployee(u)}
                  className="flex items-center gap-1 px-4 py-2 bg-secondary text-on-secondary text-sm font-bold rounded-xl hover:opacity-90">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Activer comme employé
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats caissière ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="metric-card">
          <span className="p-2 bg-secondary/10 text-secondary rounded-lg inline-flex mb-4">
            <span className="material-symbols-outlined">payments</span>
          </span>
          <p className="text-on-primary-container text-sm font-semibold uppercase tracking-wider">
            Mon total encaissé
          </p>
          <h3 className="text-3xl font-bold text-secondary mt-2 font-headline">
            {grandTotal.toFixed(0)} FCFA
          </h3>
        </div>
        <div className="metric-card">
          <span className="p-2 bg-tertiary/10 text-tertiary rounded-lg inline-flex mb-4">
            <span className="material-symbols-outlined">inventory_2</span>
          </span>
          <p className="text-on-primary-container text-sm font-semibold uppercase tracking-wider">
            Articles vendus
          </p>
          <h3 className="text-3xl font-bold text-on-background mt-2 font-headline">{totalQty}</h3>
        </div>
        <div className="metric-card">
          <span className="p-2 bg-primary/10 text-primary rounded-lg inline-flex mb-4">
            <span className="material-symbols-outlined">receipt_long</span>
          </span>
          <p className="text-on-primary-container text-sm font-semibold uppercase tracking-wider">
            Transactions
          </p>
          <h3 className="text-3xl font-bold text-on-background mt-2 font-headline">{nbTransactions}</h3>
        </div>
      </div>

      {/* ── Zone de vente ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-headline">Produits à vendre</h3>
              <span className="badge badge-positive">{myProducts.length} produits</span>
            </div>
            {myProducts.length === 0 ? (
              <div className="text-center py-12 bg-surface-container-low rounded-2xl border-2 border-dashed border-outline-variant/30">
                <span className="material-symbols-outlined text-4xl opacity-50 block mb-3">inventory_2</span>
                <p className="text-on-primary-container font-semibold">Aucun produit assigné</p>
              </div>
            ) : (
              <ProductList products={myProducts} onSelect={setSelected} role={role} employees={employees} />
            )}
          </div>
        </div>

        <div className="card sticky top-24">
          <h3 className="text-xl font-bold font-headline mb-6">Nouvelle vente</h3>
          {selected ? (
            <SaleForm
              product={selected}
              employees={saleEmployees}
              currentUser={currentUser}
              onSold={async () => { setSelected(null); await loadAll() }}
              role={role}
            />
          ) : (
            <div className="text-center py-12 text-on-primary-container border-2 border-dashed border-outline-variant/30 rounded-xl">
              <span className="material-symbols-outlined text-4xl mb-3 opacity-50 block">shopping_cart</span>
              <p>Sélectionnez un produit pour vendre</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Comptes fin de journée ── */}
      <div className="card">
        <h3 className="text-xl font-bold font-headline mb-2">
          <span className="material-symbols-outlined align-middle mr-2 text-secondary">account_balance_wallet</span>
          Comptes fin de journée
        </h3>
        <p className="text-sm text-on-primary-container mb-6">
          Montant à collecter chez chaque utilisateur, et total encaissé par {currentUser?.name}.
        </p>

        <div className="space-y-3">

          {/* ══════════════════════════════════════════════════
              BLOC PAR UTILISATEUR
              Chaque utilisateur dont le nom a été choisi
              lors d'une vente apparaît ici avec son total
          ══════════════════════════════════════════════════ */}
          {comptesEmployes.length === 0 ? (
            <div className="text-center py-10 bg-surface-container-low rounded-2xl border-2 border-dashed border-outline-variant/30">
              <span className="material-symbols-outlined text-4xl opacity-40 block mb-2">groups</span>
              <p className="text-on-primary-container">Aucune vente enregistrée au nom d'un utilisateur</p>
            </div>
          ) : (
            comptesEmployes.map(compte => {
              const empTotal = compte.ventes.reduce((a, s) => a + Number(s.total_sale || 0), 0)
              const empQty   = compte.ventes.reduce((a, s) => a + Number(s.qty || 0), 0)
              const isOpen   = openEmpId === compte.id

              return (
                <div key={compte.id}>
                  {/* Carte utilisateur cliquable */}
                  <div
                    onClick={() => setOpenEmpId(isOpen ? null : compte.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                      isOpen
                        ? 'bg-primary/10 border-primary shadow-lg'
                        : 'bg-surface-container-high border-transparent hover:bg-surface-container-highest'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <img
                          className="w-12 h-12 rounded-full"
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(compte.name)}&background=2d4a6e&color=d7e2ff&size=80`}
                          alt={compte.name}
                        />
                        <div>
                          <p className="font-headline font-bold text-on-background text-lg">{compte.name}</p>
                          <p className="text-xs text-on-primary-container">
                            {empQty} articles • {compte.ventes.length} vente(s)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{empTotal.toFixed(0)}</p>
                        <p className="text-xs text-on-primary-container font-semibold">FCFA à collecter</p>
                      </div>
                    </div>
                  </div>

                  {/* Détail des ventes de cet utilisateur */}
                  {isOpen && (
                    <div className="mt-2 ml-4 p-4 bg-surface-container rounded-xl space-y-2 border-l-4 border-primary">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold text-on-primary-container">
                          Détail — {compte.name}
                        </p>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            const rows = compte.ventes.map(s => {
                              const prod = products.find(p => String(p.id) === String(s.product_id))
                              return {
                                Utilisateur:     compte.name,
                                Produit:         prod?.name || s.productName || 'Inconnu',
                                Quantité:        s.qty,
                                'Prix unitaire': s.unit_price,
                                Total:           Number(s.total_sale || 0).toFixed(0),
                                Date:            s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : ''
                              }
                            })
                            rows.push({ Utilisateur: 'TOTAL', Produit: '', Quantité: empQty, 'Prix unitaire': '', Total: empTotal.toFixed(0), Date: '' })
                            exportProductSalesToExcel(`compte_${compte.name}.xlsx`, rows)
                          }}
                          className="px-3 py-1 bg-secondary text-on-secondary text-xs font-bold rounded-full hover:opacity-90"
                        >
                          📥 Exporter
                        </button>
                      </div>

                      {compte.ventes.slice().reverse().map(s => {
                        const prod = products.find(p => String(p.id) === String(s.product_id))
                        return (
                          <div key={s.id} className="flex justify-between items-center p-3 bg-surface-container-high rounded-lg text-xs">
                            <div className="flex-1">
                              <p className="font-semibold text-on-background">
                                {prod?.name || s.productName || 'Produit'}
                              </p>
                              <p className="text-[10px] text-on-primary-container">
                                {s.created_at ? new Date(s.created_at).toLocaleString('fr-FR') : ''}
                              </p>
                            </div>
                            <div className="text-right ml-3">
                              <p className="text-on-primary-container">×{s.qty}</p>
                              <p className="font-bold text-primary">{Number(s.total_sale || 0).toFixed(0)} FCFA</p>
                            </div>
                          </div>
                        )
                      })}

                      <div className="pt-2 border-t border-outline-variant/30 flex justify-between font-headline text-sm">
                        <span className="font-bold">Total à collecter chez {compte.name}</span>
                        <span className="font-bold text-primary">{empTotal.toFixed(0)} FCFA</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}

          {/* ══════════════════════════════════════════════════
              BLOC CAISSIÈRE
              Ventes propres + récap employés + grand total
          ══════════════════════════════════════════════════ */}
          <div className="mt-4 p-5 bg-secondary/10 border-2 border-secondary rounded-2xl space-y-3">

            {/* En-tête caissière */}
            <div className="flex items-center gap-3">
              <img
                className="w-12 h-12 rounded-full border-2 border-secondary"
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'C')}&background=e9c176&color=412d00&size=80`}
                alt={currentUser?.name}
              />
              <div>
                <p className="font-headline font-bold text-on-background text-lg">
                  {currentUser?.name}{' '}
                  <span className="text-xs text-secondary font-semibold uppercase">(Caissière)</span>
                </p>
                <p className="text-xs text-on-primary-container">
                  {nbTransactions} transaction(s) enregistrée(s)
                </p>
              </div>
            </div>

            {/* Ventes propres de la caissière */}
            <div className="pt-3 border-t border-secondary/30">
              <p className="text-xs font-semibold text-on-primary-container uppercase tracking-wider mb-2">
                Ses ventes en nom propre
              </p>
              {ventesPropres.length === 0 ? (
                <p className="text-xs text-on-primary-container italic">Aucune vente en nom propre</p>
              ) : (
                <div className="space-y-1">
                  {ventesPropres.slice().reverse().map(s => {
                    const prod = products.find(p => String(p.id) === String(s.product_id))
                    return (
                      <div key={s.id} className="flex justify-between items-center p-2 bg-surface-container rounded-lg text-xs">
                        <div className="flex-1">
                          <p className="font-semibold text-on-background">
                            {prod?.name || s.productName || 'Produit'}
                          </p>
                          <p className="text-[10px] text-on-primary-container">
                            {s.created_at ? new Date(s.created_at).toLocaleString('fr-FR') : ''}
                          </p>
                        </div>
                        <div className="text-right ml-3">
                          <p className="text-on-primary-container">×{s.qty}</p>
                          <p className="font-bold text-secondary">{Number(s.total_sale || 0).toFixed(0)} FCFA</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="mt-2 flex justify-between items-center">
                <span className="text-sm font-semibold text-on-primary-container">
                  Sous-total ventes propres
                </span>
                <span className="text-xl font-bold text-on-background font-headline">
                  {totalCaissiere.toFixed(0)} FCFA
                </span>
              </div>
            </div>

            {/* Récap montants à collecter par utilisateur */}
            {comptesEmployes.length > 0 && (
              <div className="pt-3 border-t border-secondary/30">
                <p className="text-xs font-semibold text-on-primary-container uppercase tracking-wider mb-2">
                  Montants à collecter chez les utilisateurs
                </p>
                <div className="space-y-1">
                  {comptesEmployes.map(compte => {
                    const empTotal = compte.ventes.reduce((a, s) => a + Number(s.total_sale || 0), 0)
                    return (
                      <div key={compte.id} className="flex justify-between items-center px-3 py-2 bg-surface-container rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-primary">person</span>
                          <span className="text-sm font-semibold text-on-background">{compte.name}</span>
                        </div>
                        <span className="text-sm font-bold text-primary">{empTotal.toFixed(0)} FCFA</span>
                      </div>
                    )
                  })}
                  <div className="flex justify-between items-center px-3 py-1">
                    <span className="text-xs text-on-primary-container font-semibold">Sous-total utilisateurs</span>
                    <span className="text-sm font-bold text-on-background">{totalEmployes.toFixed(0)} FCFA</span>
                  </div>
                </div>
              </div>
            )}

            {/* Grand total */}
            <div className="pt-3 border-t border-secondary/30 flex justify-between items-center">
              <span className="font-headline font-bold text-on-background text-lg">
                TOTAL GÉNÉRAL ENCAISSÉ
              </span>
              <span className="text-3xl font-bold text-secondary font-headline">
                {grandTotal.toFixed(0)} FCFA
              </span>
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}