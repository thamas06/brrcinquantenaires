import React, { useState } from 'react'
import Swal from 'sweetalert2'
import { saveProduct } from '../utils/storage'

export default function ProductForm({ employees, onSaved, role }) {
  const [name, setName]                 = useState('')
  const [purchasePrice, setPurchasePrice] = useState(0)
  const [costPrice, setCostPrice]       = useState(0)
  const [salePrice, setSalePrice]       = useState(0)
  const [stock, setStock]               = useState(0)
  const [employeeId, setEmployeeId]     = useState('')

  const profit = Number(salePrice) - Number(costPrice)
  const isAdminOrManager = role === 'admin' || role === 'manager'

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const p = {
        name,
        purchase_price:       Number(purchasePrice),
        cost_price:           Number(costPrice),
        sale_price:           Number(salePrice),
        profit,
        stock:                Number(stock || 0),
        declared_for_user_id: employeeId || null
      }
      await saveProduct(p)
      Swal.fire({
        icon: 'success',
        title: 'Produit créé',
        text: 'Le produit a bien été enregistré.',
        timer: 1500,
        showConfirmButton: false,
        background: '#142034',
        color: '#d7e2ff',
      })
      onSaved && onSaved()
      setName('')
      setPurchasePrice(0)
      setCostPrice(0)
      setSalePrice(0)
      setStock(0)
      setEmployeeId('')
    } catch (err) {
      console.error(err)
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.message || 'Erreur lors de la création du produit',
        background: '#142034',
        color: '#d7e2ff',
      })
    }
  }

  if (!isAdminOrManager) return null

  return (
    <div className="card mb-6">
      <h3 className="text-xl font-bold font-headline mb-6">Créer un produit</h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nom */}
        <div>
          <label className="block text-sm font-semibold text-on-surface-variant mb-2">
            Nom du produit
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="input-field"
            placeholder="Ex: Bière Pression"
            required
          />
        </div>

        {/* Prix */}
        <div className="grid grid-cols-2 gap-4">
          {role === 'admin' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                  Prix d'achat
                </label>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={e => setPurchasePrice(e.target.value)}
                  className="input-field"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                  Prix de revient
                </label>
                <input
                  type="number"
                  value={costPrice}
                  onChange={e => setCostPrice(e.target.value)}
                  className="input-field"
                  min={0}
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-2">
              Prix de vente
            </label>
            <input
              type="number"
              value={salePrice}
              onChange={e => setSalePrice(e.target.value)}
              className="input-field"
              min={0}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-2">
              Stock initial
            </label>
            <input
              type="number"
              value={stock}
              onChange={e => setStock(e.target.value)}
              className="input-field"
              min={0}
              required
            />
          </div>
        </div>

        {/* Employé associé */}
        <div>
          <label className="block text-sm font-semibold text-on-surface-variant mb-2">
            Assigner à un caissier (optionnel)
          </label>
          <select
            value={employeeId}
            onChange={e => setEmployeeId(e.target.value)}
            className="input-field"
          >
            <option value="">-- Aucun --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
            ))}
          </select>
        </div>

        {/* Bénéfice (admin seulement) */}
        {role === 'admin' && (
          <div className="p-4 bg-surface-container-high rounded-xl">
            <p className="text-sm text-on-surface-variant">
              Bénéfice unitaire attendu:{' '}
              <span className="text-2xl font-bold text-secondary font-headline ml-2">
                {profit.toFixed(0)} FCFA
              </span>
            </p>
          </div>
        )}

        <button type="submit" className="w-full btn-primary flex justify-center items-center gap-2">
          <span className="material-symbols-outlined">add</span>
          Créer le produit
        </button>
      </form>
    </div>
  )
}
