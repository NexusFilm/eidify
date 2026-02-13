import { useState } from "react"
import { Download, Trash2, CheckCircle2 } from "lucide-react"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"

export interface GalleryImage {
  id: string
  file: File
  preview: string
  status: "pending" | "processing" | "completed" | "error"
  result?: string
}

interface ImageGalleryProps {
  images: GalleryImage[]
  onRemove: (id: string) => void
  onSelect: (id: string) => void
  selectedIds: string[]
  onDownload?: (id: string) => void
}

export default function ImageGallery({
  images,
  onRemove,
  onSelect,
  selectedIds,
  onDownload,
}: ImageGalleryProps) {
  if (images.length === 0) {
    return null
  }

  return (
    <div className="w-full bg-card border-t">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">
            Images ({images.length})
          </h3>
          <div className="text-xs text-muted-foreground">
            {selectedIds.length > 0 && `${selectedIds.length} selected`}
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {images.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              isSelected={selectedIds.includes(image.id)}
              onSelect={() => onSelect(image.id)}
              onRemove={() => onRemove(image.id)}
              onDownload={onDownload ? () => onDownload(image.id) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface ImageCardProps {
  image: GalleryImage
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
  onDownload?: () => void
}

function ImageCard({ image, isSelected, onSelect, onRemove, onDownload }: ImageCardProps) {
  const [showActions, setShowActions] = useState(false)

  const statusColors = {
    pending: "bg-gray-500",
    processing: "bg-blue-500 animate-pulse",
    completed: "bg-green-500",
    error: "bg-red-500",
  }

  const statusLabels = {
    pending: "Pending",
    processing: "Processing...",
    completed: "Done",
    error: "Failed",
  }

  return (
    <div
      className={cn(
        "relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer",
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-border"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={onSelect}
    >
      {/* Image */}
      <div className="aspect-square bg-muted">
        <img
          src={image.result || image.preview}
          alt={image.file.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Status Badge */}
      <div className="absolute top-2 left-2">
        <div className={cn("px-2 py-1 rounded text-xs text-white font-medium", statusColors[image.status])}>
          {statusLabels[image.status]}
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <CheckCircle2 className="w-5 h-5 text-primary fill-white" />
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
          {onDownload && image.status === "completed" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation()
                onDownload()
              }}
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Filename */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <p className="text-xs text-white truncate">{image.file.name}</p>
      </div>
    </div>
  )
}
