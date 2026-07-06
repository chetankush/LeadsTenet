export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="mb-2 text-3xl font-semibold tracking-[-0.02em] text-foreground">
            LeadsTenet<span className="text-primary">.</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Personalized recruiter outreach, from your own inbox
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  )
}