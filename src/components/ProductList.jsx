import React, { useState } from 'react'

export default function ProductList({ products, onSelect, role, employees }){
  const [showAll, setShowAll] = useState(false)

  // Filtrer et trier les produits
  const sortedProducts = [...products].sort((a, b) => {
    const aDeclared = a.declared_for_user_id || a.employeeId
    const bDeclared = b.declared_for_user_id || b.employeeId
    // Les produits non déclarés en premier
    if (!aDeclared && bDeclared) return -1
    if (aDeclared && !bDeclared) return 1
    return 0
  })

  const displayedProducts = showAll ? sortedProducts : sortedProducts.slice(0, 8)

  // Fonction pour obtenir le nom de l'employé
  const getEmployeeName = (empId) => {
    if (!empId) return null
    const emp = employees.find(e => String(e.id) === String(empId))
    return emp ? emp.name : 'Inconnu'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold font-headline text-on-background">
          Produits ({products.length})
        </h3>
        {products.length > 8 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-secondary font-semibold hover:underline"
          >
            {showAll ? 'Voir moins' : `Voir tout (${products.length})`}
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-surface-container-low rounded-2xl border-2 border-dashed border-outline-variant/30">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-50">
            inventory_2
          </span>
          <p className="text-on-primary-container mt-2">Aucun produit enregistré</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedProducts.map(p => {
            const employeeId = p.declared_for_user_id || p.employeeId
            const employeeName = getEmployeeName(employeeId)
            const isDeclared = !!employeeId

            return (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border transition-all duration-300 ${
                  isDeclared
                    ? 'bg-surface-container-high border-l-4 border-l-tertiary'
                    : 'bg-surface-container-low border border-outline-variant/20 hover:border-primary/30'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="font-headline font-bold text-on-background text-lg">
                      {p.name}
                    </p>
                    {isDeclared && (
                      <p className="text-xs text-tertiary font-semibold mt-1">
                        DÉCLARÉ PAR {employeeName?.toUpperCase()}
                      </p>
                    )}
                  </div>
                  {isDeclared && (
                    <span className="badge badge-positive text-[8px]">Assigné</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <p className="text-xs text-on-surface-variant">Prix vente</p>
                    <p className="font-bold text-secondary">
                      {(p.salePrice || p.sale_price || 0).toLocaleString()} FCFA
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Stock</p>
                    <p className={`font-bold ${p.stock && p.stock < 10 ? 'text-error' : 'text-on-background'}`}>
                      {p.stock ?? p.stock === 0 ? p.stock : '∞'}
                    </p>
                  </div>
                  {role === 'admin' && (
                    <>
                      <div>
                        <p className="text-xs text-on-surface-variant">Coût</p>
                        <p className="font-medium text-on-surface-variant">
                          {(p.costPrice || p.cost_price || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-on-surface-variant">Bénéfice</p>
                        <p className="font-medium text-tertiary">
                          {((p.salePrice || p.sale_price || 0) - (p.costPrice || p.cost_price || 0)).toLocaleString()} FCFA
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => onSelect && onSelect(p)}
                  disabled={!isDeclared && role !== 'admin'}
                  className={`w-full py-2.5 rounded-xl font-headline font-bold text-sm transition-all ${
                    isDeclared || role === 'admin'
                      ? 'btn-primary flex items-center justify-center gap-2'
                      : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">shopping_cart</span>
                  {isDeclared ? 'Vendre maintenant' : 'En attente de déclaration'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
