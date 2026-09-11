'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { SHORTCUT_DEFINITIONS } from '@/lib/keyboard-shortcuts'

export function ShortcutsHelpDialog() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleShowHelp = () => setOpen(true)
    window.addEventListener('show-shortcuts-help', handleShowHelp)
    return () => window.removeEventListener('show-shortcuts-help', handleShowHelp)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Keyboard Shortcuts</DialogTitle>
          <DialogDescription className="text-xs">
            Use these shortcuts to navigate and control RailOpt AI faster.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {SHORTCUT_DEFINITIONS.map((shortcut) => (
            <div key={shortcut.keys} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-foreground">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.split(/(?=[–\-])/).map((key, i) => (
                  <Badge key={i} variant="outline" className="font-mono text-xs px-2 py-0.5 h-6 bg-muted/50">
                    {key.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Press <Badge variant="outline" className="font-mono text-[10px] px-1.5 h-5 mx-0.5">?</Badge> to toggle this dialog
        </p>
      </DialogContent>
    </Dialog>
  )
}
