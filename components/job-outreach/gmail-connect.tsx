'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KeyRound, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react'

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

/**
 * Controlled Gmail-connect card. The app password is held only in the parent's
 * session state (never persisted), matching the send route's no-store contract.
 */
export function GmailConnect({
  gmailUser,
  fromName,
  appPassword,
  onUser,
  onName,
  onPassword,
}: {
  gmailUser: string
  fromName: string
  appPassword: string
  onUser: (v: string) => void
  onName: (v: string) => void
  onPassword: (v: string) => void
}) {
  const [show, setShow] = useState(false)
  const connected = isValidEmail(gmailUser) && appPassword.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4 text-muted-foreground" /> Connect your Gmail
        </CardTitle>
        <CardDescription>
          Uses a Google{' '}
          <a
            href="https://myaccount.google.com/apppasswords"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-2"
          >
            App Password
          </a>{' '}
          (needs 2-Step Verification). Used only to send; never stored.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="gc-user" className="text-xs font-medium text-muted-foreground">
              Your Gmail address *
            </Label>
            <Input
              id="gc-user"
              type="email"
              value={gmailUser}
              onChange={(e) => onUser(e.target.value)}
              placeholder="you@gmail.com"
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gc-name" className="text-xs font-medium text-muted-foreground">
              Display name (optional)
            </Label>
            <Input
              id="gc-name"
              value={fromName}
              onChange={(e) => onName(e.target.value)}
              placeholder="Chetan Kushwah"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gc-pass" className="text-xs font-medium text-muted-foreground">
            16-character App Password *
          </Label>
          <div className="relative">
            <Input
              id="gc-pass"
              type={show ? 'text' : 'password'}
              value={appPassword}
              onChange={(e) => onPassword(e.target.value)}
              placeholder="xxxx xxxx xxxx xxxx"
              autoComplete="off"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide app password' : 'Show app password'}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
            Held in this browser for this session only and sent securely to deliver your emails —
            never saved on our servers.
          </p>
        </div>
        <div className="text-sm">
          {connected ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-success">
              <CheckCircle2 className="h-4 w-4" /> Ready to send as {gmailUser}
            </span>
          ) : (
            <span className="text-muted-foreground">
              Enter your Gmail and app password to enable sending.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
