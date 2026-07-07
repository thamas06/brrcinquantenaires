import React from 'react'

export default function Pending({ currentUser, onLogout }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md text-center">

        {/* Icône */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-secondary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-secondary">hourglass_top</span>
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-3xl font-bold font-headline text-on-background mb-3">
          Compte en attente
        </h1>

        {/* Message */}
        <p className="text-on-primary-container mb-2">
          Bonjour <span className="font-bold text-on-background">{currentUser?.name}</span>,
        </p>
        <p className="text-on-primary-container mb-8">
          Votre compte a bien été créé. Un administrateur doit vous attribuer un rôle avant que vous puissiez accéder au système.
        </p>

        {/* Info */}
        <div className="card mb-6 text-left space-y-3">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-secondary mt-0.5">check_circle</span>
            <p className="text-sm text-on-primary-container">Votre compte est créé et actif</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-secondary mt-0.5">check_circle</span>
            <p className="text-sm text-on-primary-container">Vos identifiants sont enregistrés</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-on-primary-container mt-0.5">pending</span>
            <p className="text-sm text-on-primary-container">En attente d'attribution de rôle par un administrateur</p>
          </div>
        </div>

        <p className="text-xs text-on-primary-container mb-6">
          Contactez votre administrateur pour activer votre accès.
        </p>

        {/* Bouton déconnexion */}
        <button
          onClick={onLogout}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          Se déconnecter
        </button>

      </div>
    </div>
  )
}
