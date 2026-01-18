import toast from 'react-hot-toast';
import AchievementToast from '@/components/gamification/AchievementToast';
import React from 'react';

export const showAchievement = (
    title: string,
    description: string,
    xp: number,
    icon?: 'trophy' | 'star' | 'flame' | 'award'
) => {
    toast.custom((t) => (
        <AchievementToast
            title={title}
            description={description}
            xp={xp}
            icon={icon}
        />
    ), {
        duration: 5000,
        position: 'top-center',
    });
};

export const showSuccess = (message: string) => {
    toast.success(message, {
        style: {
            background: '#10b981',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
        },
    });
};

export const showError = (message: string) => {
    toast.error(message, {
        style: {
            background: '#ef4444',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
        },
    });
};
