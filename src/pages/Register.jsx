import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../utils/api'

export default function Register({ onRegister }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setLoading(true)
    try {
      const data = await register(name, email, password, passwordConfirm)
      onRegister && onRegister(data)
      // Après inscription, rôle par défaut = caissier → redirection login
      navigate('/login')
    } catch (err) {
      console.error(err.message)
      setError(err.message || 'Erreur lors de l\'inscription')
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
            Créer un nouveau compte
          </p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 p-3 bg-error/10 text-error rounded-xl text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Nom complet
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field"
                placeholder="Jean Dupont"
                required
              />
            </div>

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

            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="p-3 bg-surface-container-high rounded-xl">
              <p className="text-xs text-on-primary-container">
                <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
                Après inscription, un administrateur devra vous attribuer un rôle avant que vous puissiez accéder au système.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  Création...
                </>
              ) : "S'inscrire"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-on-surface-variant">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-secondary font-semibold hover:underline">
                Se connecter
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
