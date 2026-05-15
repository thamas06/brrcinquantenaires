import React, { useState, useEffect } from 'react'
import ProductForm from '../components/ProductForm'
import ProductList from '../components/ProductList'
import { getProducts, getSales, getEmployees } from '../utils/storage'
import { assignRole } from '../utils/api'
import { exportProductSalesToExcel } from '../utils/exportExcel'

export default function Manager({ role, employees, currentUser, onLogout }){
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [users, setUsers] = useState([])

  useEffect(()=>{
    async function load(){
      setProducts(await getProducts())
      setSales(await getSales())
      setUsers(await getEmployees())
    }
    load()
  },[])

  async function refresh(){ setProducts(await getProducts()); setSales(await getSales()) }
  async function refreshUsers(){ setUsers(await getEmployees()) }

  async function downloadEmployeeReport(empId){
    const token = localStorage.getItem('gd_api_token')
    if(token){
      try{
        const res = await fetch(`/api/reports/employee/${empId}`, { headers: { Authorization: 'Bearer ' + token } })
        if(res.ok){
          const rows = await res.json()
          exportProductSalesToExcel(`${empId}_report.xlsx`, rows)
          return
        }
      }catch(e){
        console.warn('API report failed, falling back to local data', e)
      }
    }

    // Fallback local
    try{
      const prodForEmp = products.filter(p=>p.declared_for_user_id===empId || p.employeeId===empId)
      const rows = []
      prodForEmp.forEach(p=>{
        const salesForP = sales.filter(s=>s.product_id===p.id || s.productId===p.id)
        salesForP.forEach(s=> rows.push({ product: p.name, qty: s.qty || s.quantity || 0, totalSale: s.total_sale || s.totalSale || 0, totalProfit: null, employee: s.employeeName || emp.name || empId }))
      })
      exportProductSalesToExcel(`${empId}_report_local.xlsx`, rows)
    }catch(err){ console.error(err); alert('Erreur lors de l\'export local') }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-on-background font-headline">
            Tableau de bord - Manager
          </h2>
          <p className="text-on-primary-container mt-2">
            Gestion des ventes et des employés
          </p>
        </div>
        <button
          onClick={onLogout}
          className="btn-secondary"
        >
          Déconnexion
        </button>
      </div>

      {/* Section produits */}
      <div className="card">
        <h3 className="text-xl font-bold font-headline mb-6">Gestion des produits</h3>
        <ProductForm employees={employees} onSaved={refresh} role={role} />
        <div className="mt-6">
          <ProductList products={products} onSelect={()=>{}} role={role} employees={employees} />
        </div>
      </div>

      {/* Deux colonnes: Employés et Ventes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gestion des utilisateurs */}
        <div className="card">
          <h3 className="text-xl font-bold font-headline mb-6">Utilisateurs</h3>
          {currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager') && (
            <div className="space-y-3">
              {users.map(u=> (
                <div key={u.id} className="flex items-center justify-between p-4 bg-surface-container-high rounded-xl">
                  <div>
                    <p className="font-headline font-bold text-on-background">{u.name}</p>
                    <p className="text-xs text-on-primary-container">{u.email}</p>
                  </div>
                  <select
                    value={u.role}
                    onChange={async e=>{
                      try{
                        await assignRole(u.id, e.target.value)
                        await refreshUsers()
                        setUsers(await getEmployees())
                      }catch(err){
                        console.error(err)
                        alert('Erreur lors de la mise à jour')
                      }
                    }}
                    className="bg-surface-container-lowest text-on-background px-3 py-2 rounded-lg border-none outline-none text-sm"
                  >
                    <option value="caissier">Caissier</option>
                    <option value="employee">Employé</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Performance par employé */}
        <div className="card">
          <h3 className="text-xl font-bold font-headline mb-6">Récapitulatif par employé</h3>
          <div className="space-y-4">
            {employees.map(emp=>{
              const prods = products.filter(p=>p.declared_for_user_id===emp.id || p.employeeId===emp.id)
              const empSales = sales.filter(s=>String(s.employee_id)===String(emp.id) || String(s.employeeId)===String(emp.id))
              const empTotalQty = empSales.reduce((a,s)=>a + (s.qty||s.quantity||0),0)
              const empTotalAmount = empSales.reduce((a,s)=>a + (s.total_sale||s.totalSale||0),0)
              return (
                <div key={emp.id} className="p-4 bg-surface-container-high rounded-xl">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-headline font-bold text-on-background">{emp.name}</p>
                      <p className="text-xs text-on-primary-container">{emp.email}</p>
                    </div>
                    <button
                      onClick={()=>downloadEmployeeReport(emp.id)}
                      className="px-3 py-1 bg-secondary text-on-secondary text-xs font-bold rounded-full hover:opacity-90 transition-opacity"
                    >
                      Excel
                    </button>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-on-primary-container">{prods.length} produits</span>
                    <span className="text-on-primary-container">{empTotalQty} ventes</span>
                    <span className="text-secondary font-bold">{empTotalAmount.toFixed(0)} FCFA</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-2">Gains: *** (non visible)</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Totaux par produit */}
      <div className="card">
        <h3 className="text-xl font-bold font-headline mb-6">Totaux par produit</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p=>{
            const pSales = sales.filter(s=>String(s.product_id)===String(p.id) || String(s.productId)===String(p.id))
            const qty = pSales.reduce((a,s)=>a + (s.qty||s.quantity||0),0)
            const amt = pSales.reduce((a,s)=>a + (s.total_sale||s.totalSale||0),0)
            return (
              <div key={p.id} className="p-4 bg-surface-container-high rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-headline font-bold text-on-background">{p.name}</p>
                    <p className="text-xs text-on-primary-container">Prix: {p.price} FCFA</p>
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
