'use client'
import dynamic from 'next/dynamic'

const MapViewer = dynamic(() => import('./MapViewer'), { ssr: false })

export default function MapViewerWrapper(props: { position: { lat: number, lng: number } }) {
  return <MapViewer {...props} />
}
