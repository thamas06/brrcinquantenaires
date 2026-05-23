import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { saveProduct, getProducts, saveSale } from '../utils/storage'

export default function ProductForm({ employees, onSaved, role }){
  const [name, setName] = useState('')
  const [purchasePrice, setPurchasePrice] = useState(0)
  const [costPrice, setCostPrice] = useState(0)
  const [salePrice, setSalePrice] = useState(0)
  const [stock, setStock] = useState(0)
  const [employeeId, setEmployeeId] = useState('')
  const [existingProducts, setExistingProducts] = useState([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedQty, setSelectedQty] = useState(1)

  const profit = Number(salePrice) - Number(costPrice)

  useEffect(()=>{
    if(role !== 'admin'){
      (async ()=>{
        const prods = await getProducts()
        setExistingProducts(prods)
      })()
    }
  },[role])

  async function handleSubmit(e){
    e.preventDefault()
    try{
      if(role === 'admin'){
        const p = {
          name,
          purchase_price: Number(purchasePrice),
          cost_price: Number(costPrice),
          sale_price: Number(salePrice),
          profit,
          stock: Number(stock || 0),
          declared_for_user_id: employeeId || null
        }
        await saveProduct(p)
        Swal.fire({
          icon: 'success',
          title: 'Produit créé',
          text: 'Le produit a bien été enregistré.',
          timer: 1500,
          showConfirmButton: false
        })
        onSaved && onSaved()
        setName('')
        setPurchasePrice(0)
        setCostPrice(0)
        setSalePrice(0)
        setStock(0)
        setEmployeeId('')
      }else{
        const src = existingProducts.find(x=>String(x.id) === String(selectedProductId))
        if(!src){
          alert('Sélectionnez un produit existant')
          return
        }
        const sale = {
          product_id: src.id,
          employee_id: employeeId || null,
          qty: Number(selectedQty || 1)
        }
        await saveSale(sale)
        Swal.fire({
          icon: 'success',
          title: 'Déclaration enregistrée',
          text: 'La vente a bien été déclarée.',
          timer: 1500,
          showConfirmButton: false
        })
        onSaved && onSaved()
        setSelectedProductId('')
        setEmployeeId('')
        setSelectedQty(1)
      }
    }catch(err){
      console.error(err)
      alert(role === 'admin' ? 'Erreur lors de la création du produit' : 'Erreur lors de l\'enregistrement de la déclaration')
    }
  }

  const selectedProduct = existingProducts.find(p => String(p.id) === String(selectedProductId))

  return (
    <div className="card">
      <h3 className="text-xl font-bold font-headline mb-6">
        {role === 'admin' ? 'Créer un produit' : 'Déclarer une vente'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nom du produit */}
        <div>
          <label className="block text-sm font-semibold text-on-surface-variant mb-2">
            {role === 'admin' ? 'Nom du produit' : 'Sélectionner un produit'}
          </label>
          {role === 'admin' ? (
            <input
              type="text"
              value={name}
              onChange={e=>setName(e.target.value)}
              className="input-field"
              placeholder="Ex: Château Margaux 2015"
              required
            />
          ) : (
            <select
              value={selectedProductId}
              onChange={e=>setSelectedProductId(e.target.value)}
              className="input-field"
              required
            >
              <option value="">-- Choisir un produit --</option>
              {existingProducts.map(p=> (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.salePrice || p.sale_price} FCFA
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Champs admin uniquement */}
        {role === 'admin' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Prix d'achat
              </label>
              <input
                type="number"
                value={purchasePrice}
                onChange={e=>setPurchasePrice(e.target.value)}
                className="input-field"
                min={0}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Prix de revient
              </label>
              <input
                type="number"
                value={costPrice}
                onChange={e=>setCostPrice(e.target.value)}
                className="input-field"
                min={0}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Prix de vente
              </label>
              <input
                type="number"
                value={salePrice}
                onChange={e=>setSalePrice(e.target.value)}
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
                onChange={e=>setStock(e.target.value)}
                className="input-field"
                min={0}
                required
              />
            </div>
          </div>
        )}

        {/* Champs quantité pour non-admin */}
        {role !== 'admin' && (
          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-2">
              Quantité vendue
            </label>
            <input
              type="number"
              value={selectedQty}
              onChange={e=>setSelectedQty(e.target.value)}
              className="input-field"
              min={1}
              required
            />
            {selectedProduct && (
              <p className="text-xs text-on-primary-container mt-2">
                Prix unitaire: <span className="font-bold text-secondary">{selectedProduct.salePrice || selectedProduct.sale_price} FCFA</span>
              </p>
            )}
          </div>
        )}

        {/* Employé associé */}
        <div>
          <label className="block text-sm font-semibold text-on-surface-variant mb-2">
            Associer à un employé (optionnel)
          </label>
          <select
            value={employeeId}
            onChange={e=>setEmployeeId(e.target.value)}
            className="input-field"
          >
            <option value="">-- Aucun --</option>
            {employees.map(emp=> (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>

        {/* Profit (admin seulement) */}
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

        {/* Bouton soumission */}
        <button
          type="submit"
          className="w-full btn-primary flex justify-center items-center gap-2"
        >
          <span className="material-symbols-outlined">
            {role === 'admin' ? 'add' : 'point_of_sale'}
          </span>
          {role === 'admin' ? 'Créer le produit' : 'Enregistrer la vente'}
        </button>
      </form>
    </div>
  )
}
