import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-stone-50/50 flex flex-col items-center justify-center p-4">
      <div className="bg-white border border-stone-200/60 rounded-3xl p-10 text-center max-w-md w-full shadow-lg">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
          🔍
        </div>
        <h1 className="text-2xl font-black text-stone-900 mb-2">Page introuvable</h1>
        <p className="text-sm text-stone-500 font-medium mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Link 
          href="/"
          className="inline-block w-full bg-emerald-800 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-emerald-900 transition-colors shadow-sm"
        >
          Retourner à l'accueil
        </Link>
      </div>
    </main>
  )
}
