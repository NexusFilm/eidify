/**
 * Simple natural language command parser for image editing.
 * Extracts intent, target, and parameters from user messages.
 */

export interface ParsedCommand {
  intent: "remove" | "adjust" | "enhance" | "transform" | "unknown"
  target?: string
  location?: string
  parameters?: {
    property?: string
    value?: string | number
    direction?: "increase" | "decrease"
  }
  confidence: number
}

const REMOVE_PATTERNS = [
  /remove (the )?(.*?)( from| in| on| at)?( the)? (.*)/i,
  /delete (the )?(.*)/i,
  /erase (the )?(.*)/i,
  /get rid of (the )?(.*)/i,
]

const ADJUST_PATTERNS = [
  /make (it |the )?(.*?) (more|less|brighter|darker|lighter) ?(.*)?/i,
  /(increase|decrease|boost|reduce) (the )?(.*?) ?(by )?(.*)?/i,
  /(brighter|darker|lighter|sharper|softer)/i,
]

const ENHANCE_PATTERNS = [
  /enhance (the )?(.*)/i,
  /improve (the )?(.*)/i,
  /upscale( by)? ?(.*)?/i,
  /restore (the )?(.*)/i,
]

const BACKGROUND_PATTERNS = [
  /remove (the )?background/i,
  /delete (the )?background/i,
  /transparent background/i,
]

export function parseCommand(message: string): ParsedCommand {
  const lowerMessage = message.toLowerCase().trim()

  // Check for background removal
  if (BACKGROUND_PATTERNS.some((pattern) => pattern.test(lowerMessage))) {
    return {
      intent: "remove",
      target: "background",
      confidence: 0.95,
    }
  }

  // Check for remove patterns
  for (const pattern of REMOVE_PATTERNS) {
    const match = lowerMessage.match(pattern)
    if (match) {
      return {
        intent: "remove",
        target: match[2]?.trim(),
        location: match[5]?.trim(),
        confidence: 0.85,
      }
    }
  }

  // Check for adjust patterns
  for (const pattern of ADJUST_PATTERNS) {
    const match = lowerMessage.match(pattern)
    if (match) {
      const direction = ["more", "increase", "boost", "brighter", "lighter"].some((word) =>
        lowerMessage.includes(word)
      )
        ? "increase"
        : "decrease"

      return {
        intent: "adjust",
        target: match[2]?.trim() || match[1]?.trim(),
        parameters: {
          property: match[3]?.trim() || match[1]?.trim(),
          direction,
          value: match[4]?.trim() || match[5]?.trim(),
        },
        confidence: 0.8,
      }
    }
  }

  // Check for enhance patterns
  for (const pattern of ENHANCE_PATTERNS) {
    const match = lowerMessage.match(pattern)
    if (match) {
      return {
        intent: "enhance",
        target: match[2]?.trim() || "image",
        parameters: {
          value: match[2]?.trim(),
        },
        confidence: 0.8,
      }
    }
  }

  // Unknown command
  return {
    intent: "unknown",
    confidence: 0,
  }
}

export function generateResponse(command: ParsedCommand): string {
  if (command.confidence < 0.5) {
    return "I'm not sure I understood that. Try commands like:\n• Remove the background\n• Make it brighter\n• Remove the person on the left\n• Upscale 2x"
  }

  switch (command.intent) {
    case "remove":
      if (command.target === "background") {
        return "I'll remove the background from your image."
      }
      return `I'll remove the ${command.target}${
        command.location ? ` ${command.location}` : ""
      } from your image.`

    case "adjust":
      const property = command.parameters?.property || command.target
      const direction = command.parameters?.direction === "increase" ? "increase" : "decrease"
      return `I'll ${direction} the ${property} of your image.`

    case "enhance":
      if (command.target === "image" || !command.target) {
        return "I'll enhance your image quality."
      }
      return `I'll enhance the ${command.target}.`

    case "transform":
      return "I'll apply the transformation to your image."

    default:
      return "I'll process your request."
  }
}

export function commandToOperation(command: ParsedCommand): {
  operation: string
  params: Record<string, any>
} {
  switch (command.intent) {
    case "remove":
      if (command.target === "background") {
        return { operation: "remove_bg", params: {} }
      }
      return {
        operation: "inpaint",
        params: {
          target: command.target,
          location: command.location,
        },
      }

    case "adjust":
      return {
        operation: "adjust",
        params: {
          property: command.parameters?.property,
          direction: command.parameters?.direction,
          value: command.parameters?.value,
        },
      }

    case "enhance":
      if (command.parameters?.value?.includes("2x") || command.parameters?.value?.includes("2")) {
        return { operation: "upscale", params: { scale: 2 } }
      }
      return { operation: "enhance", params: {} }

    default:
      return { operation: "unknown", params: {} }
  }
}
