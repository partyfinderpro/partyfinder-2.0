'use client';

import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, User } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuthContext } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import React from 'react';

export function HeaderUserButton() {
    const { openAuthModal } = useAuthContext();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (user) {
        return (
            <GlassButton
                onClick={() => { }}
                icon={<div className="w-5 h-5 rounded-full bg-gradient-to-tr from-venuz-pink to-purple-600 flex items-center justify-center font-bold text-[10px] text-white">
                    {user.email?.[0].toUpperCase()}
                </div>}
            />
        );
    }

    return (
        <GlassButton
            onClick={openAuthModal}
            icon={<User className="w-5 h-5" />}
        />
    );
}

function GlassButton({ icon, onClick }: { icon: React.ReactNode, onClick?: () => void }) {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-2.5 text-white hover:bg-white/20 transition-all duration-200"
        >
            {icon}
        </motion.button>
    );
}
