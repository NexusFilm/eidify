import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Progress } from "./ui/progress"
import { Loader2, Download } from "lucide-react"
import { GalleryImage } from "./ImageGallery"

interface BatchProcessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  images: GalleryImage[]
  onProcess: (operation: string, params: any) => Promise<void>
}

export default function BatchProcessModal({
  open,
  onOpenChange,
  images,
  onProcess,
}: BatchProcessModalProps) {
  const [operation, setOperation] = useState("inpaint")
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleProcess = async () => {
    setProcessing(true)
    setProgress(0)

    try {
      // Simulate progress (in real implementation, this would come from backend)
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval)
            return prev
          }
          return prev + 5
        })
      }, 500)

      await onProcess(operation, {})
      
      clearInterval(interval)
      setProgress(100)
      
      setTimeout(() => {
        setProcessing(false)
        setProgress(0)
        onOpenChange(false)
      }, 1000)
    } catch (error) {
      setProcessing(false)
      setProgress(0)
    }
  }

  const processingCount = images.filter((img) => img.status === "processing").length
  const completedCount = images.filter((img) => img.status === "completed").length
  const totalCount = images.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Batch Process Images</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!processing ? (
            <>
              <div className="space-y-2">
                <Label>Operation</Label>
                <Select value={operation} onValueChange={setOperation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inpaint">Inpaint (Remove Objects)</SelectItem>
                    <SelectItem value="remove_bg">Remove Background</SelectItem>
                    <SelectItem value="upscale">Upscale (2x)</SelectItem>
                    <SelectItem value="restore">Restore Old Photos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground">
                {totalCount} image{totalCount !== 1 ? "s" : ""} will be processed
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span className="text-muted-foreground">
                    {completedCount} / {totalCount}
                  </span>
                </div>
                <Progress value={progress} />
              </div>

              <div className="text-sm text-muted-foreground text-center">
                This may take a few minutes depending on image size and quantity
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!processing ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleProcess} disabled={totalCount === 0}>
                Start Processing
              </Button>
            </>
          ) : (
            <Button disabled className="w-full">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
