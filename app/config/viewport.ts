import type { Viewport } from "next";

export function getViewport(): Viewport {
    return {
        themeColor: "#000000",
        width: "device-width",
        initialScale: 1,
        maximumScale: 1,
        userScalable: false,
        viewportFit: "cover",
    };
}
