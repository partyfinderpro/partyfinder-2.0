import { motion, useAnimation } from 'framer-motion';
import { Heart } from 'lucide-react';

export function LikeButton({ isLiked, onClick, count }: { isLiked: boolean, onClick: (e: React.MouseEvent) => void, count: number }) {
    const controls = useAnimation();

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick(e);

        // Animación de "burst"
        await controls.start({
            scale: [1, 1.3, 1],
            rotate: [0, -10, 10, 0],
            transition: { duration: 0.4, ease: "easeInOut" }
        });
    };

    return (
        <motion.button
            animate={controls}
            whileTap={{ scale: 0.9 }}
            onClick={handleClick}
            className="relative flex flex-col items-center gap-1 group"
        >
            <div className={`p-3 rounded-2xl backdrop-blur-2xl border transition-all duration-300 ${isLiked
                    ? "bg-pink-500/30 border-pink-400/50"
                    : "bg-white/10 border-white/20 group-hover:bg-white/20"
                }`}>
                <Heart
                    className={`w-6 h-6 transition-all duration-300 ${isLiked ? "fill-pink-500 text-pink-500 scale-110" : "text-white"
                        }`}
                />

                {/* Partículas cuando se da like */}
                {isLiked && (
                    <motion.div
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0 rounded-2xl bg-pink-500/30"
                    />
                )}
            </div>

            <span className="text-xs font-semibold text-white font-['Inter']">{count}</span>
        </motion.button>
    );
}
