"use client"

import { ReactNode, useEffect, useState } from "react"

interface Sparkle {
  id: string
  x: number
  y: number
  size: number
  delay: number
}

interface SparklesProps {
  children: ReactNode
  isActive?: boolean
  color?: string
  density?: number
  duration?: number
}

export function Sparkles({
  children,
  isActive = false,
  color = "#fbbf24",
  density = 8,
  duration = 1000
}: SparklesProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([])

  useEffect(() => {
    if (!isActive) {
      setSparkles([])
      return
    }

    // Generate sparkles
    const newSparkles: Sparkle[] = Array.from({ length: density }, (_, i) => ({
      id: `sparkle-${i}-${Date.now()}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4,
      delay: Math.random() * 300
    }))

    setSparkles(newSparkles)

    // Clean up sparkles after animation
    const cleanup = setTimeout(() => {
      setSparkles([])
    }, duration)

    return () => clearTimeout(cleanup)
  }, [isActive, density, duration])

  return (
    <div className="relative overflow-hidden">
      {children}
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute pointer-events-none animate-ping"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            animationDelay: `${sparkle.delay}ms`,
            animationDuration: "600ms"
          }}
        >
          <svg
            width={sparkle.size}
            height={sparkle.size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 0L14.59 8.41L24 12L14.59 15.59L12 24L9.41 15.59L0 12L9.41 8.41L12 0Z"
              fill={color}
            />
          </svg>
        </div>
      ))}
    </div>
  )
}
