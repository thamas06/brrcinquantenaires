import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { saveSale } from '../utils/storage'

export default function SaleForm({ product, employees, onSold, role }){
  const [employeeId, setEmployeeId] = useState('')
  const [qty, setQty] = useState(1)
  const [availableStock, setAvailableStock] = useState(null)

  const unitPrice = Number(product.sale_price || product.salePrice || 0)
  const unitProfit = Number(product.sale_price || product.salePrice) - Number(product.cost_price || product.costPrice || 0)
  const total = unitPrice * Number(qty)

  useEffect(() => {
    // Initialiser l'employé
    if (employees.length > 0 && !employeeId) {
      setEmployeeId(employees[0].id)
    }
    // Mettre à jour le stock disponible
    setAvailableStock(product.stock ?? product.stock === 0 ? product.stock : null)
  }, [product, employees])

  async function handleSubmit(e){
    e.preventDefault()
    const q = Number(qty)
    if(availableStock !== null && q > availableStock){
      alert('Quantité supérieure au stock disponible')
      return
    }
    const sale = {
      product_id: product.id,
      employee_id: employeeId || null,
      qty: q
    }
    try{
      await saveSale(sale)
      Swal.fire({
        icon: 'success',
        title: 'Vente réussie',
        text: 'La vente a bien été enregistrée.',
        timer: 1500,
        showConfirmButton: false
      })
      onSold && onSold()
    }catch(err){
      console.error(err)
      alert('Erreur lors de l\'enregistrement de la vente')
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête du produit */}
      <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/10">
        <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
          <span className="material-symbols-outlined">inventory_2</span>
        </div>
        <div>
          <h3 className="font-headline font-bold text-on-background text-lg">
            {product.name}
          </h3>
          <p className="text-xs text-on-primary-container">
            {availableStock !== null ? `${availableStock} en stock` : 'Stock illimité'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Employé */}
        <div>
          <label className="block text-sm font-semibold text-on-surface-variant mb-2">
            Vendu par
          </label>
          <select
            value={employeeId}
            onChange={e=>setEmployeeId(e.target.value)}
            className="input-field"
          >
            {employees.map(emp=> (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>

        {/* Quantité */}
        <div>
          <label className="block text-sm font-semibold text-on-surface-variant mb-2">
            Quantité
          </label>
          <input
            type="number"
            value={qty}
            onChange={e=>setQty(e.target.value)}
            className="input-field"
            min={1}
            max={availableStock || undefined}
            required
          />
          {availableStock !== null && availableStock < 10 && (
            <p className="text-xs text-error mt-1">
              Stock bas: seulement {availableStock} restants
            </p>
          )}
        </div>

        {/* Résumé de la commande */}
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

        {/* Bouton de validation */}
        <button
          type="submit"
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">check_circle</span>
          Confirmer la vente
        </button>
      </form>
    </div>
  )
}
