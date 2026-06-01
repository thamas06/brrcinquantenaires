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
  const [selectedEmp, setSelectedEmp] = useState(null)
  const saleEmployees = employees.filter(e => ['employee', 'caissier'].includes(e.role))

  useEffect(() => {
    async function load() {
      setProducts(await getProducts())
      setEmployees(await getEmployees())
      setSales(await getSales())
    }
    load()
    const interval = setInterval(async () => {
      setSales(await getSales())
      setProducts(await getProducts())
      setEmployees(await getEmployees())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  async function refresh() {
    setProducts(await getProducts())
    setEmployees(await getEmployees())
  }
  async function refreshSales() { setSales(await getSales()) }

  // Stats personnelles du caissier (ventes filtrées côté backend)
  const employeeSales = sales.filter(s =>
    String(s.created_by) === String(currentUser?.id) &&
    String(s.employee_id) !== String(currentUser?.id) &&
    employees.some(emp => String(emp.id) === String(s.employee_id) && ['employee', 'caissier'].includes(emp.role))
  )
  const totalSales = employeeSales.reduce((a, s) => a + Number(s.total_sale || s.totalSale || 0), 0)
  const totalQty = employeeSales.reduce((a, s) => a + Number(s.qty || s.quantity || 0), 0)

  const dailyProductSummary = Object.values(employeeSales.reduce((acc, s) => {
    const date = s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : 'N/A'
    const productId = String(s.product_id || s.productId || 'unknown')
    const prod = products.find(p => String(p.id) === productId)
    const name = s.productName || prod?.name || 'Produit inconnu'
    const key = `${date}_${productId}`

    if (!acc[key]) {
      acc[key] = {
        date,
        productId,
        productName: name,
        qty: 0,
        total: 0,
      }
    }

    acc[key].qty += Number(s.qty || s.quantity || 0)
    acc[key].total += Number(s.total_sale || s.totalSale || 0)
    return acc
  }, {}))

  function exportMySales() {
    try {
      if (dailyProductSummary.length === 0) {
        alert('Aucune vente à exporter')
        return
      }
      const rows = dailyProductSummary.map(item => ({
        Date: item.date,
        Produit: item.productName,
        Quantite: item.qty,
        'Total vente': item.total,
      }))
      exportProductSalesToExcel('historique_journalier_par_produit.xlsx', rows)
    } catch (e) {
      console.error(e)
    }
  }

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
        <button onClick={exportMySales} className="btn-secondary">
          Exporter mes ventes
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
          <h3 className="text-3xl font-bold text-on-background mt-2 font-headline">{employeeSales.length}</h3>
        </div>
      </div>

      {/* Zone de travail principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-xl font-bold font-headline mb-6">Mes produits assignés</h3>
            <ProductList
              products={products.filter(p => p.declared_for_user_id === currentUser?.id || p.employeeId === currentUser?.id)}
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
              employees={saleEmployees}
              currentUser={currentUser}
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

      {/* Historique journalier par produit */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold font-headline">Historique journalier par produit</h3>
          <span className="badge badge-positive">{dailyProductSummary.length} lignes</span>
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

      {/* COMPTES À REMETTRE EN FIN DE JOURNÉE */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold font-headline">Comptes à remettre (Fin de journée)</h3>
          <span className="badge badge-positive">{saleEmployees.length} employés</span>
        </div>
        <p className="text-sm text-on-primary-container mb-6">
          Toutes les ventes enregistrées au nom des employés. Montant total à remettre à chaque employé.
        </p>
        <div className="space-y-3">
          {saleEmployees.map(emp => {
            const empSales = sales.filter(
              s => String(s.employee_id) === String(emp.id)
            )
            const empQty = empSales.reduce((a, s) => a + Number(s.qty || s.quantity || 0), 0)
            const empAmt = empSales.reduce((a, s) => a + Number(s.total_sale || s.totalSale || 0), 0)
            const isSelected = selectedEmp?.id === emp.id
            return (
              <div key={emp.id}>
                <div 
                  onClick={() => setSelectedEmp(isSelected ? null : emp)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    isSelected 
                      ? 'bg-secondary/20 border-secondary shadow-lg' 
                      : 'bg-surface-container-high border-transparent hover:bg-surface-container-highest'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <img
                        className="w-12 h-12 rounded-full object-cover"
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=e9c176&color=412d00&size=80`}
                        alt={emp.name}
                      />
                      <div>
                        <p className="font-headline font-bold text-on-background text-lg">{emp.name}</p>
                        <p className="text-xs text-on-primary-container">{empQty} articles vendus</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-secondary">{empAmt.toFixed(0)}</p>
                      <p className="text-xs text-on-primary-container font-semibold">FCFA à remettre</p>
                    </div>
                  </div>
                </div>
                {isSelected && empSales.length > 0 && (
                  <div className="mt-3 p-4 bg-surface-container rounded-xl space-y-3">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-semibold text-on-primary-container">Détail des ventes</p>
                      <button
                        onClick={() => {
                          const rows = empSales.map(s => {
                            const prod = products.find(p => String(p.id) === String(s.product_id) || String(p.id) === String(s.productId))
                            return {
                              Produit: prod?.name || 'Inconnu',
                              Quantite: Number(s.qty || s.quantity || 0),
                              'Prix unitaire': Number(s.unit_price || 0),
                              'Total': Number(s.total_sale || s.totalSale || 0),
                              'Enregistrée par': s.createdByName || 'N/A',
                              Date: s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : ''
                            }
                          })
                          const totals = [{
                            Produit: '',
                            Quantite: empQty,
                            'Prix unitaire': '',
                            'Total': empAmt.toFixed(0),
                            'Enregistrée par': 'TOTAL',
                            Date: ''
                          }]
                          exportProductSalesToExcel(`compte_${emp.name}_${new Date().toISOString().split('T')[0]}.xlsx`, [...rows, ...totals])
                        }}
                        className="px-3 py-1 bg-secondary text-on-secondary text-xs font-bold rounded-full hover:opacity-90 transition-opacity"
                      >
                        📥 Exporter PDF/Excel
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {empSales.slice().reverse().map(s => {
                        const prod = products.find(p => String(p.id) === String(s.product_id) || String(p.id) === String(s.productId))
                        return (
                          <div key={s.id} className="p-3 bg-surface-container-high rounded-lg flex justify-between items-start text-xs">
                            <div className="flex-1">
                              <p className="font-semibold text-on-background">{prod?.name || 'Produit inconnu'}</p>
                              <p className="text-[10px] text-on-primary-container">Enregistrée par: {s.createdByName || 'N/A'} • {s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : ''}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-on-primary-container">×{s.qty || s.quantity}</p>
                              <p className="text-secondary font-bold">{Number(s.total_sale || s.totalSale || 0).toFixed(0)} FCFA</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="border-t border-outline-variant/30 pt-3 mt-3 flex justify-between items-center font-headline">
                      <span className="text-on-background font-bold">TOTAL</span>
                      <span className="text-xl text-secondary font-bold">{empAmt.toFixed(0)} FCFA</span>
                    </div>
                  </div>
                )}
                {isSelected && empSales.length === 0 && (
                  <div className="mt-3 p-4 bg-surface-container rounded-xl text-center text-xs text-on-primary-container">
                    Aucune vente pour cet employé
                  </div>
                )}
              </div>
            )
          })}
          {saleEmployees.length === 0 && (
            <p className="text-on-primary-container text-center py-8">Aucun employé disponible</p>
          )}
        </div>
      </div>

      {/* Totaux par produit (uniquement mes produits) */}
      <div className="card">
        <h3 className="text-xl font-bold font-headline mb-6">Totaux par produit (mes produits)</h3>
        <div className="space-y-3">
          {products.filter(p => p.declared_for_user_id === currentUser?.id || p.employeeId === currentUser?.id).map(p => {
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