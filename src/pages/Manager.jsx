import React, { useState, useEffect } from 'react'
import ProductForm from '../components/ProductForm'
import ProductList from '../components/ProductList'
import { getProducts, getSales, getEmployees, deleteProduct } from '../utils/storage'
import { assignRole } from '../utils/api'
import { exportProductSalesToExcel } from '../utils/exportExcel'

export default function Manager({ role, employees, currentUser, onLogout }) {
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

  async function refreshUsers() {
    setUsers(await getEmployees())
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

  async function downloadEmployeeReport(empId) {
    try {
      const prodForEmp = products.filter(p => p.declared_for_user_id === empId || p.employeeId === empId)
      const rows = []
      prodForEmp.forEach(p => {
        const salesForP = sales.filter(s => s.product_id === p.id || s.productId === p.id)
        salesForP.forEach(s => rows.push({
          product: p.name,
          qty: s.qty || s.quantity || 0,
          totalSale: s.total_sale || s.totalSale || 0,
          totalProfit: null,
          employee: s.employeeName || empId
        }))
      })
      exportProductSalesToExcel(`${empId}_report.xlsx`, rows)
    } catch (err) {
      console.error(err)
    }
  }

  // Rôles attribuables selon le rôle de l'acteur
  const assignableRoles = role === 'admin'
    ? ['caissier', 'employee', 'manager']
    : ['caissier', 'employee']

  const roleLabel = (r) => {
    if (r === 'admin') return 'Administrateur'
    if (r === 'manager') return 'Manager'
    if (r === 'caissier') return 'Caissier'
    return 'Employé'
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-on-background font-headline">
            Tableau de bord — {roleLabel(role)}
          </h2>
          <p className="text-on-primary-container mt-2">
            Gestion des ventes et des employés
          </p>
        </div>
      </div>

      <div className="card">
        <p className="text-on-primary-container text-sm">
          {role === 'admin'
            ? 'En tant qu’administrateur, vous pouvez attribuer des rôles aux utilisateurs ici.'
            : 'En tant que manager, vous pouvez attribuer des rôles de caissier ou employé aux utilisateurs ici.'}
        </p>
      </div>

      {/* Message de confirmation */}
      {assignMsg && (
        <div className={`p-4 rounded-xl text-sm font-semibold ${assignMsg.includes('Erreur') ? 'bg-error/10 text-error' : 'bg-tertiary/10 text-tertiary'}`}>
          {assignMsg}
        </div>
      )}

      {/* Gestion des rôles utilisateurs */}
      <div className="card">
        <h3 className="text-xl font-bold font-headline mb-6">
          <span className="material-symbols-outlined align-middle mr-2 text-secondary">manage_accounts</span>
          Attribution des rôles
        </h3>
        <div className="space-y-3">
          {users.filter(u => u.id !== currentUser?.id).map(u => (
            <div key={u.id} className="flex items-center justify-between p-4 bg-surface-container-high rounded-xl">
              <div className="flex items-center gap-3">
                <img
                  className="w-10 h-10 rounded-full border-2 border-secondary/20"
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=e9c176&color=412d00&size=80`}
                  alt={u.name}
                />
                <div>
                  <p className="font-headline font-bold text-on-background">{u.name}</p>
                  <p className="text-xs text-on-primary-container">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${u.role === 'admin' ? 'bg-secondary/10 text-secondary' : u.role === 'manager' ? 'bg-primary/10 text-primary' : 'badge-positive'}`}>
                  {roleLabel(u.role)}
                </span>
                {/* Ne pas permettre de changer le rôle d'un admin si on est manager */}
                {!(u.role === 'admin' && role !== 'admin') && (
                  <select
                    value={u.role}
                    onChange={e => handleAssignRole(u.id, e.target.value)}
                    className="bg-surface-container-lowest text-on-background px-3 py-2 rounded-lg border-none outline-none text-sm cursor-pointer"
                  >
                    {assignableRoles.map(r => (
                      <option key={r} value={r}>{roleLabel(r)}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
          {users.filter(u => u.id !== currentUser?.id).length === 0 && (
            <p className="text-on-primary-container text-center py-8">Aucun autre utilisateur</p>
          )}
        </div>
      </div>

      {/* Section produits */}
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

      {/* Deux colonnes: Récap employés et Totaux produits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Récapitulatif par employé */}
        <div className="card">
          <h3 className="text-xl font-bold font-headline mb-6">Récapitulatif par employé</h3>
          <div className="space-y-4">
            {employees.map(emp => {
              const prods = products.filter(p => p.declared_for_user_id === emp.id || p.employeeId === emp.id)
              const empSales = sales.filter(s => String(s.employee_id) === String(emp.id) || String(s.employeeId) === String(emp.id))
              const empTotalQty = empSales.reduce((a, s) => a + Number(s.qty || s.quantity || 0), 0)
              const empTotalAmount = empSales.reduce((a, s) => a + Number(s.total_sale || s.totalSale || 0), 0)
              return (
                <div key={emp.id} className="p-4 bg-surface-container-high rounded-xl">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-headline font-bold text-on-background">{emp.name}</p>
                      <p className="text-xs text-on-primary-container">{emp.email}</p>
                    </div>
                    <button
                      onClick={() => downloadEmployeeReport(emp.id)}
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
                </div>
              )
            })}
          </div>
        </div>

        {/* Totaux par produit */}
        <div className="card">
          <h3 className="text-xl font-bold font-headline mb-6">Totaux par produit</h3>
          <div className="space-y-3">
            {products.map(p => {
              const pSales = sales.filter(s => String(s.product_id) === String(p.id) || String(s.productId) === String(p.id))
              const qty = pSales.reduce((a, s) => a + Number(s.qty || s.quantity || 0), 0)
              const amt = pSales.reduce((a, s) => a + Number(s.total_sale || s.totalSale || 0), 0)
              return (
                <div key={p.id} className="p-4 bg-surface-container-high rounded-xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-headline font-bold text-on-background">{p.name}</p>
                      <p className="text-xs text-on-primary-container">Prix: {p.price || p.sale_price} FCFA</p>
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
    </div>
  )
}
