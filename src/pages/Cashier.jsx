import React, { useState, useEffect } from 'react'
import ProductList from '../components/ProductList'
import SaleForm from '../components/SaleForm'
import { getProducts, getEmployees, getSales } from '../utils/storage'
import { exportProductSalesToExcel } from '../utils/exportExcel'

export default function Cashier({ currentUser, onLogout, role }) {
  const [products, setProducts] = useState([])
  const [employees, setEmployees] = useState([])
  const [selected, setSelected] = useState(null)
  const [sales, setSales] = useState([])

  useEffect(() => {
    async function load() {
      setProducts(await getProducts())
      setEmployees(await getEmployees())
      setSales(await getSales())
    }
    load()
  }, [])

  async function refresh() { setProducts(await getProducts()) }
  async function refreshSales() { setSales(await getSales()) }

  function exportSalesAll() {
    try {
      if (sales.length === 0) {
        alert('Aucune vente à exporter')
        return
      }
      const rows = sales.map(s => {
        const prod = products.find(p =>
          String(p.id) === String(s.product_id) ||
          String(p.id) === String(s.productId)
        )
        return {
          Produit: prod?.name || 'Inconnu',
          Quantite: Number(s.qty || s.quantity || 0),
          'Prix unitaire': Number(s.unit_price || 0),
          'Total vente': Number(s.total_sale || s.totalSale || 0),
          Employe: s.employeeName || 'N/A',
          Date: s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : ''
        }
      })
      exportProductSalesToExcel('ventes_export.xlsx', rows)
    } catch (e) {
      console.error(e)
    }
  }

  const totalSales = sales.reduce((a, s) => a + Number(s.total_sale || s.totalSale || 0), 0)
  const totalQty = sales.reduce((a, s) => a + Number(s.qty || s.quantity || 0), 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-on-background font-headline">
            Point de Vente
          </h2>
          <p className="text-on-primary-container mt-2">
            Interface de caisse — {currentUser?.name || 'Caissier'}
          </p>
        </div>
        <button onClick={exportSalesAll} className="btn-secondary">
          Exporter ventes
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="metric-card">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-secondary/10 text-secondary rounded-lg">
              <span className="material-symbols-outlined">payments</span>
            </span>
          </div>
          <p className="text-on-primary-container text-sm font-semibold uppercase tracking-wider">Total ventes</p>
          <h3 className="text-3xl font-bold text-on-background mt-2 font-headline">{totalSales.toFixed(0)} FCFA</h3>
        </div>
        <div className="metric-card">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-tertiary/10 text-tertiary rounded-lg">
              <span className="material-symbols-outlined">inventory_2</span>
            </span>
          </div>
          <p className="text-on-primary-container text-sm font-semibold uppercase tracking-wider">Articles vendus</p>
          <h3 className="text-3xl font-bold text-on-background mt-2 font-headline">{totalQty}</h3>
        </div>
        <div className="metric-card">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-primary/10 text-primary rounded-lg">
              <span className="material-symbols-outlined">receipt_long</span>
            </span>
          </div>
          <p className="text-on-primary-container text-sm font-semibold uppercase tracking-wider">Transactions</p>
          <h3 className="text-3xl font-bold text-on-background mt-2 font-headline">{sales.length}</h3>
        </div>
      </div>

      {/* Zone de travail principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-xl font-bold font-headline mb-6">Produits disponibles</h3>
            <ProductList
              products={products}
              onSelect={setSelected}
              role={role}
              employees={employees}
            />
          </div>
        </div>

        <div className="card sticky top-24">
          <h3 className="text-xl font-bold font-headline mb-6">Nouvelle vente</h3>
          {selected ? (
            <SaleForm
              product={selected}
              employees={employees}
              onSold={() => {
                setSelected(null)
                refresh()
                refreshSales()
              }}
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

      {/* Ventes récentes */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold font-headline">Ventes récentes</h3>
          <span className="badge badge-positive">{sales.length} transactions</span>
        </div>
        {sales.length === 0 ? (
          <p className="text-on-primary-container text-center py-8">Aucune vente enregistrée</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sales.slice().reverse().slice(0, 15).map(s => {
              const prod = products.find(p => String(p.id) === String(s.product_id) || String(p.id) === String(s.productId))
              return (
                <div key={s.id} className="flex justify-between items-center p-4 bg-surface-container-high rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">inventory_2</span>
                    </div>
                    <div>
                      <p className="font-headline font-semibold text-on-background">
                        {prod?.name || 'Produit inconnu'}
                      </p>
                      <p className="text-xs text-on-primary-container">
                        Qté: {s.qty || s.quantity} • {s.employeeName || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <p className="text-secondary font-bold">
                    {Number(s.total_sale || s.totalSale || 0).toFixed(0)} FCFA
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Résumé par employé et par produit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <h3 className="text-xl font-bold font-headline mb-6">Totaux par employé</h3>
          {employees.map(emp => {
            const empSales = sales.filter(s => String(s.employee_id) === String(emp.id) || String(s.employeeId) === String(emp.id))
            const qty = empSales.reduce((a, s) => a + Number(s.qty || s.quantity || 0), 0)
            const amt = empSales.reduce((a, s) => a + Number(s.total_sale || s.totalSale || 0), 0)
            return (
              <div key={emp.id} className="p-4 bg-surface-container-high rounded-xl mb-3 last:mb-0">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-headline font-bold text-on-background">{emp.name}</p>
                    <p className="text-xs text-on-primary-container capitalize">{emp.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-tertiary font-bold">{qty} articles</p>
                    <p className="text-xs text-on-primary-container">{amt.toFixed(0)} FCFA</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="card">
          <h3 className="text-xl font-bold font-headline mb-6">Totaux par produit</h3>
          {products.map(p => {
            const pSales = sales.filter(s => String(s.product_id) === String(p.id) || String(s.productId) === String(p.id))
            const qty = pSales.reduce((a, s) => a + Number(s.qty || s.quantity || 0), 0)
            const amt = pSales.reduce((a, s) => a + Number(s.total_sale || s.totalSale || 0), 0)
            return (
              <div key={p.id} className="p-4 bg-surface-container-high rounded-xl mb-3 last:mb-0">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-headline font-bold text-on-background">{p.name}</p>
                    <p className="text-xs text-on-primary-container">Prix: {p.sale_price || p.salePrice} FCFA</p>
                  </div>
                  <div className="text-right">
                    <p className="text-secondary font-bold">{qty} vendus</p>
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
