const TOKEN_KEY = 'gd_api_token'

const API_BASE = import.meta.env.VITE_API_URL || ''

export function setToken(t){
  if(t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

export function getToken(){
  return localStorage.getItem(TOKEN_KEY)
}

export async function authFetch(path, opts = {}){
  const token = getToken()
  const headers = Object.assign({}, opts.headers || {})
  if(token) headers['Authorization'] = 'Bearer ' + token
  return fetch(API_BASE + path, Object.assign({}, opts, { headers }))
}

export async function login(email, password){
  const res = await fetch(API_BASE + '/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json().catch(() => null)
  if(!res.ok || !data?.token){
    throw new Error(data?.message || 'Email ou mot de passe incorrect')
  }
  setToken(data.token)
  return data
}

export async function register(name, email, password, password_confirmation){
  const res = await fetch(API_BASE + '/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, password_confirmation })
  })
  const data = await res.json().catch(() => null)
  console.error('register response status:', res.status)
  console.error('register response data:', JSON.stringify(data))
  if(!res.ok || !data?.token){
    if(data?.errors){
      const firstError = Object.values(data.errors)[0]
      throw new Error(Array.isArray(firstError) ? firstError[0] : firstError)
    }
    throw new Error(data?.message || 'Erreur lors de l\'inscription')
  }
  setToken(data.token)
  return data
}

export async function assignRole(userId, role){
  const res = await authFetch(`/api/users/${userId}/role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role })
  })
  if(!res.ok) throw new Error('Role assignment failed')
  return await res.json()
}

export async function logout(){
  await authFetch('/api/logout', { method: 'POST' })
  setToken(null)
}
