// Utility functions for image management
// This would contain the dynamic file reading logic in a production environment

import { readdir } from "fs/promises"
import { join } from "path"

export interface ImageData {
  src: string
  alt: string
  filename: string
}

export async function getImagesFromDirectory(): Promise<ImageData[]> {
  try {
    const imagesDirectory = join(process.cwd(), "public", "malediction", "images")
    const filenames = await readdir(imagesDirectory)

    // Filter for common image extensions
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]
    const imageFiles = filenames.filter((name) => imageExtensions.some((ext) => name.toLowerCase().endsWith(ext)))

    return imageFiles.map((name) => ({
      src: `/malediction/images/${name}`,
      alt: name.replace(/\.[^/.]+$/, ""), // Remove file extension for alt text
      filename: name,
    }))
  } catch (error) {
    console.error("Error reading images directory:", error)
    return []
  }
}
