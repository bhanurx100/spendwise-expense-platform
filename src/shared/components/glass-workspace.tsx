"use client"

import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"

interface GlassWorkspaceProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
}

export function GlassWorkspace({ isOpen, onClose, title, children, actions }: GlassWorkspaceProps) {
  const router = useRouter()
  const pathname = usePathname()
  const cardRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragY, setDragY] = useState(0)

  // Handle Android back button
  useEffect(() => {
    if (!isOpen) return

    const handlePopState = () => {
      onClose()
      window.history.pushState(null, "", pathname)
    }

    window.history.pushState(null, "", pathname)
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [isOpen, onClose, pathname])

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Handle swipe down to close
  const handleDragStart = () => {
    setIsDragging(true)
    setDragY(0)
  }

  const handleDrag = (event: any) => {
    if (!isDragging) return
    setDragY(event.offsetY)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    if (dragY > 100) {
      onClose()
    }
    setDragY(0)
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black backdrop-blur-sm z-40"
            style={{ touchAction: "none" }}
          />

          {/* Glass Card */}
          <motion.div
            ref={cardRef}
            initial={{ y: "100%" }}
            animate={{ y: 40 + dragY }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
              duration: 0.35,
            }}
            drag="y"
            dragConstraints={{ top: 40, bottom: 0 }}
            dragElastic={0.2}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            className="fixed left-4 right-4 bottom-10 z-50"
            style={{
              maxHeight: "calc(100vh - 40px - env(safe-area-inset-top))",
            }}
          >
            <div
              className="relative flex flex-col rounded-[30px] border border-white/20 bg-white/10 backdrop-blur-24 shadow-2xl"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
              {/* Grab Handle */}
              <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                <div className="h-1 w-12 rounded-full bg-white/40" />
              </div>

              {/* Header */}
              <div className="px-6 pb-4">
                <div className="flex items-center justify-between">
                  <motion.h2
                    key={title}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xl font-bold text-[var(--foreground)]"
                  >
                    {title}
                  </motion.h2>
                  <button
                    onClick={onClose}
                    className="flex size-8 items-center justify-center rounded-full bg-white/10 text-[var(--foreground)] transition-colors hover:bg-white/20"
                    aria-label="Close"
                  >
                    <X className="size-5" strokeWidth={1.75} />
                  </button>
                </div>
                {actions && <div className="mt-4">{actions}</div>}
              </div>

              {/* Content */}
              <motion.div
                key={pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex-1 overflow-y-auto px-6 pb-8"
                style={{ paddingBottom: "max(32px, env(safe-area-inset-bottom))" }}
              >
                {children}
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
