import { ThemeProvider } from "@/contexts/ThemeContext";
import "@/styles/globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Inter } from "next/font/google";
import { getSiteConfig } from "@/app/actions/admin";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  let config = { site_name: "", site_logo_url: "", site_thumbnail_url: "" };
  try {
    config = await getSiteConfig();
  } catch {
    // DB unavailable at build time — use defaults
  }
  const title = config.site_name || "Temp Mail";
  const description = "Temporary email, no signup required. Auto-deletes in 7 days.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(config.site_thumbnail_url ? { images: [{ url: config.site_thumbnail_url }] } : {}),
    },
    twitter: {
      card: config.site_thumbnail_url ? "summary_large_image" : "summary",
      title,
      description,
      ...(config.site_thumbnail_url ? { images: [config.site_thumbnail_url] } : {}),
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <SpeedInsights />
          <Analytics />
          <main className="min-h-screen">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
