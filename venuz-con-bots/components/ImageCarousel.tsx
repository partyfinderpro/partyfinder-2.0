'use client';

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import Image from 'next/image';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface ImageCarouselProps {
    images: string[];
    alt?: string;
    className?: string;
}

export default function ImageCarousel({ images, alt = 'Image', className = '' }: ImageCarouselProps) {
    if (!images || images.length === 0) return null;

    // Single Image Mode (No Swiper needed)
    if (images.length === 1) {
        return (
            <div className={`relative h-full w-full ${className}`}>
                <Image
                    src={images[0]}
                    alt={alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
            </div>
        );
    }

    // Carousel Mode
    return (
        <div className={`relative h-full w-full group ${className}`}>
            <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={0}
                slidesPerView={1}
                navigation={{
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                }}
                pagination={{
                    clickable: true,
                    dynamicBullets: true
                }}
                autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                }}
                loop={true}
                className="h-full w-full"
            >
                {images.map((src, index) => (
                    <SwiperSlide key={index} className="relative h-full w-full">
                        <Image
                            src={src}
                            alt={`${alt} ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority={index === 0}
                        />
                        {/* Gradient Overlays inside slide to ensure text visibility */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />
                    </SwiperSlide>
                ))}

                {/* Custom Navigation Buttons */}
                <div className="swiper-button-prev !text-white !w-10 !h-10 !bg-black/30 !backdrop-blur-md rounded-full !left-4 opacity-0 group-hover:opacity-100 transition-opacity after:!text-lg hover:!bg-black/50" />
                <div className="swiper-button-next !text-white !w-10 !h-10 !bg-black/30 !backdrop-blur-md rounded-full !right-4 opacity-0 group-hover:opacity-100 transition-opacity after:!text-lg hover:!bg-black/50" />
            </Swiper>

            <style jsx global>{`
        .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.5) !important;
          opacity: 1 !important;
        }
        .swiper-pagination-bullet-active {
          background: #ffffff !important;
          transform: scale(1.2);
        }
      `}</style>
        </div>
    );
}
