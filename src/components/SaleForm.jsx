import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { saveSale } from '../utils/storage'

export default function SaleForm({ product, employees, onSold, role, currentUser }) {
  const [employeeId, setEmployeeId] = useState('')
  const [qty, setQty] = useState('')
  const [loading, setLoading] = useState(false)

  const unitPrice  = Number(product.sale_price || product.salePrice || 0)
  const unitProfit = unitPrice - Number(product.cost_price || product.costPrice || 0)
  const total      = unitPrice * Number(qty || 0)
  const stock      = Number(product.stock ?? 0)
  const isUnlimited = stock === 0

  // Quand le produit change, reset la quantité et l'employé sélectionné
  // On ne pré-sélectionne JAMAIS automatiquement pour forcer un choix conscient
  useEffect(() => {
    setQty('')
    setEmployeeId('')
  }, [product.id])

  // Quand la liste d'employés change, reset si l'employé sélectionné n'existe plus
  useEffect(() => {
    if (employeeId && !employees.find(e => String(e.id) === String(employeeId))) {
      setEmployeeId('')
    }
  }, [employees.length])

  const selectedEmployee = employees.find(e => String(e.id) === String(employeeId))

  async function handleSubmit(e) {
    e.preventDefault()
    const q = Number(qty)

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

    if (!qty || q < 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Quantité invalide',
        text: 'La quantité doit être au moins 1',
        background: '#142034',
        color: '#d7e2ff',
      })
      return
    }

    if (!employeeId) {
      Swal.fire({
        icon: 'warning',
        title: 'Employé requis',
        text: 'Veuillez sélectionner un employé pour cette vente',
        background: '#142034',
        color: '#d7e2ff',
      })
      return
    }

    setLoading(true)
    try {
      await saveSale({
        product_id:  product.id,
        employee_id: employeeId,
        created_by:  currentUser?.id,
        qty:         q
      })
      Swal.fire({
        icon: 'success',
        title: 'Vente enregistrée !',
        html: `
          <p><strong>${product.name}</strong> × ${q}</p>
          <p>Pour : <strong>${selectedEmployee?.name || 'Employé'}</strong></p>
          <p class="text-xl font-bold mt-2">${total.toLocaleString()} FCFA</p>
        `,
        timer: 2000,
        showConfirmButton: false,
        background: '#142034',
        color: '#d7e2ff',
      })
      setQty('')
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

        {/* Sélection de l'employé — toujours visible */}
        <div>
          <label className="block text-sm font-semibold text-on-surface-variant mb-2">
            Vente au nom de l'employé <span className="text-error">*</span>
          </label>
          {employees.length === 0 ? (
            <div className="p-3 bg-error/10 text-error rounded-xl text-sm">
              Aucun employé disponible. Contactez votre manager.
            </div>
          ) : (
            <select
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              className="input-field"
              required
            >
              <option value="">-- Sélectionner un employé --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role === 'caissier' ? 'Caissier' : 'Employé'})
                </option>
              ))}
            </select>
          )}
          {selectedEmployee && (
            <p className="text-xs text-tertiary mt-1 font-semibold">
              ✓ Cette vente sera comptée dans le compte de {selectedEmployee.name}
            </p>
          )}
        </div>

        {/* Quantité */}
        <div>
          <label className="block text-sm font-semibold text-on-surface-variant mb-2">
            Quantité
          </label>
          <input
            type="number"
            value={qty}
            onChange={e => setQty(e.target.value)}
            className="input-field"
            min={1}
            max={isUnlimited ? undefined : stock}
            placeholder="0"
            required
          />
          {!isUnlimited && stock < 10 && stock > 0 && (
            <p className="text-xs text-error mt-1">⚠ Stock bas : {stock} restant(s)</p>
          )}
          {!isUnlimited && stock === 0 && (
            <p className="text-xs text-error mt-1">✗ Produit épuisé</p>
          )}
        </div>

        {/* Résumé de la vente */}
        <div className="p-4 bg-surface-container-high rounded-xl space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant">Prix unitaire</span>
            <span className="font-semibold text-on-background">{unitPrice.toLocaleString()} FCFA</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant">Quantité</span>
            <span className="font-semibold text-on-background">{qty || 0}</span>
          </div>
          {selectedEmployee && (
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Compte de</span>
              <span className="font-semibold text-tertiary">{selectedEmployee.name}</span>
            </div>
          )}
          <div className="border-t border-outline-variant/20 pt-3 flex justify-between">
            <span className="font-headline font-bold text-on-background">Total</span>
            <span className="font-headline font-bold text-secondary text-xl">
              {total.toLocaleString()} FCFA
            </span>
          </div>
          {(role === 'admin' || role === 'manager') && unitProfit > 0 && Number(qty) > 0 && (
            <div className="flex justify-between text-xs pt-2 border-t border-outline-variant/10">
              <span className="text-on-surface-variant">Bénéfice estimé</span>
              <span className="text-tertiary font-bold">+{(unitProfit * Number(qty)).toLocaleString()} FCFA</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || (!isUnlimited && stock === 0) || !employeeId}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="material-symbols-outlined animate-spin">refresh</span>
          ) : (
            <span className="material-symbols-outlined">check_circle</span>
          )}
          {loading ? 'Enregistrement...' : `Confirmer — ${total.toLocaleString()} FCFA`}
        </button>
      </form>
    </div>
  )
}
