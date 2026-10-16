"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Images } from "lucide-react"

interface ImageData {
  src: string
  alt: string
  filename: string
}

export default function MaledictionGalleryPage() {
  const [images, setImages] = useState<ImageData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch("/api/images/malediction")
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
      <div className="min-h-screen bg-[#11141A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading painted model photos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#11141A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-white mb-2">Error Loading Images</h2>
          <p className="text-gray-400">{error}</p>
          <Link href="/" className="mt-4 inline-block text-purple-400 hover:underline">
            Back to Companion Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#11141A] text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors bg-[#1c2230] px-3 py-1.5 rounded-lg border border-[#2c3548]"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Companion Home
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/warhammer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white bg-[#1c2230] px-3 py-1.5 rounded-lg border border-[#2c3548]"
              >
                <Images className="h-3.5 w-3.5" /> Warhammer Gallery
              </Link>
              <Link
                href="/malediction"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/30"
              >
                <Images className="h-3.5 w-3.5" /> Malediction ({images.length})
              </Link>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
            Malediction Painted Models Gallery
          </h1>
          <p className="text-gray-400 text-sm">
            {images.length > 0
              ? `Displaying ${images.length} painted model photos`
              : "No images found in the gallery"}
          </p>
        </header>

        {images.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🖼️</div>
            <h2 className="text-2xl font-semibold text-white mb-2">No Images Yet</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Add images to the <code className="bg-[#1c2230] px-2 py-1 rounded text-sm text-purple-400">public/malediction/images/</code>{" "}
              folder and refresh the page to see them appear automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image) => (
              <div key={image.filename} className="group relative">
                <div
                  className="aspect-square relative overflow-hidden rounded-xl bg-[#1c2230] border border-[#2c3548] cursor-pointer shadow-md hover:border-purple-500/50 transition-all duration-200"
                  onClick={() => openFullscreen(image)}
                >
                  <Image
                    src={image.src || "/placeholder.svg"}
                    alt={image.alt}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/80 rounded-full p-2 text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="mt-1.5 px-0.5">
                  <p className="text-xs text-gray-400 truncate" title={image.filename}>
                    {image.filename}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={closeFullscreen}>
          <div className="relative max-w-full max-h-full flex flex-col items-center justify-center">
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <Image
                src={selectedImage.src || "/placeholder.svg"}
                alt={selectedImage.alt}
                width={1600}
                height={1200}
                className="object-contain max-w-full max-h-[85vh] rounded-lg shadow-2xl"
                sizes="90vw"
                priority
              />
            </div>

            <div className="mt-4 text-center">
              <p className="text-white/90 text-sm bg-black/60 rounded-full px-4 py-1.5 inline-block font-mono">
                {selectedImage.filename}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
