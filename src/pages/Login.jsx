import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { login } from '../utils/api'

export default function Login({ onLogin }){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e){
    e.preventDefault()
    setLoading(true)
    try{
      const data = await login(email,password)
      onLogin && onLogin(data)
    }catch(err){
      alert('Échec de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <span className="text-4xl font-bold text-secondary font-headline italic">
            The Digital Sommelier
          </span>
          <p className="text-on-primary-container mt-2">
            Connectez-vous à votre espace
          </p>
        </div>

        {/* Formulaire de connexion */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e=>setEmail(e.target.value)}
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
                onChange={e=>setPassword(e.target.value)}
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
              ) : (
                'Se connecter'
              )}
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

        {/* Footer décoratif */}
        <p className="text-center text-xs text-on-surface-variant mt-8">
          © 2024 The Digital Sommelier. Tous droits réservés.
        </p>
      </div>
    </div>
  )
}
