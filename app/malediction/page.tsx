"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface ImageData {
  src: string
  alt: string
  filename: string
}

export default function MaledictionPage() {
  const [images, setImages] = useState<ImageData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch("/api/images")
        if (!response.ok) {
          throw new Error("Failed to fetch images")
        }
        const data = await response.json()
        setImages(data.images || [])
      } catch (err) {
        console.error("Error fetching images:", err)
        setError("Failed to load images")
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedImage) {
        setSelectedImage(null)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [selectedImage])

  const openFullscreen = (image: ImageData) => {
    setSelectedImage(image)
  }

  const closeFullscreen = () => {
    setSelectedImage(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading images...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Images</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Malediction Gallery</h1>
          <p className="text-muted-foreground">
            {images.length > 0
              ? `Displaying ${images.length} image${images.length === 1 ? "" : "s"}`
              : "No images found in the gallery"}
          </p>
          
        </header>

        {images.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🖼️</div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">No Images Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Add images to the <code className="bg-muted px-2 py-1 rounded text-sm">public/malediction/images/</code>{" "}
              folder and refresh the page to see them appear automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((image, index) => (
              <div key={image.filename} className="group relative">
                <div
                  className="aspect-square relative overflow-hidden rounded-lg bg-muted cursor-pointer"
                  onClick={() => openFullscreen(image)}
                >
                  <Image
                    src={image.src || "/placeholder.svg"}
                    alt={image.alt}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-2">
                      <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground truncate" title={image.filename}>
                    {image.filename}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={closeFullscreen}>
          <div className="relative max-w-full max-h-full">
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <Image
                src={selectedImage.src || "/placeholder.svg"}
                alt={selectedImage.alt}
                width={1200}
                height={800}
                className="object-contain max-w-full max-h-full"
                sizes="90vw"
              />
            </div>

            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-white/80 text-sm bg-black/50 rounded px-3 py-1 inline-block">
                {selectedImage.filename}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
