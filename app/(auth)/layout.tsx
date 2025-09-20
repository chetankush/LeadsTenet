export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">LeadsTeNet</h1>
          <p className="text-gray-600">Excel → AI → Emails</p>
        </div>
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
          {children}
        </div>
      </div>
    </div>
  )
}