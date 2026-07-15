import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold font-heading">SpoolmeterX</span>
          <span className="text-xs text-muted-foreground">by MM3D</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/roadmap" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2">Roadmap</Link>
          <Link to="/login" className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-lg font-medium">Sign In</Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-6">
          🧵 3D Printing Filament Tracker
        </div>
        <h1 className="text-4xl font-bold font-heading mb-4 leading-tight">
          Track Your Filament.<br />Never Run Out Mid-Print.
        </h1>
        <p className="text-muted-foreground text-base mb-8 leading-relaxed">
          SpoolmeterX is a mobile-first inventory tracker for 3D printing shops and hobbyists.
          Monitor spool weights, log usage, scan barcodes, and get low-stock alerts — all in one place.
        </p>
        <Link to="/register" className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold text-base active:opacity-80">
          Get Started Free
        </Link>
        <p className="text-xs text-muted-foreground mt-4">No credit card required. Free plan available.</p>
      </main>

      {/* Features */}
      <section className="max-w-2xl mx-auto px-6 pb-16 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { icon: "📦", title: "Inventory Dashboard", desc: "See all your spools at a glance, grouped by brand, material, and color." },
          { icon: "⚖️", title: "Weight Tracking", desc: "Log filament usage after every print and monitor remaining grams in real time." },
          { icon: "📷", title: "Barcode Scanning", desc: "Scan spool barcodes to instantly add or look up filament in your inventory." },
          { icon: "🔔", title: "Low-Stock Alerts", desc: "Get notified when a spool drops below your critical or low threshold." },
          { icon: "⚡", title: "Quick Jobs", desc: "Run preset multi-spool consumption macros for common print jobs." },
          { icon: "📤", title: "CSV Export / Import", desc: "Export your full inventory to CSV or import from an existing spreadsheet." },
        ].map(f => (
          <div key={f.title} className="bg-card border border-border rounded-xl p-4 text-left">
            <div className="text-2xl mb-2">{f.icon}</div>
            <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Google Sign-In disclosure */}
      <section className="max-w-2xl mx-auto px-6 pb-12">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-sm mb-2">Sign in with Google</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            SpoolmeterX offers Google Sign-In as a convenient authentication option. When you choose to sign in with Google,
            we request access to your basic profile information (name and email address) solely for the purpose of creating
            and identifying your account. We do not access your Google Drive, Gmail, Calendar, or any other Google services.
            Your Google account data is never shared with third parties or used for advertising.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-4 mb-2">
          <Link to="/roadmap" className="underline underline-offset-2 hover:text-foreground">Roadmap</Link>
          <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>
          <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">Terms of Service</Link>
        </div>
        © 2026 MM3D / SpoolmeterX. All rights reserved.
      </footer>
    </div>
  );
}