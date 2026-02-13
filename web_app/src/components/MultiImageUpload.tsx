import { useCallback, useState } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"
import { useToast } from "./ui/use-toast"

const SUPPORTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/tiff",
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface MultiImageUploadProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  className?: string
}

export default function MultiImageUpload({
  onFilesSelected,
  maxFiles = 50,
  className,
}: MultiImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const { toast } = useToast()

  const validateFiles = (files: File[]): File[] => {
    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of files) {
      if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Unsupported file type`)
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 10MB)`)
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`)
      return validFiles.slice(0, maxFiles)
    }

    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Some files were skipped",
        description: errors.join(", "),
      })
    }

    return validFiles
  }

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return

      const fileArray = Array.from(files)
      const validFiles = validateFiles(fileArray)

      if (validFiles.length > 0) {
        onFilesSelected(validFiles)
      }
    },
    [onFilesSelected, maxFiles]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files)
      e.target.value = "" // Reset input
    },
    [handleFiles]
  )

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50",
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        id="multi-file-input"
        className="hidden"
        multiple
        accept={SUPPORTED_FILE_TYPES.join(",")}
        onChange={handleFileInput}
      />

      <label
        htmlFor="multi-file-input"
        className="flex flex-col items-center justify-center p-12 cursor-pointer"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">
          Drop images here or click to browse
        </h3>
        
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Upload up to {maxFiles} images at once. Supports JPG, PNG, WebP, BMP, TIFF (max 10MB each)
        </p>

        <Button type="button" className="mt-4" size="sm">
          Select Files
        </Button>
      </label>
    </div>
  )
}
