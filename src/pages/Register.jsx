import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { register } from '../utils/api'

export default function Register({ onRegister }){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e){
    e.preventDefault()
    if(password !== passwordConfirm){
      alert('Les mots de passe ne correspondent pas')
      return
    }
    setLoading(true)
    try{
      const data = await register(name, email, password, passwordConfirm)
      onRegister && onRegister(data)
    }catch(err){
      alert(err.message || 'Erreur lors de l\'inscription')
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
            Créer un nouveau compte
          </p>
        </div>

        {/* Formulaire d'inscription */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Nom complet
              </label>
              <input
                type="text"
                value={name}
                onChange={e=>setName(e.target.value)}
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

            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={e=>setPasswordConfirm(e.target.value)}
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
                  Création...
                </>
              ) : (
                "S'inscrire"
              )}
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

        {/* Footer décoratif */}
        <p className="text-center text-xs text-on-surface-variant mt-8">
          © 2024 The Digital Sommelier. Tous droits réservés.
        </p>
      </div>
    </div>
  )
}
