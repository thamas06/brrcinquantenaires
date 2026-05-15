const TOKEN_KEY = 'gd_api_token'

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
  return fetch(path, Object.assign({}, opts, { headers }))
}

export async function login(email, password){
  const res = await fetch('/api/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) })
  if(!res.ok) throw new Error('Invalid credentials')
  const data = await res.json()
  setToken(data.token)
  return data
}

export async function register(name, email, password, password_confirmation){
  const res = await fetch('/api/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password, password_confirmation }) })
  if(!res.ok){
    const err = await res.json().catch(()=>({message:'Registration failed'}))
    throw new Error(err.message || 'Registration failed')
  }
  const data = await res.json()
  setToken(data.token)
  return data
}

export async function assignRole(userId, role){
  const res = await authFetch(`/api/users/${userId}/role`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ role }) })
  if(!res.ok) throw new Error('Role assignment failed')
  return await res.json()
}

export async function logout(){
  await authFetch('/api/logout', { method: 'POST' })
  setToken(null)
}
