'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Check, Loader2 } from 'lucide-react'

/**
 * Willingness-to-pay probe. Clicking records a 'pro_intent' event — the cheapest
 * honest signal on whether people would pay, with no billing built yet.
 */
export function ProInterestCard() {
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const onClick = async () => {
    setLoading(true)
    try {
      await fetch('/api/outreach/pro-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'dashboard' }),
      })
      setDone(true)
      toast.success("Thanks — we'll let you know the moment Pro is ready.")
    } catch {
      toast.error('Something went wrong. Try again?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">Pro is coming</p>
            <p className="text-sm text-muted-foreground">
              Automatic follow-ups, scheduled delivery in each recruiter&apos;s window, reply
              detection, and unlimited sends. Want early access?
            </p>
          </div>
        </div>
        <Button onClick={onClick} disabled={loading || done} variant={done ? 'outline' : 'default'} className="shrink-0">
          {done ? (
            <>
              <Check className="h-4 w-4" /> You&apos;re on the list
            </>
          ) : loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            'Notify me about Pro'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
