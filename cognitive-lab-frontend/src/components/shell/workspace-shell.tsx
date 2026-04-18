export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#191919]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-6 py-4">
        <header className="flex items-center justify-between border-b border-black/5 pb-3">
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Cognitive Lab</h1>
            <p className="text-xs text-black/45">Infinite canvas for thinking</p>
          </div>
          <span className="rounded-full border border-black/5 bg-white px-3 py-1 text-xs text-black/50">
            MVP Preview
          </span>
        </header>
        <section className="relative mt-4 flex-1 overflow-hidden rounded-3xl border border-black/5 bg-white/70 shadow-[0_12px_48px_rgba(15,23,42,0.06)]">
          {children}
        </section>
      </div>
    </main>
  )
}
