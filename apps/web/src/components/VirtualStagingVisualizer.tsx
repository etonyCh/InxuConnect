'use client'

import React, { useState } from 'react'

interface FurnitureItem {
  type: string
  position: { x: number; y: number; z: number }
  rotation: number
  color: string
  dimensions?: { w: number; h: number }
}

interface StagingScene {
  roomType: string
  dimensions: { width: number; height: number; depth: number }
  furniture: FurnitureItem[]
  wallColor: string
  floorTexture: string
}

interface VirtualStagingVisualizerProps {
  scene: StagingScene
  listingTitle: string
}

export default function VirtualStagingVisualizer({ scene, listingTitle }: VirtualStagingVisualizerProps) {
  const [wallColor, setWallColor] = useState(scene.wallColor || '#F5F5F4')
  const [floorTexture, setFloorTexture] = useState(scene.floorTexture || 'wood')
  const [selectedItem, setSelectedItem] = useState<FurnitureItem | null>(null)

  // Map floor texture to tailwind class/gradient
  const getFloorBackground = () => {
    switch (floorTexture) {
      case 'wood':
        return 'linear-gradient(135deg, #b45309 0%, #78350f 100%)' // Warm Wood
      case 'tile':
        return 'repeating-conic-gradient(#e5e7eb 0% 25%, #f3f4f6 0% 50%) 50% / 40px 40px' // Modern Tile
      case 'carpet':
        return 'radial-gradient(#d1d5db 20%, transparent 20%), radial-gradient(#9ca3af 20%, transparent 20%)' // Soft Carpet
      default:
        return '#d1d5db'
    }
  };

  const getFloorTextureLabel = () => {
    switch (floorTexture) {
      case 'wood': return 'Bois de Teck'
      case 'tile': return 'Carrelage Cérame'
      case 'carpet': return 'Moquette Bouclée'
      default: return floorTexture
    }
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl relative">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            ✨ Staging Virtuel 3D IA
          </span>
          <h3 className="text-2xl font-bold text-white tracking-tight">{listingTitle}</h3>
          <p className="text-sm text-stone-400">Aménagement virtuel de la chambre (Dimensions : {scene.dimensions.width}m x {scene.dimensions.depth}m)</p>
        </div>
        
        {/* Interactive Stats */}
        <div className="flex gap-4">
          <div className="bg-stone-800/50 border border-stone-700/50 px-4 py-2 rounded-2xl text-center">
            <span className="block text-xs text-stone-400 font-semibold uppercase">Mobilier</span>
            <span className="text-lg font-bold text-white">{scene.furniture.length} éléments</span>
          </div>
          <div className="bg-stone-800/50 border border-stone-700/50 px-4 py-2 rounded-2xl text-center">
            <span className="block text-xs text-stone-400 font-semibold uppercase">Statut</span>
            <span className="text-lg font-bold text-emerald-400">Optimisé</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3D Visualizer Canvas (CSS 3D Projection) */}
        <div className="lg:col-span-2 bg-stone-950 rounded-2xl border border-stone-800/80 h-[380px] md:h-[450px] relative flex items-center justify-center overflow-hidden">
          {/* Isometric viewport */}
          <div className="scale-75 md:scale-95 transition-transform duration-500 flex items-center justify-center" style={{ perspective: '1000px' }}>
            <div 
              className="relative w-80 h-80 transition-transform duration-700 ease-out transform"
              style={{
                transform: 'rotateX(60deg) rotateZ(-45deg)',
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Floor */}
              <div 
                className="absolute inset-0 rounded-lg shadow-inner transition-all duration-500 border border-stone-700/30"
                style={{
                  background: getFloorBackground(),
                  backgroundSize: floorTexture === 'carpet' ? '12px 12px' : undefined,
                  transform: 'translateZ(0px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
              />

              {/* Back-Left Wall */}
              <div 
                className="absolute top-0 bottom-0 left-0 w-1 transition-colors duration-500"
                style={{
                  backgroundColor: wallColor,
                  height: '100%',
                  width: '120px',
                  transform: 'rotateY(-90deg) translateZ(0px)',
                  transformOrigin: 'left center',
                  opacity: 0.9,
                  borderRight: '1px solid rgba(0,0,0,0.1)'
                }}
              />

              {/* Back-Right Wall */}
              <div 
                className="absolute top-0 left-0 right-0 h-1 transition-colors duration-500"
                style={{
                  backgroundColor: wallColor,
                  width: '100%',
                  height: '120px',
                  transform: 'rotateX(90deg) translateZ(-120px)',
                  transformOrigin: 'top center',
                  opacity: 0.85,
                  borderBottom: '1px solid rgba(0,0,0,0.1)'
                }}
              />

              {/* Furniture Elements in 3D */}
              {scene.furniture.map((item, idx) => {
                // Map logical coordinate offsets to CSS style positions (inside the 320px x 320px room)
                // Width = 320px. Center is 160px.
                const posX = 160 + item.position.x * 60;
                const posY = 160 + item.position.z * 60;
                
                // Set color and height based on type
                let height = 40;
                let width = 50;
                let depth = 60;
                let itemLabel = '';

                switch (item.type) {
                  case 'bed':
                    height = 25; width = 70; depth = 85; itemLabel = '🛏️ Lit Double';
                    break;
                  case 'bedside_table':
                    height = 20; width = 30; depth = 30; itemLabel = '🗄️ Chevet';
                    break;
                  case 'wardrobe':
                    height = 80; width = 35; depth = 65; itemLabel = '🚪 Armoire';
                    break;
                  default:
                    height = 30; width = 40; depth = 40; itemLabel = item.type;
                }

                const isHovered = selectedItem?.type === item.type;

                return (
                  <div
                    key={idx}
                    className="absolute cursor-pointer group transition-all duration-300"
                    style={{
                      left: `${posX - width/2}px`,
                      top: `${posY - depth/2}px`,
                      width: `${width}px`,
                      height: `${depth}px`,
                      transform: `translateZ(2px) rotateZ(${item.rotation}deg)`,
                      transformStyle: 'preserve-3d',
                    }}
                    onClick={() => setSelectedItem(item)}
                  >
                    {/* Bottom plate for shadow */}
                    <div className="absolute inset-0 bg-black/30 blur-[4px] rounded-lg transform translate-z-[-2px]" />

                    {/* 3D Cube faces */}
                    {/* Top Face */}
                    <div 
                      className="absolute inset-0 border border-black/10 transition-all duration-300"
                      style={{
                        backgroundColor: isHovered ? '#10B981' : item.color,
                        transform: `translateZ(${height}px)`,
                        boxShadow: isHovered ? '0 0 12px #10B981' : 'none'
                      }}
                    />
                    {/* Front Face */}
                    <div 
                      className="absolute left-0 right-0 border border-black/10 brightness-75 transition-all duration-300"
                      style={{
                        backgroundColor: isHovered ? '#059669' : item.color,
                        height: `${height}px`,
                        bottom: 0,
                        transform: `rotateX(-90deg)`,
                        transformOrigin: 'bottom center'
                      }}
                    />
                    {/* Side Face */}
                    <div 
                      className="absolute top-0 bottom-0 border border-black/10 brightness-90 transition-all duration-300"
                      style={{
                        backgroundColor: isHovered ? '#047857' : item.color,
                        width: `${height}px`,
                        right: 0,
                        transform: `rotateY(90deg)`,
                        transformOrigin: 'right center'
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Help Overlay */}
          <div className="absolute bottom-4 left-4 bg-stone-900/95 border border-stone-800 text-stone-300 px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 backdrop-blur-md">
            <span>💡</span>
            <span>Cliquez sur un meuble pour voir ses dimensions</span>
          </div>

          {/* Active Legend Indicator */}
          {selectedItem && (
            <div className="absolute top-4 left-4 bg-emerald-950/90 border border-emerald-500/30 text-emerald-200 px-4 py-2.5 rounded-2xl text-xs backdrop-blur-md max-w-[240px] animate-fade-in">
              <span className="block font-bold text-white text-sm mb-1">
                {selectedItem.type === 'bed' ? '🛏️ Lit Double King Size' : selectedItem.type === 'wardrobe' ? '🚪 Armoire Penderie' : '🗄️ Table de Chevet'}
              </span>
              <span className="block text-emerald-300/80">Position : X: {selectedItem.position.x}m, Z: {selectedItem.position.z}m</span>
              <span className="block text-emerald-300/80">Couleur : <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedItem.color }} /> {selectedItem.color}</span>
              <button 
                className="mt-2 text-white font-semibold underline block hover:text-emerald-300"
                onClick={() => setSelectedItem(null)}
              >
                Fermer
              </button>
            </div>
          )}
        </div>

        {/* Configuration Panel */}
        <div className="flex flex-col justify-between gap-6">
          <div className="space-y-6">
            {/* Wall Color Configurator */}
            <div className="bg-stone-850 border border-stone-800 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                🎨 Revêtement des Murs
              </h4>
              <div className="flex gap-3">
                {[
                  { hex: '#F5F5F4', name: 'Sable Blanc' },
                  { hex: '#E2E8F0', name: 'Bleu Pâle' },
                  { hex: '#D1FAE5', name: 'Menthe' },
                  { hex: '#FEF3C7', name: 'Ivoire' },
                  { hex: '#F472B6', name: 'Rose Poudre' }
                ].map((color) => (
                  <button
                    key={color.hex}
                    className={`w-9 h-9 rounded-full border-2 transition-all duration-300 relative group`}
                    style={{ 
                      backgroundColor: color.hex, 
                      borderColor: wallColor === color.hex ? '#10B981' : 'transparent',
                      transform: wallColor === color.hex ? 'scale(1.1)' : 'scale(1)'
                    }}
                    onClick={() => setWallColor(color.hex)}
                    title={color.name}
                  >
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-stone-950 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap mb-2">
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Floor Texture Configurator */}
            <div className="bg-stone-850 border border-stone-800 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                🪵 Texture du Sol
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'wood', label: 'Bois' },
                  { id: 'tile', label: 'Carrelage' },
                  { id: 'carpet', label: 'Moquette' }
                ].map((t) => (
                  <button
                    key={t.id}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all duration-300 ${
                      floorTexture === t.id
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-750'
                    }`}
                    onClick={() => setFloorTexture(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <span className="block text-[11px] text-stone-500 mt-3">
                Revêtement sélectionné : <strong>{getFloorTextureLabel()}</strong>
              </span>
            </div>

            {/* Interactive Object List */}
            <div className="bg-stone-850 border border-stone-800 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                📋 Objets dans la Scène
              </h4>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {scene.furniture.map((item, idx) => (
                  <div 
                    key={idx}
                    className={`p-2.5 rounded-xl border text-xs flex justify-between items-center cursor-pointer transition-all duration-300 ${
                      selectedItem?.type === item.type
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-stone-800/40 border-stone-800/80 text-stone-300 hover:bg-stone-800'
                    }`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold uppercase">{item.type.replace('_', ' ')}</span>
                    </div>
                    <span className="text-[10px] text-stone-500">
                      {item.type === 'bed' ? '1.8m x 2.0m' : item.type === 'wardrobe' ? '1.6m x 0.6m' : '0.5m x 0.5m'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Staging Promo Info */}
          <div className="bg-emerald-950/20 border border-emerald-500/10 rounded-2xl p-4 text-xs text-emerald-300/90 leading-relaxed">
            🌿 <strong>Staging Virtuel Réussi</strong>. Cet aménagement est généré à 100% par intelligence artificielle en analysant vos photos. L'IA reconstitue les dimensions et propose un mobilier contemporain adapté aux tendances locales pour booster vos réservations de +35%.
          </div>
        </div>
      </div>
    </div>
  )
}
