'use client'

import React from 'react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-stone-950 border-t border-stone-850 text-stone-400 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-850">
          
          {/* Logo & Description */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-baseline gap-0.5">
              <span className="text-xl font-extrabold text-white tracking-tight">Inzu</span>
              <span className="text-xl font-extrabold text-emerald-500 tracking-tight">Connect</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-1"></span>
            </Link>
            <p className="text-xs text-stone-500 leading-relaxed">
              Le premier réseau de confiance pour la location de logements au Burundi. Logements vérifiés, sécurité garantie et paiements intégrés par Mobile Money.
            </p>
            <div className="flex gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 bg-stone-900 border border-stone-800 text-stone-300 rounded-lg">🇧🇮 Burundi</span>
              <span className="text-xs font-semibold px-2.5 py-1 bg-stone-900 border border-stone-800 text-stone-300 rounded-lg">EcoCash / Lumicash</span>
            </div>
          </div>

          {/* Destinations */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Villes Desservies</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/?city=Bujumbura" className="hover:text-white transition-colors">Bujumbura (Capitale Économique)</Link></li>
              <li><Link href="/?city=Gitega" className="hover:text-white transition-colors">Gitega (Capitale Politique)</Link></li>
              <li><Link href="/?city=Ngozi" className="hover:text-white transition-colors">Ngozi (Nord)</Link></li>
              <li><span className="text-stone-600 cursor-not-allowed">Muyinga (Bientôt disponible)</span></li>
            </ul>
          </div>

          {/* Company / Legals */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Ressources & Légal</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/b2b" className="hover:text-white transition-colors">Espace B2B & ONG</Link></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Conditions Générales (CGU)</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Politique de Confidentialité</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Support Client & SOS</span></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">InzuNews</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Inscrivez-vous pour recevoir les nouveaux logements vérifiés disponibles et nos guides de voyage au Burundi.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="Votre email"
                className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 flex-1"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
              >
                S'inscrire
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 text-xs text-stone-500">
          <div>
            &copy; {new Date().getFullYear()} InzuConnect Ltd. Tous droits réservés.
          </div>
          
          {/* Lang Selector */}
          <div className="flex items-center gap-4">
            <div className="flex gap-1 border border-stone-850 bg-stone-900 rounded-lg p-0.5">
              <button className="bg-stone-800 text-white px-2 py-1 rounded font-bold text-[10px]">FR</button>
              <button className="text-stone-500 hover:text-white px-2 py-1 rounded font-bold text-[10px]">RN (Kirundi)</button>
            </div>
            <span>Fait avec ❤️ à Bujumbura</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
