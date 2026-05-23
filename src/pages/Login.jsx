import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../utils/api'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      onLogin && onLogin(data)
      // Redirection selon le rôle
      const role = data?.user?.role
      if (role === 'admin') navigate('/admin')
      else if (role === 'manager') navigate('/manager')
      else if (role === 'caissier') navigate('/caissier')
      else navigate('/caissier')
    } catch (err) {
      setError('Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl font-bold text-secondary font-headline italic">
            Bar Restaurant Le Cinquantenaires
          </span>
          <p className="text-on-primary-container mt-2">
            Connectez-vous à votre espace
          </p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 p-3 bg-error/10 text-error rounded-xl text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  Connexion...
                </>
              ) : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-on-surface-variant">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-secondary font-semibold hover:underline">
                S'inscrire
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-on-surface-variant mt-8">
          © 2024 Bar Restaurant Le Cinquantenaires. Tous droits réservés.
        </p>
      </div>
    </div>
  )
}
