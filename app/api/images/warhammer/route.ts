import { readdir } from "fs/promises"
import { join } from "path"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const imagesDirectory = join(process.cwd(), "public", "warhammer", "images")
    const filenames = await readdir(imagesDirectory)

    // Filter for common image extensions
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]
    const imageFiles = filenames.filter((name) => imageExtensions.some((ext) => name.toLowerCase().endsWith(ext)))

    const images = imageFiles.map((name) => ({
      src: `/warhammer/images/${name}`,
      alt: name.replace(/\.[^/.]+$/, ""), // Remove file extension for alt text
      filename: name,
    }))

    return NextResponse.json({ images })
  } catch (error) {
    console.error("Error reading images directory:", error)
    return NextResponse.json({ images: [] })
  }
}


