import * as api from './api'

const P_PRODUCTS = 'gd_products'
const P_SALES = 'gd_sales'
const P_EMPLOYEES = 'gd_employees'

export function initDemoData(){
  if(!localStorage.getItem(P_EMPLOYEES)){
    const emps = [
      { id: 'e1', name: 'Alice' },
      { id: 'e2', name: 'Bob' }
    ]
    localStorage.setItem(P_EMPLOYEES, JSON.stringify(emps))
  }
  if(!localStorage.getItem(P_PRODUCTS)) localStorage.setItem(P_PRODUCTS, JSON.stringify([]))
  if(!localStorage.getItem(P_SALES)) localStorage.setItem(P_SALES, JSON.stringify([]))
}

export async function getEmployees(){
  const token = api.getToken()
  if(token){
    const res = await api.authFetch('/api/users')
    return await res.json()
  }
  return JSON.parse(localStorage.getItem(P_EMPLOYEES) || '[]')
}

export async function getProducts(){
  const token = api.getToken()
  if(token){
    const res = await api.authFetch('/api/products')
    const data = await res.json()
    return data.map(normalizeProduct)
  }
  const raw = JSON.parse(localStorage.getItem(P_PRODUCTS) || '[]')
  return raw.map(normalizeProduct)
}

function normalizeProduct(p){
  // accept both snake_case (API) and camelCase (local)
  const purchase_price = p.purchase_price ?? p.purchasePrice ?? 0
  const cost_price = p.cost_price ?? p.costPrice ?? 0
  const sale_price = p.sale_price ?? p.salePrice ?? 0
  const stock = p.stock ?? p.initial_stock ?? 0
  const declared_for_user_id = p.declared_for_user_id ?? p.declaredForUserId ?? p.employeeId ?? p.declared_for_user_id ?? p.declared_for_user_id
  return Object.assign({}, p, {
    purchase_price,
    cost_price,
    sale_price,
    stock,
    purchasePrice: purchase_price,
    costPrice: cost_price,
    salePrice: sale_price,
    declared_for_user_id: declared_for_user_id ?? null,
    declaredForUserId: declared_for_user_id ?? null,
    employeeId: declared_for_user_id ?? null
  })
}

export async function saveProduct(p){
  const token = api.getToken()
  if(token){
    const res = await api.authFetch('/api/products', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(p) })
    return await res.json()
  }
  const list = await getProducts()
  p.id = 'p_' + Date.now()
  // ensure there is a stock property locally too
  p.stock = p.stock ?? 0
  list.push(p)
  localStorage.setItem(P_PRODUCTS, JSON.stringify(list))
  return p
}

export async function deleteProduct(productId){
  const token = api.getToken()
  if(token){
    const res = await api.authFetch(`/api/products/${productId}`, { method: 'DELETE' })
    if(!res.ok){
      const err = await res.json().catch(() => null)
      throw new Error(err?.message || 'Impossible de supprimer le produit')
    }
    return true
  }

  const list = await getProducts()
  const updated = list.filter(p => String(p.id) !== String(productId))
  localStorage.setItem(P_PRODUCTS, JSON.stringify(updated))
  return true
}

export async function getSales(){
  const token = api.getToken()
  if(token){
    const res = await api.authFetch('/api/sales')
    const data = await res.json()
    let sales = data.map(normalizeSale)
    try{
      const employees = await getEmployees()
      sales = sales.map(s => Object.assign({}, s, { employeeName: employees.find(e=>String(e.id)===String(s.employee_id))?.name ?? null }))
    }catch(e){ }
    return sales
  }
  const raw = JSON.parse(localStorage.getItem(P_SALES) || '[]')
  let sales = raw.map(normalizeSale)
  const employees = await getEmployees()
  sales = sales.map(s => Object.assign({}, s, { employeeName: employees.find(e=>String(e.id)===String(s.employee_id))?.name ?? null }))
  return sales
}

function normalizeSale(s){
  const product_id = s.product_id ?? s.productId ?? null
  const qty = Number(s.qty ?? s.quantity ?? 0)
  const total_sale = Number(s.total_sale ?? s.totalSale ?? ((s.unit_price ?? s.unitPrice ?? 0) * qty))
  const total_profit = Number(s.total_profit ?? s.totalProfit ?? 0)
  const employee_id = s.employee_id ?? s.employeeId ?? s.employee ?? null
  return Object.assign({}, s, {
    product_id,
    qty,
    total_sale,
    total_profit,
    productId: product_id,
    employee_id: employee_id ?? null,
    employeeId: employee_id ?? null
  })
}

export async function saveSale(s){
  const token = api.getToken()
  if(token){
    const res = await api.authFetch('/api/sales', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(s) })
    return await res.json()
  }
  // local mode: compute unit price and totals from product
  const products = await getProducts()
  const prod = products.find(p=>String(p.id) === String(s.product_id))
  const unitPrice = prod ? (prod.sale_price ?? prod.salePrice ?? 0) : (s.unit_price || 0)
  const unitProfit = prod ? ((prod.sale_price ?? prod.salePrice ?? 0) - (prod.cost_price ?? prod.costPrice ?? 0)) : (s.unit_profit || 0)
  s.unit_price = unitPrice
  s.total_sale = unitPrice * (s.qty || 0)
  s.total_profit = unitProfit * (s.qty || 0)

  const list = await getSales()
  s.id = 's_' + Date.now()
  list.push(s)
  localStorage.setItem(P_SALES, JSON.stringify(list))

  // also decrement product stock in local storage
  if(prod){
    prod.stock = Math.max(0, (prod.stock||0) - (s.qty||0))
    // rewrite products list
    const updated = products.map(p=> p.id === prod.id ? prod : p)
    localStorage.setItem(P_PRODUCTS, JSON.stringify(updated))
  }

  return s
}

export function clearAll(){
  localStorage.removeItem(P_PRODUCTS)
  localStorage.removeItem(P_SALES)
  localStorage.removeItem(P_EMPLOYEES)
}
