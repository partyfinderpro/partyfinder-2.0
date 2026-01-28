"use client";

import { useState, useEffect } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";

export function useDevice() {
    const [device, setDevice] = useState<DeviceType>("desktop");
    const [width, setWidth] = useState<number>(0);

    useEffect(() => {
        const handleResize = () => {
            const w = window.innerWidth;
            setWidth(w);
            if (w < 768) {
                setDevice("mobile");
            } else if (w < 1024) {
                setDevice("tablet");
            } else {
                setDevice("desktop");
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return {
        device,
        width,
        isMobile: device === "mobile",
        isTablet: device === "tablet",
        isDesktop: device === "desktop",
        isLargeDesktop: width >= 1280
    };
}
