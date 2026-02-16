// app/admin/upload/page.tsx
// Sistema de subida de contenido para modelos y locales
// CÃ³digo de Grok

'use client';

import { createClient } from '@supabase/supabase-js';
import { useState, useRef } from 'react';
import { Upload, X, Check, Image as ImageIcon, Film, Loader2, MapPin, Tag, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Cliente Supabase Frontend
// Cliente Supabase Frontend
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UploadPage() {

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('escort');
    const [location, setLocation] = useState('Puerto Vallarta');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const categories = [
        { id: 'escort', label: 'Modelos' },
        { id: 'club', label: 'Clubs' },
        { id: 'bar', label: 'Bares' },
        { id: 'live', label: 'Cams' },
        { id: 'masaje', label: 'Masajes' }
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title) return;

        setUploading(true);
        setSuccess(false);

        try {
            // 1. Subir a Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `user_uploads/${fileName}`; // Carpeta user_uploads para orden

            // Detectar bucket "content-media"
            const { error: uploadError } = await supabase.storage
                .from('content-media')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Storage Error:', uploadError);
                throw new Error('Error al subir archivo. Verifica tu conexión.');
            }

            // 2. Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('content-media')
                .getPublicUrl(filePath);

            console.log('File uploaded:', publicUrl);

            // 3. Insertar en tabla Content
            const isVideo = file.type.startsWith('video');

            // Determinar tipo de preview para el campo nuevo
            const previewType = isVideo ? 'video' : 'image';

            const { error: dbError } = await supabase.from('content').insert({
                title,
                description,
                category,
                location,
                // Lógica dual para compatibilidad con versiones anteriores
                image_url: isVideo ? 'https://via.placeholder.com/400x600?text=Video+Preview' : publicUrl, // Fallback image for video
                video_url: isVideo ? publicUrl : null,
                preview_video_url: isVideo ? publicUrl : null,
                preview_type: previewType,
                is_verified: false,
                content_tier: 'user_generated', // Nuevo tier para usuarios
                created_at: new Date().toISOString(),
                status: 'active' // O 'pending' si quieres moderación
            });

            if (dbError) throw dbError;

            setSuccess(true);
            setTitle('');
            setDescription('');
            setFile(null);
            setPreview('');
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center">
                        <Upload className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold">Subir Contenido</h1>
                </div>

                <form onSubmit={handleUpload} className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Columna Izquierda: Dropzone */}
                    <div className="space-y-6">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative aspect-[9/16] rounded-[40px] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${preview ? 'border-pink-500' : 'border-white/10 hover:border-white/30 bg-white/5'
                                }`}
                        >
                            {preview ? (
                                file?.type.startsWith('video') ? (
                                    <video src={preview} className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                    <img src={preview} alt="Upload Preview" className="absolute inset-0 w-full h-full object-cover" />
                                )
                            ) : (
                                <div className="text-center p-8">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ImageIcon className="w-8 h-8 text-white/30" />
                                    </div>
                                    <p className="text-white font-medium">Click para subir foto o video</p>
                                    <p className="text-white/30 text-sm mt-2">Formato vertical 9:16 recomendado</p>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {preview && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setPreview(''); setFile(null); }}
                                    className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white/70 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Columna Derecha: Datos */}
                    <div className="space-y-8 bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10">
                        <div>
                            <label className="text-sm font-medium text-white/50 mb-3 block">TÃ­tulo de la publicaciÃ³n</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Ej: Sofia - Nueva en Vallarta"
                                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-pink-500/50 focus:outline-none transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-white/50 mb-3 block">DescripciÃ³n / Detalles</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Describe el servicio, horarios, promos..."
                                rows={4}
                                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-pink-500/50 focus:outline-none transition-all resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-white/50 mb-3 block flex items-center gap-2">
                                    <Tag className="w-4 h-4" /> CategorÃ­a
                                </label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none appearance-none"
                                >
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-white/50 mb-3 block flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> Ciudad
                                </label>
                                <select
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none appearance-none"
                                >
                                    <option value="CDMX">CDMX</option>
                                    <option value="Puerto Vallarta">Puerto Vallarta</option>
                                    <option value="Guadalajara">Guadalajara</option>
                                    <option value="CancÃºn">CancÃºn</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={uploading}
                            className="w-full py-5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-[20px] text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Publicando...
                                </>
                            ) : success ? (
                                <>
                                    <Check className="w-6 h-6" />
                                    Â¡Publicado con Ã©xito!
                                </>
                            ) : (
                                <>
                                    <Upload className="w-6 h-6" />
                                    Publicar Ahora
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}




