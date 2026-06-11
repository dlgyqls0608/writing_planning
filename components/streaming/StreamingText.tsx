'use client'

interface StreamingTextProps {
  text: string
  isStreaming: boolean
}

export function StreamingText({ text, isStreaming }: StreamingTextProps) {
  return (
    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
      {text}
      {isStreaming && (
        <span
          className="inline-block w-0.5 h-[1em] bg-[#4f46e5] ml-px align-text-bottom animate-pulse"
          aria-hidden="true"
        />
      )}
    </pre>
  )
}
