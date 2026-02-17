'use client';

import { useEffect, useState } from 'react';
import { Loader2, MapPin, Star, ExternalLink } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Componentes que se cargarán dinámicamente solo en el cliente
let MapContainer: any, TileLayer: any, Marker: any, Popup: any, MarkerClusterGroup: any, L: any;

interface Venue {
    id: string;
    title: string;
    latitude: number;
    longitude: number;
    category?: string;
    description?: string;
}

interface InteractiveMapProps {
    venues: Venue[];
    center?: [number, number];
    zoom?: number;
    lang: string;
}

export default function InteractiveMap({ venues, center = [23.6345, -102.5528], zoom = 5, lang }: InteractiveMapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Carga diferida de Leaflet para evitar errores de SSR
        const initMap = async () => {
            const Leaflet = await import('leaflet');
            L = Leaflet.default;

            const ReactLeaflet = await import('react-leaflet');
            MapContainer = ReactLeaflet.MapContainer;
            TileLayer = ReactLeaflet.TileLayer;
            Marker = ReactLeaflet.Marker;
            Popup = ReactLeaflet.Popup;

            const Cluster = await import('react-leaflet-cluster');
            MarkerClusterGroup = Cluster.default;

            // Fix for default marker icons
            // @ts-ignore
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });

            setMounted(true);
        };

        if (typeof window !== 'undefined') {
            initMap();
        }
    }, []);

    if (!mounted || !MapContainer) {
        return (
            <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-zinc-900/50 rounded-3xl border border-white/10">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[500px] relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                className="z-0"
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <MarkerClusterGroup>
                    {venues.map((venue) => (
                        venue.latitude && venue.longitude && (
                            <Marker
                                key={venue.id}
                                position={[venue.latitude, venue.longitude]}
                            >
                                <Popup minWidth={250} className="venuz-popup">
                                    <div className="p-3 bg-zinc-900 text-white rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-pink-500 text-[10px] font-bold rounded-full uppercase">
                                                {venue.category || 'Nightlife'}
                                            </span>
                                            <div className="flex items-center gap-1 text-xs text-amber-400">
                                                <Star className="w-3 h-3 fill-amber-400" />
                                                <span>4.9</span>
                                            </div>
                                        </div>
                                        <h3 className="font-black text-lg mb-1 leading-tight">{venue.title}</h3>
                                        <p className="text-xs text-white/50 mb-4 line-clamp-2">{venue.description || 'Sin descripción disponible'}</p>

                                        <div className="flex items-center gap-2 mt-4">
                                            <a
                                                href={`/${lang}/content/${venue.id}`}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-pink-500 hover:text-white transition-all uppercase"
                                            >
                                                Ver Detalles
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                            <button className="p-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">
                                                <MapPin className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    ))}
                </MarkerClusterGroup>
            </MapContainer>

            {/* Legend / Info Overlay */}
            <div className="absolute bottom-6 left-6 z-[1000] p-4 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-pink-500 rounded-full" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Venues Populares</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
