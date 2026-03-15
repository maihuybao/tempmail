import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { getSiteConfig } from "@/app/actions/admin";

export default async function NotFound() {
  let siteName = "Temp Mail";
  try {
    const config = await getSiteConfig();
    siteName = config.site_name || siteName;
  } catch {}

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Mail className="w-6 h-6 text-accent" />
          <span className="font-semibold text-lg">{siteName}</span>
        </Link>
      </nav>

      {/* Content */}
      <section className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="relative inline-block">
            <span className="text-[8rem] sm:text-[10rem] font-black tracking-tighter leading-none text-accent/10 select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent-subtle border border-accent/20">
                <Mail className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold text-accent">Not Found</span>
              </div>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Page not found
          </h1>

          <p className="text-fg-muted text-sm sm:text-base">
            The page you&apos;re looking for doesn&apos;t exist or the email domain isn&apos;t supported.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 sm:px-8 py-4 flex items-center justify-between text-xs text-fg-muted">
        <span>{siteName}</span>
        <div className="flex items-center gap-3">
          <Link href="/docs" className="hover:text-fg transition-colors">API</Link>
          <Link href="/contact" className="hover:text-fg transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
