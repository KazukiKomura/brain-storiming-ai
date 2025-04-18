"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { COLORS } from "@/components/collaborative-canvas"

interface ColorPaletteProps {
  colors: typeof COLORS
  selectedColor: string
  onSelectColor: (color: string) => void
}

export default function ColorPalette({ colors, selectedColor, onSelectColor }: ColorPaletteProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-800 rounded-md">
      {Object.entries(colors).map(([colorName, colorClass]) => {
        // Ensure colorClass is a string and extract the first class
        const baseColorClass = typeof colorClass === "string" ? colorClass.split(" ")[0] : ""

        return (
          <Button
            key={colorName}
            variant="ghost"
            size="icon"
            className={cn(
              "w-6 h-6 rounded-full p-0 border-2",
              baseColorClass,
              selectedColor === colorName ? "border-white" : "border-transparent",
            )}
            onClick={() => onSelectColor(colorName)}
            title={`${colorName}の付箋を選択`}
          />
        )
      })}
    </div>
  )
}

