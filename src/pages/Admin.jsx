import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ProductForm from '../components/ProductForm'
import ProductList from '../components/ProductList'
import { getProducts, getSales, getEmployees, deleteProduct } from '../utils/storage'
import { assignRole, deleteUser } from '../utils/api'
import { exportProductSalesToExcel } from '../utils/exportExcel'
import Swal from 'sweetalert2'

export default function Admin({ role, employees: initialEmployees, currentUser, onLogout }) {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [users, setUsers] = useState([])
  const [assignMsg, setAssignMsg] = useState('')

  useEffect(() => {
    async function load() {
      setProducts(await getProducts())
      setSales(await getSales())
      setUsers(await getEmployees())
    }
    load()
    const interval = setInterval(async () => {
      setSales(await getSales())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  async function refresh() {
    setProducts(await getProducts())
    setSales(await getSales())
  }

  async function refreshUsers() {
    setUsers(await getEmployees())
  }

  async function handleDeleteProduct(productId) {
    try {
      await deleteProduct(productId)
      await refresh()
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression du produit')
    }
  }

  async function handleAssignRole(userId, newRole) {
    try {
      await assignRole(userId, newRole)
      await refreshUsers()
      setAssignMsg('Rôle mis à jour avec succès')
      setTimeout(() => setAssignMsg(''), 3000)
    } catch (err) {
      setAssignMsg('Erreur lors de la mise à jour du rôle')
      setTimeout(() => setAssignMsg(''), 3000)
    }
  }

  async function handleDeleteUser(user) {
    const result = await Swal.fire({
      title: 'Supprimer cet utilisateur ?',
      html: `<p>Vous allez supprimer <strong>${user.name}</strong> (${user.email}).<br/>Cette action est irréversible.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc2626',
      background: '#142034',
      color: '#d7e2ff',
    })
    if (!result.isConfirmed) return

    try {
      await deleteUser(user.id)
      await refreshUsers()
      Swal.fire({
        icon: 'success',
        title: 'Utilisateur supprimé',
        timer: 1500,
        showConfirmButton: false,
        background: '#142034',
        color: '#d7e2ff',
      })
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.message || 'Impossible de supprimer cet utilisateur',
        background: '#142034',
        color: '#d7e2ff',
      })
    }
  }

  async function downloadEmployeeReport(empId) {
    const empSales = sales.filter(s =>
      String(s.employee_id) === String(empId) ||
      String(s.employeeId) === String(empId)
    )
    const rows = empSales.map(s => {
      const prod = products.find(p =>
        String(p.id) === String(s.product_id) ||
        String(p.id) === String(s.productId)
      )
      return {
        Produit: prod?.name || 'Inconnu',
        Quantite: Number(s.qty || s.quantity || 0),
        'Prix unitaire': Number(s.unit_price || 0),
        'Total vente': Number(s.total_sale || s.totalSale || 0),
        'Benefice': Number(s.total_profit || s.totalProfit || 0),
        Employe: s.employeeName || empId,
        'Caissier': s.createdByName || 'N/A',
        Date: s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : ''
      }
    })
    if (rows.length === 0) {
      alert('Aucune vente trouvée pour cet employé')
      return
    }
    exportProductSalesToExcel(`rapport_${empId}.xlsx`, rows)
  }

  const totalSales = sales.reduce((a, s) => a + Number(s.total_sale || s.totalSale || 0), 0)
  const totalQty = sales.reduce((a, s) => a + Number(s.qty || s.quantity || 0), 0)
  const totalProfit = sales.reduce((a, s) => a + Number(s.total_profit || s.totalProfit || 0), 0)

  const dailyProductSummary = Object.values(sales.reduce((acc, s) => {
    const date = s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : 'N/A'
    const productId = String(s.product_id || s.productId || 'unknown')
    const prod = products.find(p => String(p.id) === productId)
    const name = s.productName || prod?.name || 'Produit inconnu'
    const key = `${date}_${productId}`

    if (!acc[key]) {
      acc[key] = { date, productId, productName: name, qty: 0, total: 0 }
    }

    acc[key].qty += Number(s.qty || s.quantity || 0)
    acc[key].total += Number(s.total_sale || s.totalSale || 0)
    return acc
  }, {}))

  function exportDailyProductSummary() {
    const rows = dailyProductSummary.map(item => ({
      Date: item.date,
      Produit: item.productName,
      Quantite: item.qty,
      'Total vente': item.total,
    }))
    if (rows.length === 0) {
      alert('Aucune vente à exporter')
      return
    }
    exportProductSalesToExcel('historique_journalier_par_produit.xlsx', rows)
  }

  const roleLabel = (r) => {
    if (r === 'admin') return 'Administrateur'
    if (r === 'manager') return 'Manager'
    if (r === 'caissier') return 'Caissier'
    if (r === 'pending') return 'En attente'
    return 'Employé'
  }

  const assignableRoles = ['caissier', 'employee', 'manager']

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-on-background font-headline">
            {currentUser?.name || 'Administrateur'}
          </h2>
          <p className="text-on-primary-container mt-2 font-medium">
            Vue d'ensemble des performances
          </p>
        </div>
        <button onClick={onLogout} className="btn-secondary">
          Déconnexion
        </button>
      </div>

      {/* STATISTIQUES PRINCIPALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="metric-card">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-secondary/10 text-secondary rounded-lg">
              <span className="material-symbols-outlined">payments</span>
            </span>
            <span className="badge badge-positive">Ventes</span>
          </div>
          <p className="text-on-primary-container text-sm font-semibold uppercase tracking-wider">Revenue Total</p>
          <h3 className="text-3xl font-bold text-on-background mt-1 font-headline">{totalSales.toFixed(0)} FCFA</h3>
        </div>
        <div className="metric-card">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-primary/10 text-primary rounded-lg">
              <span className="material-symbols-outlined">receipt_long</span>
            </span>
          </div>
          <p className="text-on-primary-container text-sm font-semibold uppercase tracking-wider">Transactions</p>
          <h3 className="text-3xl font-bold text-on-background mt-1 font-headline">{sales.length}</h3>
        </div>
        <div className="metric-card">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-tertiary/10 text-tertiary rounded-lg">
              <span className="material-symbols-outlined">inventory_2</span>
            </span>
          </div>
          <p className="text-on-primary-container text-sm font-semibold uppercase tracking-wider">Articles vendus</p>
          <h3 className="text-3xl font-bold text-on-background mt-1 font-headline">{totalQty}</h3>
        </div>
        <div className="metric-card">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-tertiary/10 text-tertiary rounded-lg">
              <span className="material-symbols-outlined">trending_up</span>
            </span>
          </div>
          <p className="text-on-primary-container text-sm font-semibold uppercase tracking-wider">Bénéfice Total</p>
          <h3 className="text-3xl font-bold text-tertiary mt-1 font-headline">{totalProfit.toFixed(0)} FCFA</h3>
        </div>
      </div>

      {/* GESTION DES UTILISATEURS */}
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-xl font-bold font-headline">
            <span className="material-symbols-outlined align-middle mr-2 text-secondary">manage_accounts</span>
            Gestion des utilisateurs
          </h3>
          <span className="badge badge-positive">{users.length} utilisateurs</span>
        </div>

        {assignMsg && (
          <div className={`p-3 rounded-xl text-sm font-semibold mb-4 ${assignMsg.includes('Erreur') ? 'bg-error/10 text-error' : 'bg-tertiary/10 text-tertiary'}`}>
            {assignMsg}
          </div>
        )}

        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl gap-3 ${
              u.role === 'pending'
                ? 'bg-secondary/10 border-2 border-secondary/40'
                : 'bg-surface-container-high'
            }`}>
              <div className="flex items-center gap-3">
                <img
                  className="w-11 h-11 rounded-full border-2 border-secondary/20 flex-shrink-0"
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=e9c176&color=412d00&size=80`}
                  alt={u.name}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-headline font-bold text-on-background">{u.name}</p>
                    {u.role === 'pending' && (
                      <span className="text-[10px] bg-secondary/20 text-secondary font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        ⏳ Nouveau
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-primary-container">{u.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`badge ${
                  u.role === 'admin' ? 'bg-secondary/10 text-secondary' :
                  u.role === 'manager' ? 'bg-primary/10 text-primary' :
                  u.role === 'pending' ? 'bg-secondary/20 text-secondary' :
                  'badge-positive'
                }`}>
                  {roleLabel(u.role)}
                </span>

                {/* Changer le rôle — sauf pour soi-même et les admins */}
                {u.id !== currentUser?.id && u.role !== 'admin' && (
                  <select
                    value={u.role}
                    onChange={e => handleAssignRole(u.id, e.target.value)}
                    className={`px-3 py-2 rounded-lg border-none outline-none text-sm cursor-pointer ${
                      u.role === 'pending'
                        ? 'bg-secondary text-on-secondary font-bold'
                        : 'bg-surface-container-lowest text-on-background'
                    }`}
                  >
                    {u.role === 'pending' && (
                      <option value="pending" disabled>-- Choisir un rôle --</option>
                    )}
                    {assignableRoles.map(r => (
                      <option key={r} value={r}>{roleLabel(r)}</option>
                    ))}
                  </select>
                )}

                {/* Bouton supprimer — sauf soi-même */}
                {u.id !== currentUser?.id && (
                  <button
                    onClick={() => handleDeleteUser(u)}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-error/10 text-error font-semibold text-sm rounded-lg hover:bg-error/20 transition-all duration-200 hover:scale-105 active:scale-95"
                    title={`Supprimer ${u.name}`}
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                    <span className="hidden sm:inline">Supprimer</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-on-primary-container text-center py-8">Aucun utilisateur</p>
          )}
        </div>
      </div>

      {/* GESTION DES PRODUITS */}
      <div className="card">
        <h3 className="text-xl font-bold font-headline mb-6">Gestion des produits</h3>
        <ProductForm employees={users.filter(u => ['employee','caissier','manager'].includes(u.role))} onSaved={refresh} role={role} />
        <div className="mt-6">
          <ProductList
            products={products}
            onSelect={() => {}}
            onDelete={handleDeleteProduct}
            role={role}
            employees={users}
          />
        </div>
      </div>

      {/* COMPTES À REMETTRE PAR CAISSIER */}
      <div className="card">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold font-headline">
            <span className="material-symbols-outlined align-middle mr-2 text-secondary">account_balance_wallet</span>
            Comptes à remettre — Par caissier
          </h3>
        </div>
        <p className="text-sm text-on-primary-container mb-6">
          Pour chaque caissier, montant total que chaque employé doit lui remettre en fin de journée.
        </p>

        {/* Caissiers = utilisateurs avec rôle caissier ou admin/manager qui font des ventes */}
        {(() => {
          // Trouver tous les utilisateurs qui ont enregistré des ventes (created_by)
          const cashierIds = [...new Set(sales.map(s => String(s.created_by)).filter(Boolean))]
          const cashiers = users.filter(u => cashierIds.includes(String(u.id)))

          if (cashiers.length === 0) {
            return <p className="text-on-primary-container text-center py-8">Aucune vente enregistrée</p>
          }

          return (
            <div className="space-y-6">
              {cashiers.map(cashier => {
                // Toutes les ventes faites PAR ce caissier
                const cashierSales = sales.filter(s => String(s.created_by) === String(cashier.id))
                const cashierTotal = cashierSales.reduce((a, s) => a + Number(s.total_sale || s.totalSale || 0), 0)

                // Grouper par employé (employee_id)
                const employeeIds = [...new Set(cashierSales.map(s => String(s.employee_id)).filter(Boolean))]

                return (
                  <div key={cashier.id} className="border border-outline-variant/20 rounded-2xl overflow-hidden">
                    {/* En-tête caissier */}
                    <div className="flex items-center justify-between p-4 bg-secondary/10">
                      <div className="flex items-center gap-3">
                        <img
                          className="w-10 h-10 rounded-full border-2 border-secondary/30"
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(cashier.name)}&background=e9c176&color=412d00&size=80`}
                          alt={cashier.name}
                        />
                        <div>
                          <p className="font-headline font-bold text-on-background">{cashier.name}</p>
                          <p className="text-xs text-on-primary-container capitalize">{roleLabel(cashier.role)} • {cashierSales.length} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-on-primary-container font-semibold uppercase">Total encaissé</p>
                        <p className="text-2xl font-bold text-secondary font-headline">{cashierTotal.toFixed(0)} FCFA</p>
                      </div>
                    </div>

                    {/* Détail par employé */}
                    <div className="p-4 space-y-3">
                      {employeeIds.map(empId => {
                        const emp = users.find(u => String(u.id) === empId)
                        const empSales = cashierSales.filter(s => String(s.employee_id) === empId)
                        const empQty = empSales.reduce((a, s) => a + Number(s.qty || s.quantity || 0), 0)
                        const empAmt = empSales.reduce((a, s) => a + Number(s.total_sale || s.totalSale || 0), 0)

                        return (
                          <div key={empId} className="p-3 bg-surface-container-high rounded-xl">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <img
                                  className="w-8 h-8 rounded-full"
                                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp?.name || empId)}&background=2d4a6e&color=d7e2ff&size=60`}
                                  alt={emp?.name || empId}
                                />
                                <div>
                                  <p className="font-semibold text-on-background text-sm">{emp?.name || `Employé #${empId}`}</p>
                                  <p className="text-[10px] text-on-primary-container">{empQty} articles • {empSales.length} ventes</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-secondary">{empAmt.toFixed(0)} FCFA</p>
                                <p className="text-[10px] text-on-primary-container">à remettre</p>
                              </div>
                            </div>
                            {/* Détail des ventes de cet employé */}
                            <div className="space-y-1 mt-2 max-h-40 overflow-y-auto">
                              {empSales.slice().reverse().map(s => {
                                const prod = products.find(p => String(p.id) === String(s.product_id))
                                return (
                                  <div key={s.id} className="flex justify-between items-center text-xs px-2 py-1 bg-surface-container rounded-lg">
                                    <span className="text-on-background">{prod?.name || s.productName || 'Produit'}</span>
                                    <span className="text-on-primary-container">×{s.qty || s.quantity}</span>
                                    <span className="text-secondary font-bold">{Number(s.total_sale || s.totalSale || 0).toFixed(0)} FCFA</span>
                                    <span className="text-on-primary-container">{s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : ''}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}

                      {/* Bouton export pour ce caissier */}
                      <button
                        onClick={() => {
                          const rows = cashierSales.map(s => {
                            const prod = products.find(p => String(p.id) === String(s.product_id))
                            const emp = users.find(u => String(u.id) === String(s.employee_id))
                            return {
                              'Caissier': cashier.name,
                              'Employé': emp?.name || s.employeeName || 'N/A',
                              'Produit': prod?.name || s.productName || 'Inconnu',
                              'Quantité': Number(s.qty || s.quantity || 0),
                              'Prix unitaire': Number(s.unit_price || 0),
                              'Total': Number(s.total_sale || s.totalSale || 0),
                              'Bénéfice': Number(s.total_profit || s.totalProfit || 0),
                              'Date': s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : '',
                            }
                          })
                          exportProductSalesToExcel(`compte_caissier_${cashier.name}_${new Date().toISOString().split('T')[0]}.xlsx`, rows)
                        }}
                        className="w-full mt-2 py-2 bg-surface-container text-on-primary-container text-xs font-bold rounded-xl hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Exporter le compte de {cashier.name}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>

      {/* PERFORMANCE PAR EMPLOYÉ */}
      <div className="card">
        <h3 className="text-xl font-bold font-headline mb-6">Performance par employé</h3>
        <div className="space-y-4">
          {users.map(emp => {
            const prods = products.filter(p => p.declared_for_user_id === emp.id || p.employeeId === emp.id)
            const empSales = sales.filter(s => String(s.employee_id) === String(emp.id) || String(s.employeeId) === String(emp.id))
            const empTotalQty = empSales.reduce((a, s) => a + Number(s.qty || s.quantity || 0), 0)
            const empTotalAmount = empSales.reduce((a, s) => a + Number(s.total_sale || s.totalSale || 0), 0)
            const empProfit = empSales.reduce((a, s) => a + Number(s.total_profit || s.totalProfit || 0), 0)
            return (
              <div key={emp.id} className="p-4 bg-surface-container-high rounded-xl">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      className="w-10 h-10 rounded-full border-2 border-secondary/20"
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=e9c176&color=412d00&size=80`}
                      alt={emp.name}
                    />
                    <div>
                      <p className="font-headline font-bold text-on-background">{emp.name}</p>
                      <p className="text-xs text-on-primary-container capitalize">{roleLabel(emp.role)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadEmployeeReport(emp.id)}
                    className="px-3 py-1 bg-secondary text-on-secondary text-xs font-bold rounded-full hover:opacity-90 transition-opacity"
                  >
                    Exporter
                  </button>
                </div>
                <div className="flex gap-4 text-sm flex-wrap">
                  <span className="text-on-primary-container">{prods.length} produits</span>
                  <span className="text-on-primary-container">{empTotalQty} articles vendus</span>
                  <span className="text-secondary font-bold">{empTotalAmount.toFixed(0)} FCFA</span>
                  <span className="text-tertiary font-bold">Bénéfice: {empProfit.toFixed(0)} FCFA</span>
                </div>
              </div>
            )
          })}
          {users.length === 0 && (
            <p className="text-on-primary-container text-center py-8">Aucun employé</p>
          )}
        </div>
      </div>

      {/* VENTES RÉCENTES */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold font-headline">Ventes récentes</h3>
          <span className="badge badge-positive">{sales.length} transactions</span>
        </div>
        {sales.length === 0 ? (
          <p className="text-on-primary-container text-center py-8">Aucune vente enregistrée</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sales.slice().reverse().slice(0, 20).map(s => {
              const name = s.productName || products.find(p => String(p.id) === String(s.product_id) || String(p.id) === String(s.productId))?.name || 'Produit inconnu'
              return (
                <div key={s.id} className="flex justify-between items-center p-4 bg-surface-container-high rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">inventory_2</span>
                    </div>
                    <div>
                      <p className="font-headline font-semibold text-on-background">{name}</p>
                      <p className="text-xs text-on-primary-container">
                        Qté: {s.qty || s.quantity} • Pour: {s.employeeName || 'N/A'} • Par: {s.createdByName || 'N/A'} • {s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-secondary font-bold">{Number(s.total_sale || s.totalSale || 0).toFixed(0)} FCFA</p>
                    <p className="text-xs text-tertiary">+{Number(s.total_profit || s.totalProfit || 0).toFixed(0)} bén.</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* HISTORIQUE JOURNALIER PAR PRODUIT */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold font-headline">Historique journalier par produit</h3>
          <button onClick={exportDailyProductSummary} className="btn-secondary">
            Exporter journalier
          </button>
        </div>
        {dailyProductSummary.length === 0 ? (
          <p className="text-on-primary-container text-center py-8">Aucune vente enregistrée</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {dailyProductSummary.map(item => (
              <div key={`${item.date}_${item.productId}`} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-4 bg-surface-container-high rounded-xl text-sm">
                <div>
                  <p className="font-semibold text-on-background">{item.productName}</p>
                  <p className="text-xs text-on-primary-container">Produit</p>
                </div>
                <div>
                  <p className="font-semibold text-on-background">{item.date}</p>
                  <p className="text-xs text-on-primary-container">Date</p>
                </div>
                <div>
                  <p className="font-semibold text-on-background">{item.qty}</p>
                  <p className="text-xs text-on-primary-container">Quantité vendue</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-secondary">{item.total.toFixed(0)} FCFA</p>
                  <p className="text-xs text-on-primary-container">Total journalier</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TOTAUX PAR PRODUIT */}
      <div className="card">
        <h3 className="text-xl font-bold font-headline mb-6">Totaux par produit</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => {
            const pSales = sales.filter(s => String(s.product_id) === String(p.id) || String(s.productId) === String(p.id))
            const qty = pSales.reduce((a, s) => a + Number(s.qty || s.quantity || 0), 0)
            const amt = pSales.reduce((a, s) => a + Number(s.total_sale || s.totalSale || 0), 0)
            return (
              <div key={p.id} className="p-4 bg-surface-container-high rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-headline font-bold text-on-background">{p.name}</p>
                    <p className="text-xs text-on-primary-container">Prix: {p.sale_price || p.salePrice} FCFA</p>
                  </div>
                  <div className="text-right">
                    <p className="text-tertiary font-bold">{qty} unités</p>
                    <p className="text-xs text-on-primary-container">{amt.toFixed(0)} FCFA</p>
                  </div>
                </div>
              </div>
            )
          })}
          {products.length === 0 && (
            <p className="text-on-primary-container col-span-3 text-center py-8">Aucun produit</p>
          )}
        </div>
      </div>

    </div>
  )
}
