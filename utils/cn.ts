import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utilidad estándar para limpiar y fusionar clases Tailwind
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
