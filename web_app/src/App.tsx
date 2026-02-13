import { useCallback, useEffect, useRef, useState } from "react"

import useInputImage from "@/hooks/useInputImage"
import { keepGUIAlive } from "@/lib/utils"
import { getServerConfig } from "@/lib/api"
import Header from "@/components/Header"
import Workspace from "@/components/Workspace"
import FileSelect from "@/components/FileSelect"
import MultiImageUpload from "@/components/MultiImageUpload"
import ImageGallery, { GalleryImage } from "@/components/ImageGallery"
import BatchProcessModal from "@/components/BatchProcessModal"
import ChatPanel, { ChatMessage } from "@/components/ChatPanel"
import { parseCommand, generateResponse, commandToOperation } from "@/lib/chatbot"
import { Toaster } from "./components/ui/toaster"
import { useStore } from "./lib/states"
import { useWindowSize } from "react-use"
import { Button } from "./components/ui/button"
import { Layers, X } from "lucide-react"
import { useToast } from "./components/ui/use-toast"

const SUPPORTED_FILE_TYPE = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/tiff",
]

function Home() {
  const [file, updateAppState, setServerConfig, setFile] = useStore((state) => [
    state.file,
    state.updateAppState,
    state.setServerConfig,
    state.setFile,
  ])

  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([])
  const [showGallery, setShowGallery] = useState(false)
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isChatProcessing, setIsChatProcessing] = useState(false)

  const { toast } = useToast()
  const userInputImage = useInputImage()
  const windowSize = useWindowSize()

  useEffect(() => {
    if (userInputImage) {
      setFile(userInputImage)
    }
  }, [userInputImage, setFile])

  useEffect(() => {
    updateAppState({ windowSize })
  }, [windowSize])

  useEffect(() => {
    const fetchServerConfig = async () => {
      const serverConfig = await getServerConfig()
      setServerConfig(serverConfig)
      if (serverConfig.isDesktop) {
        // Keeping GUI Window Open
        keepGUIAlive()
      }
    }
    fetchServerConfig()
  }, [])

  const handleMultipleFiles = useCallback((files: File[]) => {
    const newImages: GalleryImage[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: "pending" as const,
    }))
    
    setGalleryImages((prev) => [...prev, ...newImages])
    setShowGallery(true)
    
    // Set first image as active
    if (!file && newImages.length > 0) {
      setFile(newImages[0].file)
    }
  }, [file, setFile])

  const handleRemoveImage = useCallback((id: string) => {
    setGalleryImages((prev) => {
      const updated = prev.filter((img) => img.id !== id)
      // Clean up preview URL
      const removed = prev.find((img) => img.id === id)
      if (removed) {
        URL.revokeObjectURL(removed.preview)
      }
      return updated
    })
    setSelectedImageIds((prev) => prev.filter((selectedId) => selectedId !== id))
  }, [])

  const handleSelectImage = useCallback((id: string) => {
    setSelectedImageIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((selectedId) => selectedId !== id)
      }
      return [...prev, id]
    })
  }, [])

  const handleBatchProcess = async (operation: string, params: any) => {
    // Update selected images to processing
    setGalleryImages((prev) =>
      prev.map((img) =>
        selectedImageIds.includes(img.id)
          ? { ...img, status: "processing" as const }
          : img
      )
    )

    // TODO: Implement actual batch processing API call
    // For now, simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mark as completed
    setGalleryImages((prev) =>
      prev.map((img) =>
        selectedImageIds.includes(img.id)
          ? { ...img, status: "completed" as const, result: img.preview }
          : img
      )
    )
  }

  const handleChatMessage = async (message: string) => {
    if (!file) {
      toast({
        variant: "destructive",
        description: "Please upload an image first",
      })
      return
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: "user",
      content: message,
      timestamp: new Date(),
    }
    setChatMessages((prev) => [...prev, userMessage])
    setIsChatProcessing(true)

    try {
      // Parse command
      const command = parseCommand(message)
      const response = generateResponse(command)
      const operation = commandToOperation(command)

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: "assistant",
        content: response,
        timestamp: new Date(),
        command: {
          intent: command.intent,
          target: command.target,
          parameters: command.parameters,
        },
      }
      setChatMessages((prev) => [...prev, assistantMessage])

      // Execute operation if valid
      if (command.confidence > 0.5 && operation.operation !== "unknown") {
        // TODO: Implement actual operation execution
        // For now, just show success
        await new Promise((resolve) => setTimeout(resolve, 1000))
        
        toast({
          title: "Processing complete",
          description: "Your image has been edited successfully",
        })
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        description: error.message || "Failed to process command",
      })
    } finally {
      setIsChatProcessing(false)
    }
  }

  const dragCounter = useRef(0)

  const handleDrag = useCallback((event: any) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleDragIn = useCallback((event: any) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounter.current += 1
  }, [])

  const handleDragOut = useCallback((event: any) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current > 0) return
  }, [])

  const handleDrop = useCallback((event: any) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const files = Array.from(event.dataTransfer.files) as File[]
      const validFiles = files.filter((f) => SUPPORTED_FILE_TYPE.includes(f.type))
      
      if (validFiles.length > 1) {
        // Multiple files - add to gallery
        handleMultipleFiles(validFiles)
      } else if (validFiles.length === 1) {
        // Single file - set as active
        setFile(validFiles[0])
      }
      
      event.dataTransfer.clearData()
    }
  }, [handleMultipleFiles, setFile])

  const onPaste = useCallback((event: any) => {
    // TODO: when sd side panel open, ctrl+v not work
    // https://htmldom.dev/paste-an-image-from-the-clipboard/
    if (!event.clipboardData) {
      return
    }
    const clipboardItems = event.clipboardData.items
    const items: DataTransferItem[] = [].slice
      .call(clipboardItems)
      .filter((item: DataTransferItem) => {
        // Filter the image items only
        return item.type.indexOf("image") !== -1
      })

    if (items.length === 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    // TODO: add confirm dialog

    const item = items[0]
    // Get the blob of image
    const blob = item.getAsFile()
    if (blob) {
      setFile(blob)
    }
  }, [])

  useEffect(() => {
    window.addEventListener("dragenter", handleDragIn)
    window.addEventListener("dragleave", handleDragOut)
    window.addEventListener("dragover", handleDrag)
    window.addEventListener("drop", handleDrop)
    window.addEventListener("paste", onPaste)
    return function cleanUp() {
      window.removeEventListener("dragenter", handleDragIn)
      window.removeEventListener("dragleave", handleDragOut)
      window.removeEventListener("dragover", handleDrag)
      window.removeEventListener("drop", handleDrop)
      window.removeEventListener("paste", onPaste)
    }
  })

  return (
    <main className="flex min-h-screen flex-col items-center justify-between w-full bg-[radial-gradient(circle_at_1px_1px,_#8e8e8e8e_1px,_transparent_0)] [background-size:20px_20px] bg-repeat">
      <Toaster />
      <Header />
      
      <div className="flex-1 w-full flex flex-col">
        <Workspace />
        
        {/* Gallery Toggle Button */}
        {galleryImages.length > 0 && !showGallery && (
          <div className="fixed bottom-4 right-4 z-10">
            <Button
              onClick={() => setShowGallery(true)}
              className="shadow-lg"
              size="lg"
            >
              <Layers className="w-5 h-5 mr-2" />
              Show Gallery ({galleryImages.length})
            </Button>
          </div>
        )}

        {/* Image Gallery */}
        {showGallery && galleryImages.length > 0 && (
          <div className="relative">
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGallery(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <ImageGallery
              images={galleryImages}
              selectedIds={selectedImageIds}
              onSelect={handleSelectImage}
              onRemove={handleRemoveImage}
            />
            
            {selectedImageIds.length > 0 && (
              <div className="p-4 border-t bg-card flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {selectedImageIds.length} image{selectedImageIds.length !== 1 ? "s" : ""} selected
                </span>
                <Button onClick={() => setBatchModalOpen(true)}>
                  Process Selected
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {!file && galleryImages.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full space-y-8">
            <FileSelect
              onSelection={async (f) => {
                setFile(f)
              }}
            />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or upload multiple
                </span>
              </div>
            </div>
            
            <MultiImageUpload onFilesSelected={handleMultipleFiles} />
          </div>
        </div>
      ) : (
        <></>
      )}

      <BatchProcessModal
        open={batchModalOpen}
        onOpenChange={setBatchModalOpen}
        images={galleryImages.filter((img) => selectedImageIds.includes(img.id))}
        onProcess={handleBatchProcess}
      />

      {/* Chat Panel - only show when image is loaded */}
      {file && (
        <ChatPanel
          messages={chatMessages}
          onSendMessage={handleChatMessage}
          isProcessing={isChatProcessing}
        />
      )}
    </main>
  )
}

export default Home
