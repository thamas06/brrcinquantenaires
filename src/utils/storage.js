import * as api from './api'

const P_PRODUCTS  = 'gd_products'
const P_SALES     = 'gd_sales'
const P_EMPLOYEES = 'gd_employees'

export function initDemoData(){
  if(!localStorage.getItem(P_PRODUCTS))  localStorage.setItem(P_PRODUCTS,  JSON.stringify([]))
  if(!localStorage.getItem(P_SALES))     localStorage.setItem(P_SALES,     JSON.stringify([]))
  if(!localStorage.getItem(P_EMPLOYEES)) localStorage.setItem(P_EMPLOYEES, JSON.stringify([]))
}

// Vérifie si la réponse est 401 et nettoie le token si nécessaire
function checkAuth(res) {
  if (res.status === 401) {
    api.setToken(null)
    // Recharger la page pour forcer la redirection vers login
    window.location.href = '/login'
    throw new Error('Session expirée. Veuillez vous reconnecter.')
  }
  return res
}

export async function getEmployees(){
  const token = api.getToken()
  if(token){
    try {
      const res = await api.authFetch('/api/users')
      checkAuth(res)
      if(!res.ok) return []
      return await res.json()
    } catch (err) {
      if (err.message?.includes('Session expirée')) throw err
      return []
    }
  }
  return JSON.parse(localStorage.getItem(P_EMPLOYEES) || '[]')
}

export async function getProducts(){
  const token = api.getToken()
  if(token){
    try {
      const res = await api.authFetch('/api/products')
      checkAuth(res)
      if(!res.ok) return []
      const data = await res.json()
      return data.map(normalizeProduct)
    } catch (err) {
      if (err.message?.includes('Session expirée')) throw err
      return []
    }
  }
  const raw = JSON.parse(localStorage.getItem(P_PRODUCTS) || '[]')
  return raw.map(normalizeProduct)
}

function normalizeProduct(p){
  const purchase_price       = Number(p.purchase_price ?? p.purchasePrice ?? 0)
  const cost_price           = Number(p.cost_price     ?? p.costPrice     ?? 0)
  const sale_price           = Number(p.sale_price     ?? p.salePrice     ?? 0)
  const stock                = Number(p.stock          ?? p.initial_stock ?? 0)
  const declared_for_user_id = p.declared_for_user_id  ?? p.declaredForUserId ?? p.employeeId ?? null
  return {
    ...p,
    purchase_price,
    cost_price,
    sale_price,
    stock,
    purchasePrice:        purchase_price,
    costPrice:            cost_price,
    salePrice:            sale_price,
    declared_for_user_id,
    declaredForUserId:    declared_for_user_id,
    employeeId:           declared_for_user_id,
  }
}

function ensureAuthenticated(action) {
  const token = api.getToken()
  if(!token) throw new Error(`Vous devez être connecté pour ${action}.`)
  return token
}

export async function saveProduct(p){
  ensureAuthenticated('créer ce produit')
  const res = await api.authFetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p)
  })
  checkAuth(res)
  if(!res.ok){
    const err = await res.json().catch(() => null)
    throw new Error(err?.message || 'Impossible de créer le produit')
  }
  return normalizeProduct(await res.json())
}

export async function deleteProduct(productId){
  ensureAuthenticated('supprimer ce produit')
  const res = await api.authFetch(`/api/products/${productId}`, { method: 'DELETE' })
  checkAuth(res)
  if(!res.ok){
    const err = await res.json().catch(() => null)
    throw new Error(err?.message || 'Impossible de supprimer le produit')
  }
  return true
}

export async function getSales(){
  const token = api.getToken()
  if(token){
    try {
      const res = await api.authFetch('/api/sales')
      checkAuth(res)
      if(!res.ok) return []
      const data = await res.json()
      return data.map(normalizeSale)
    } catch (err) {
      if (err.message?.includes('Session expirée')) throw err
      return []
    }
  }
  const raw       = JSON.parse(localStorage.getItem(P_SALES) || '[]')
  const employees = await getEmployees()
  return raw.map(s => ({
    ...normalizeSale(s),
    employeeName: employees.find(e => String(e.id) === String(s.employee_id))?.name ?? 'N/A'
  }))
}

function normalizeSale(s){
  const product_id   = s.product_id  ?? s.productId  ?? null
  const employee_id  = s.employee_id ?? s.employeeId ?? null
  const qty          = Number(s.qty          ?? s.quantity  ?? 0)
  const unit_price   = Number(s.unit_price   ?? s.unitPrice ?? 0)
  const total_sale   = Number(s.total_sale   ?? s.totalSale ?? (unit_price * qty))
  const total_profit = Number(s.total_profit ?? s.totalProfit ?? 0)
  return {
    ...s,
    product_id,
    employee_id,
    created_by:    s.created_by    ?? s.createdBy    ?? null,
    productId:     product_id,
    employeeId:    employee_id,
    qty,
    unit_price,
    total_sale,
    total_profit,
    // Le backend retourne "employeeName" directement dans la réponse JSON
    employeeName:  s.employeeName  ?? s.employee?.name  ?? 'N/A',
    // Le backend retourne "createdByName" directement — pas "created_by_user"
    createdByName: s.createdByName ?? s.createdBy?.name ?? s.created_by_user?.name ?? null,
    productName:   s.productName   ?? s.product?.name   ?? null,
  }
}

export async function saveSale(s){
  ensureAuthenticated('enregistrer cette vente')
  const res = await api.authFetch('/api/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(s)
  })
  checkAuth(res)
  if(!res.ok){
    const err = await res.json().catch(() => null)
    throw new Error(err?.message || 'Erreur lors de la vente')
  }
  return normalizeSale(await res.json())
}

export function clearAll(){
  localStorage.removeItem(P_PRODUCTS)
  localStorage.removeItem(P_SALES)
  localStorage.removeItem(P_EMPLOYEES)
}
