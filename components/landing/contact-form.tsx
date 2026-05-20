'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const inputClass =
  'w-full px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:border-black'

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill in all fields.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not send your message.')
      toast.success("Thanks! We'll be in touch soon.")
      setForm({ name: '', email: '', message: '' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <input
        type="text"
        aria-label="Your name"
        placeholder="Your Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className={inputClass}
        disabled={loading}
        required
      />
      <input
        type="email"
        aria-label="Your email"
        placeholder="Your Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className={inputClass}
        disabled={loading}
        required
      />
      <textarea
        aria-label="Your message"
        placeholder="Your Message"
        rows={4}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-black resize-none"
        disabled={loading}
        required
      />
      <Button
        type="submit"
        disabled={loading}
        className="w-full font-bold bg-black text-white hover:bg-gray-800 rounded-full py-3"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  )
}
