'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import ContentCard from './ContentCard'

interface ContentItem {
  id: string
  title: string
  description?: string
  image_url?: string
  video_url?: string
  source_url: string
  source_site?: string
  type?: string
  tags?: string[]
  category_id: string
  category: string // Added for ContentCard compatibility
  region_id: string
  views: number
  featured: boolean
}

export default function InfiniteFeed() {
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userLocation, setUserLocation] = useState<{ lat: number, lon: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
        },
        (error) => {
          console.log('Location access denied, using default region')
          // Default to Guadalajara if location denied
          setUserLocation({ lat: 20.6597, lon: -103.3496 })
        }
      )
    } else {
      // Default location if geolocation not supported
      setUserLocation({ lat: 20.6597, lon: -103.3496 })
    }
  }, [])

  // Fetch content based on location
  const fetchContent = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch content from Supabase
      const { data, error } = await supabase
        .from('content')
        .select(`
          *,
          categories (name, slug),
          regions (name, latitude, longitude)
        `)
        .eq('active', true)
        .order('scraped_at', { ascending: false })
        .limit(50)

      if (error) throw error

      if (data) {
        // Transform data to match ContentCard expected type
        const formattedData = data.map((item: any) => ({
          ...item,
          category: item.categories?.name || 'General',
          description: item.description || undefined,
          image_url: item.image_url || undefined,
          video_url: item.video_url || undefined,
          source_site: item.source_site || undefined,
          type: item.type || undefined,
          tags: item.tags || undefined
        }))

        // Sort by distance if we have user location
        let sortedContent = formattedData
        if (userLocation) {
          sortedContent = formattedData.sort((a: any, b: any) => {
            const distA = calculateDistance(
              userLocation.lat,
              userLocation.lon,
              a.regions?.latitude || 0,
              a.regions?.longitude || 0
            )
            const distB = calculateDistance(
              userLocation.lat,
              userLocation.lon,
              b.regions?.latitude || 0,
              b.regions?.longitude || 0
            )
            return distA - distB
          })
        }

        setContent(sortedContent as ContentItem[])
      }
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setLoading(false)
    }
  }, [userLocation])

  useEffect(() => {
    if (userLocation) {
      fetchContent()
    }
  }, [userLocation, fetchContent])

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Intersection observer for view tracking
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0')
            setCurrentIndex(index)

            // Track view
            const contentId = entry.target.getAttribute('data-id')
            if (contentId) {
              trackView(contentId)
            }
          }
        })
      },
      { threshold: 0.7 }
    )

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  const trackView = async (contentId: string) => {
    try {
      // Increment view count
      await supabase
        .from('content')
        .update({ views: supabase.rpc('increment', { row_id: contentId }) })
        .eq('id', contentId)

      // Track interaction
      await supabase
        .from('interactions')
        .insert({
          content_id: contentId,
          user_id: localStorage.getItem('venuz_user_id') || 'anonymous',
          action: 'view'
        })
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }

  if (loading && content.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-venuz-pink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-venuz-pink font-semibold">Cargando contenido...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-scroll bg-venuz-black"
    >
      <AnimatePresence mode="wait">
        {content.map((item, index) => (
          <motion.div
            key={item.id}
            data-index={index}
            data-id={item.id}
            className="h-screen snap-item relative"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            ref={(el) => {
              if (el && observerRef.current) {
                observerRef.current.observe(el)
              }
            }}
          >
            <ContentCard content={item} isActive={currentIndex === index} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Load more trigger */}
      {content.length > 0 && (
        <div className="h-20 flex items-center justify-center">
          <button
            onClick={fetchContent}
            className="venuz-button"
          >
            Cargar más
          </button>
        </div>
      )}
    </div>
  )
}
