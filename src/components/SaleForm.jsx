import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { saveSale } from '../utils/storage'

export default function SaleForm({ product, employees, onSold, role, currentUser }) {
  const [employeeId, setEmployeeId] = useState('')
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(false)

  const unitPrice  = Number(product.sale_price || product.salePrice || 0)
  const unitProfit = unitPrice - Number(product.cost_price || product.costPrice || 0)
  const total      = unitPrice * Number(qty)
  const stock      = Number(product.stock ?? 0)
  const isUnlimited = stock === 0
  const isCaissier  = role === 'caissier' || role === 'employee'

  useEffect(() => {
    if (isCaissier && currentUser) {
      setEmployeeId(currentUser.id)
    } else if (employees.length > 0) {
      setEmployeeId(employees[0].id)
    }
    setQty(1)
  }, [product, currentUser])

  async function handleSubmit(e) {
    e.preventDefault()
    const q = Number(qty)

    // Vérification stock côté frontend
    if (!isUnlimited && q > stock) {
      Swal.fire({
        icon: 'warning',
        title: 'Stock insuffisant',
        text: `Stock disponible : ${stock} unité(s)`,
        background: '#142034',
        color: '#d7e2ff',
      })
      return
    }

    setLoading(true)
    try {
      await saveSale({
        product_id:  product.id,
        employee_id: employeeId || null,
        qty:         q
      })
      Swal.fire({
        icon: 'success',
        title: 'Vente réussie !',
        text: `${product.name} × ${q} — ${total.toLocaleString()} FCFA`,
        timer: 1800,
        showConfirmButton: false,
        background: '#142034',
        color: '#d7e2ff',
      })
      onSold && onSold()
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.message || 'Erreur lors de la vente',
        background: '#142034',
        color: '#d7e2ff',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête produit */}
      <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/10">
        <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
          <span className="material-symbols-outlined">inventory_2</span>
        </div>
        <div>
          <h3 className="font-headline font-bold text-on-background text-lg">{product.name}</h3>
          <p className="text-xs text-on-primary-container">
            {isUnlimited ? 'Stock illimité' : `${stock} en stock`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Employé - caché pour caissier */}
        {!isCaissier && (
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-2">
              Vendu par
            </label>
            <select
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              className="input-field"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Quantité */}
        <div>
          <label className="block text-sm font-semibold text-on-surface-variant mb-2">
            Quantité
          </label>
          <input
            type="number"
            value={qty}
            onChange={e => setQty(Math.max(1, Number(e.target.value)))}
            className="input-field"
            min={1}
            max={isUnlimited ? undefined : stock}
            required
          />
          {!isUnlimited && stock < 10 && stock > 0 && (
            <p className="text-xs text-error mt-1">
              ⚠ Stock bas : seulement {stock} restant(s)
            </p>
          )}
          {!isUnlimited && stock === 0 && (
            <p className="text-xs text-error mt-1">
              ✗ Produit épuisé
            </p>
          )}
        </div>

        {/* Résumé */}
        <div className="p-4 bg-surface-container-high rounded-xl space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant">Prix unitaire</span>
            <span className="font-semibold text-on-background">{unitPrice.toLocaleString()} FCFA</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant">Quantité</span>
            <span className="font-semibold text-on-background">{qty}</span>
          </div>
          <div className="border-t border-outline-variant/20 pt-3 flex justify-between">
            <span className="font-headline font-bold text-on-background">Total</span>
            <span className="font-headline font-bold text-secondary text-xl">
              {total.toLocaleString()} FCFA
            </span>
          </div>
          {role === 'admin' && unitProfit > 0 && (
            <div className="flex justify-between text-xs pt-2 border-t border-outline-variant/10">
              <span className="text-on-surface-variant">Bénéfice estimé</span>
              <span className="text-tertiary font-bold">+{(unitProfit * qty).toLocaleString()} FCFA</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || (!isUnlimited && stock === 0)}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="material-symbols-outlined animate-spin">refresh</span>
          ) : (
            <span className="material-symbols-outlined">check_circle</span>
          )}
          {loading ? 'Enregistrement...' : 'Confirmer la vente'}
        </button>
      </form>
    </div>
  )
}
