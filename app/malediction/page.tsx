"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface ImageData {
  src: string
  alt: string
  filename: string
}

// In a real deployment, this would be populated by reading the file system
// For now, we'll use a static list that you can update manually
const STATIC_IMAGES: ImageData[] = [
  {
    src: "/malediction/images/sample-image.jpg",
    alt: "sample-image",
    filename: "sample-image.jpg",
  },
  // Add more images here as needed
]

export default function MaledictionPage() {
  const [images, setImages] = useState<ImageData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading and set static images
    const timer = setTimeout(() => {
      setImages(STATIC_IMAGES)
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

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
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> In a production environment, this would automatically read from the{" "}
              <code className="bg-background px-2 py-1 rounded">public/malediction/images/</code> folder. For now, add
              image paths to the STATIC_IMAGES array in the component.
            </p>
          </div>
        </header>

        {images.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🖼️</div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">No Images Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Add images to the <code className="bg-muted px-2 py-1 rounded text-sm">public/malediction/images/</code>{" "}
              folder and update the STATIC_IMAGES array in the component.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((image, index) => (
              <div key={image.filename} className="group relative">
                <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={image.src || "/placeholder.svg"}
                    alt={image.alt}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
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
    </div>
  )
}
