
'use client';

import React, { createContext, useContext, useState } from 'react';
import AuthModal from '@/components/AuthModal';

interface AuthContextType {
    openAuthModal: () => void;
    closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openAuthModal = () => setIsModalOpen(true);
    const closeAuthModal = () => setIsModalOpen(false);

    return (
        <AuthContext.Provider value={{ openAuthModal, closeAuthModal }}>
            {children}
            <AuthModal isOpen={isModalOpen} onClose={closeAuthModal} />
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}
