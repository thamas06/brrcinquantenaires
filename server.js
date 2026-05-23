const express = require('express')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const USERS_FILE = path.join(__dirname, 'users.txt')
const SECRET = process.env.AUTH_SECRET || 'dev_secret'
const PORT = process.env.PORT || 4000

if(!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '')

function readUsers(){
  const raw = fs.readFileSync(USERS_FILE, 'utf8').trim()
  if(!raw) return []
  return raw.split('\n').map(l=>{
    try{ return JSON.parse(l) }catch(e){ return null }
  }).filter(Boolean)
}

function writeUser(u){
  fs.appendFileSync(USERS_FILE, JSON.stringify(u) + '\n')
}

function saveUsers(users){
  fs.writeFileSync(USERS_FILE, users.map(u => JSON.stringify(u)).join('\n') + (users.length ? '\n' : ''), 'utf8')
}

// Ensure default admin exists
const users = readUsers()
if(users.length === 0){
  const admin = { id: 'u_' + Date.now(), name: 'Admin', email: 'admin@local', password: bcrypt.hashSync('admin', 10), role: 'admin' }
  writeUser(admin)
  console.log('Created default admin: email=admin@local password=admin')
}

const app = express()
app.use(cors())
app.use(express.json())

function generateToken(user){
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '7d' })
}

function authMiddleware(req, res, next){
  const h = req.headers['authorization'] || ''
  const m = h.match(/^Bearer (.+)$/)
  if(!m) return res.status(401).json({ message: 'Unauthorized' })
  try{
    const payload = jwt.verify(m[1], SECRET)
    req.user = payload
    next()
  }catch(e){
    return res.status(401).json({ message: 'Invalid token' })
  }
}

app.post('/api/register', (req, res) => {
  const { name, email, password, password_confirmation } = req.body || {}
  if(!name || !email || !password) return res.status(400).json({ message: 'Missing fields' })
  if(password !== password_confirmation) return res.status(400).json({ message: 'Passwords do not match' })
  const users = readUsers()
  if(users.find(u => String(u.email).toLowerCase() === String(email).toLowerCase())) return res.status(400).json({ message: 'Email already exists' })
  const user = { id: 'u_' + Date.now(), name, email, password: bcrypt.hashSync(password, 10), role: 'caissier' }
  writeUser(user)
  const token = generateToken(user)
  const safe = Object.assign({}, user)
  delete safe.password
  res.json({ user: safe, token })
})

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {}
  if(!email || !password) return res.status(400).json({ message: 'Missing credentials' })
  const users = readUsers()
  const user = users.find(u => String(u.email).toLowerCase() === String(email).toLowerCase())
  if(!user) return res.status(401).json({ message: 'Invalid credentials' })
  if(!bcrypt.compareSync(password, user.password)) return res.status(401).json({ message: 'Invalid credentials' })
  const token = generateToken(user)
  const safe = Object.assign({}, user)
  delete safe.password
  res.json({ user: safe, token })
})

app.get('/api/users', authMiddleware, (req, res) => {
  const users = readUsers().map(u => {
    const o = Object.assign({}, u)
    delete o.password
    return o
  })
  res.json(users)
})

app.post('/api/users/:id/role', authMiddleware, (req, res) => {
  const { role } = req.body || {}
  const allowedRoles = ['manager', 'caissier']
  if(!allowedRoles.includes(role)) return res.status(400).json({ message: 'Rôle invalide' })
  if(!['admin','manager'].includes(req.user.role)) return res.status(403).json({ message: 'Permission refusée' })

  const users = readUsers()
  const user = users.find(u => u.id === req.params.id)
  if(!user) return res.status(404).json({ message: 'Utilisateur introuvable' })

  user.role = role
  saveUsers(users)

  const safe = Object.assign({}, user)
  delete safe.password
  res.json(safe)
})

app.listen(PORT, () => console.log('Auth server running on port', PORT))
