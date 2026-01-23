// components/Chat/ChatBox.tsx
// Chat en tiempo real con Supabase Realtime
// Código de Grok

'use client';

import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useEffect, useState, useRef } from 'react';
import { Send, X, MessageSquare, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
}

export default function ChatBox({ receiverId, receiverName = "Chat VENUZ" }: { receiverId: string, receiverName?: string }) {
    const supabase = useSupabaseClient();
    const user = useUser();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user || !isOpen) return;

        // Cargar mensajes históricos
        const loadMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: true });

            setMessages(data || []);
            setLoading(false);
        };

        loadMessages();

        // Suscripción Realtime
        const channel = supabase
            .channel(`chat_${receiverId}`)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const msg = payload.new as Message;
                    // Solo agregar si pertenece a esta conversación
                    if ((msg.sender_id === user.id && msg.receiver_id === receiverId) ||
                        (msg.sender_id === receiverId && msg.receiver_id === user.id)) {
                        setMessages(prev => [...prev, msg]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, receiverId, isOpen, supabase]);

    // Scroll automático al final
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !user) return;

        const content = newMessage;
        setNewMessage('');

        const { error } = await supabase.from('messages').insert({
            sender_id: user.id,
            receiver_id: receiverId,
            content: content,
        });

        if (error) {
            console.error('Error sending message:', error);
            setNewMessage(content); // Revertir si hay error
        }
    };

    return (
        <>
            {/* Botón flotante */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-pink-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50"
                >
                    <MessageSquare className="text-white w-6 h-6" />
                </button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-6 right-6 w-[350px] h-[500px] bg-black/80 backdrop-blur-2xl border border-white/20 rounded-[32px] shadow-2xl flex flex-col overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="p-6 bg-white/5 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-white">{receiverName}</h3>
                                <p className="text-xs text-green-400 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span> en vivo
                                </p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                                <X className="w-5 h-5 text-white/50" />
                            </button>
                        </div>

                        {/* Mensajes */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                            {loading ? (
                                <div className="h-full flex items-center justify-center text-white/30">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-white/20 text-center text-sm px-8">
                                    Ya puedes chatear. Sé amable y respeta los términos.
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${msg.sender_id === user?.id
                                                ? 'bg-pink-500 text-white rounded-tr-none'
                                                : 'bg-white/10 text-white/90 rounded-tl-none'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-6 bg-white/5 border-t border-white/10">
                            <div className="flex gap-2">
                                <input
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                    placeholder="Escribe un mensaje..."
                                    className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/50"
                                />
                                <button
                                    onClick={sendMessage}
                                    className="p-3 bg-pink-500 rounded-2xl hover:bg-pink-600 transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
