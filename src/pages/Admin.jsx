import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ProductForm from '../components/ProductForm'
import ProductList from '../components/ProductList'
import { getProducts, getSales, getEmployees, deleteProduct } from '../utils/storage'
import { exportProductSalesToExcel } from '../utils/exportExcel'

export default function Admin({ role, employees, currentUser, onLogout }) {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])

  useEffect(() => {
    async function load() {
      setProducts(await getProducts())
      setSales(await getSales())
    }
    load()
    const interval = setInterval(async () => {
      setSales(await getSales())
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  async function refresh() {
    setProducts(await getProducts())
    setSales(await getSales())
  }

  async function handleDeleteProduct(productId) {
    try {
      await deleteProduct(productId)
      await refresh()
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression du produit')
    }
  }

  async function downloadEmployeeReport(empId) {
    // Ventes directement liées à l'employé
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
        'Benefice': role === 'admin' ? Number(s.total_profit || s.totalProfit || 0) : undefined,
        Employe: s.employeeName || empId,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
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
      </div>

      {/* GESTION DES ROLES */}
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold font-headline mb-2">Gestion des rôles</h3>
            <p className="text-on-primary-container text-sm">L'admin et le manager peuvent attribuer des rôles aux utilisateurs depuis la page de gestion.</p>
          </div>
          <Link
            to="/manager"
            className="btn-primary"
          >
            Aller à la gestion des rôles
          </Link>
        </div>
      </div>

      {/* GESTION DES PRODUITS */}
      <div className="card">
        <h3 className="text-xl font-bold font-headline mb-6">Gestion des produits</h3>
        <ProductForm employees={employees} onSaved={refresh} role={role} />
        <div className="mt-6">
          <ProductList
            products={products}
            onSelect={() => {}}
            onDelete={handleDeleteProduct}
            role={role}
            employees={employees}
          />
        </div>
      </div>

      {/* PERFORMANCE PAR EMPLOYÉ */}
      <div className="card">
        <h3 className="text-xl font-bold font-headline mb-6">Performance par employé</h3>
        <div className="space-y-4">
          {employees.map(emp => {
            const prods = products.filter(p => p.declared_for_user_id === emp.id || p.employeeId === emp.id)
            const empSales = sales.filter(s => String(s.employee_id) === String(emp.id) || String(s.employeeId) === String(emp.id))
            const empTotalQty = empSales.reduce((a, s) => a + Number(s.qty || s.quantity || 0), 0)
            const empTotalAmount = empSales.reduce((a, s) => a + Number(s.total_sale || s.totalSale || 0), 0)
            const empProfit = empSales.reduce((a, s) => a + Number(s.total_profit || s.totalProfit || 0), 0)
            return (
              <div key={emp.id} className="p-4 bg-surface-container-high rounded-xl">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-headline font-bold text-on-background">{emp.name}</p>
                    <p className="text-xs text-on-primary-container capitalize">{emp.role || 'Employé'}</p>
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
                  <span className="text-on-primary-container">{empTotalQty} ventes</span>
                  <span className="text-secondary font-bold">{empTotalAmount.toFixed(0)} FCFA</span>
                  {role === 'admin' && (
                    <span className="text-tertiary font-bold">Bénéfice: {empProfit.toFixed(0)} FCFA</span>
                  )}
                </div>
              </div>
            )
          })}
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
            {sales.slice().reverse().slice(0, 10).map(s => {
              const prod = products.find(p => String(p.id) === String(s.product_id) || String(p.id) === String(s.productId))
              return (
                <div key={s.id} className="flex justify-between items-center p-4 bg-surface-container-high rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">inventory_2</span>
                    </div>
                    <div>
                      <p className="font-headline font-semibold text-on-background">{prod?.name || 'Produit inconnu'}</p>
                      <p className="text-xs text-on-primary-container">Qté: {s.qty || s.quantity} • {s.employeeName || 'N/A'}</p>
                    </div>
                  </div>
                  <p className="text-secondary font-bold">{Number(s.total_sale || s.totalSale || 0).toFixed(0)} FCFA</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* TOTAUX PAR PRODUIT */}
      <div className="card">
        <h3 className="text-xl font-bold font-headline mb-6">Totaux par produit</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => {
            const pSales = sales.filter(s => s.product_id === p.id || s.productId === p.id)
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
        </div>
      </div>

    </div>
  )
}
