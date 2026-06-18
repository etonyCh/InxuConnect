'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error);
    // TODO: Sentry.captureException(error);
    console.log("SENTRY_MOCK: Error logged to Sentry", error);
  }, [error])

  return (
    <main className="min-h-screen bg-stone-50/50 flex flex-col items-center justify-center p-4">
      <div className="bg-white border border-stone-200/60 rounded-3xl p-10 text-center max-w-md w-full shadow-lg">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
          ⚠️
        </div>
        <h1 className="text-2xl font-black text-stone-900 mb-2">Oups !</h1>
        <p className="text-sm text-stone-500 font-medium mb-8">
          Une erreur inattendue est survenue. Nous nous en excusons.
        </p>
        <button
          onClick={() => reset()}
          className="w-full bg-emerald-800 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-emerald-900 transition-colors shadow-sm"
        >
          Réessayer
        </button>
      </div>
    </main>
  )
}
