"use client";

import React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { COLORS, COLOR_COLUMNS, NoteColor } from "@/types/notes"

interface ColorPaletteProps {
  selectedColor: string
  onSelectColor: (color: string) => void
  disabled?: boolean
}

export default function ColorPalette({ selectedColor, onSelectColor, disabled = false }: ColorPaletteProps) {
  return (
    <div className="flex bg-gray-800 p-3 border-b gap-2 items-center">
      <span className="text-sm font-medium text-white mr-2">付箋を追加:</span>
      <div className="flex space-x-2">
        {Object.entries(COLORS).map(([colorName, colorClass]) => {
          // 最初のクラス名だけを取得（背景色クラス）
          const baseColorClass = typeof colorClass === "string" ? colorClass.split(" ")[0] : "";
          return (
            <Button
              key={colorName}
              variant="ghost"
              size="icon"
              className={cn(
                "w-8 h-8 p-0 rounded-full border-2",
                baseColorClass,
                selectedColor === colorName ? "border-white" : "border-transparent"
              )}
              disabled={disabled}
              onClick={() => onSelectColor(colorName)}
              title={`${colorName}の付箋を追加`}
            />
          );
        })}
      </div>
    </div>
  );
} 