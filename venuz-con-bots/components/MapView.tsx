'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import Image from 'next/image';
import 'leaflet/dist/leaflet.css';

// ========================================
// TIPOS
// ========================================
export interface MapPlace {
    id: string;
    title: string;
    lat: number;
    lng: number;
    category: string;
    image_url?: string | null;
    description?: string | null;
    url?: string | null;
}

interface MapViewProps {
    places: MapPlace[];
    userLat?: number | null;
    userLng?: number | null;
    onPlaceClick?: (place: MapPlace) => void;
}

// ========================================
// ICONOS PERSONALIZADOS POR CATEGORÍA
// ========================================
const getCategoryEmoji = (category: string): string => {
    const emojiMap: Record<string, string> = {
        clubs: '🎉',
        club: '🎉',
        bars: '🍺',
        bar: '🍺',
        restaurants: '🍽️',
        restaurante: '🍽️',
        cafes: '☕',
        events: '🎪',
        evento: '🎪',
        beaches: '🏖️',
        beach: '🏖️',
        hotels: '🏨',
        hotel: '🏨',
        spas: '💆',
        masaje: '💆',
        shopping: '🛍️',
        nightlife: '🌙',
        tabledance: '💃',
        escort: '💋',
        lgbt: '🏳️‍🌈',
    };
    return emojiMap[category?.toLowerCase()] || '📍';
};

const createCustomIcon = (category: string, isUser: boolean = false) => {
    const emoji = isUser ? '📍' : getCategoryEmoji(category);
    const bgColor = isUser ? '#3b82f6' : '#ec4899';

    return L.divIcon({
        html: `
      <div style="
        background: ${bgColor};
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: 20px;
        ">${emoji}</span>
      </div>
    `,
        className: 'custom-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
    });
};

// ========================================
// COMPONENTE HELPER: Auto-centrar mapa
// ========================================
function MapController({
    userLat,
    userLng,
    places
}: {
    userLat?: number | null;
    userLng?: number | null;
    places: MapPlace[];
}) {
    const map = useMap();

    useEffect(() => {
        if (userLat && userLng) {
            map.setView([userLat, userLng], 13);
        } else if (places.length > 0) {
            map.setView([places[0].lat, places[0].lng], 12);
        }
    }, [userLat, userLng, places, map]);

    return null;
}

// ========================================
// COMPONENTE PRINCIPAL
// ========================================
export default function MapView({
    places,
    userLat,
    userLng,
    onPlaceClick
}: MapViewProps) {

    const defaultCenter: [number, number] = useMemo(() => {
        if (userLat && userLng) {
            return [userLat, userLng];
        }
        if (places.length > 0) {
            return [places[0].lat, places[0].lng];
        }
        return [20.6534, -105.2253]; // Puerto Vallarta
    }, [userLat, userLng, places]);

    return (
        <div className="w-full h-full relative">
            <MapContainer
                center={defaultCenter}
                zoom={13}
                className="w-full h-full rounded-lg"
                zoomControl={true}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                />

                <MapController userLat={userLat} userLng={userLng} places={places} />

                {userLat && userLng && (
                    <Marker
                        position={[userLat, userLng]}
                        icon={createCustomIcon('user', true)}
                    >
                        <Popup>
                            <div className="text-center py-2">
                                <p className="font-semibold text-blue-400">📍 Tú estás aquí</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {places.map((place) => (
                    <Marker
                        key={place.id}
                        position={[place.lat, place.lng]}
                        icon={createCustomIcon(place.category)}
                    >
                        <Popup maxWidth={300} minWidth={250}>
                            <div className="p-2">
                                {place.image_url && (
                                    <div className="mb-3 -mx-2 -mt-2">
                                        <img
                                            src={place.image_url}
                                            alt={place.title}
                                            className="w-full h-32 object-cover rounded-t-lg"
                                        />
                                    </div>
                                )}

                                <div className="mb-2">
                                    <span className="inline-block px-2 py-1 bg-pink-500/20 text-pink-400 text-xs rounded-full capitalize">
                                        {getCategoryEmoji(place.category)} {place.category?.replace('_', ' ')}
                                    </span>
                                </div>

                                <h3 className="font-bold text-lg mb-2 text-white">
                                    {place.title}
                                </h3>

                                {place.description && (
                                    <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                                        {place.description}
                                    </p>
                                )}

                                <div className="flex gap-2">
                                    {place.url && (
                                        <a
                                            href={place.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-semibold text-center transition-colors"
                                        >
                                            Ver más
                                        </a>
                                    )}

                                    {onPlaceClick && (
                                        <button
                                            onClick={() => onPlaceClick(place)}
                                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                                        >
                                            Detalles
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            <div className="absolute top-4 left-4 z-[1000] bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-pink-500/30">
                <p className="text-white text-sm font-semibold">
                    📍 {places.length} {places.length === 1 ? 'lugar' : 'lugares'}
                </p>
            </div>
        </div>
    );
}
