import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"

import { Toaster } from "@/components/ui/sonner"
import "@/styles/globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Psyche Siren - Creative Intelligence Platform",
  description: "Advanced psychology analysis for creatives, artists, and record labels. Understand personality patterns, creative decision-making, and artistic intelligence through AI-powered psychological insights.",
  keywords: [
    "psychology analysis",
    "creative intelligence", 
    "artist psychology",
    "record label insights",
    "personality profiling",
    "music psychology",
    "creative decision making",
    "AI psychology",
    "artist profiling"
  ],
  authors: [{ name: "Psyche Siren Team" }],
  creator: "Psyche Siren",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://psyche-siren.vercel.app",
    title: "Psyche Siren - Creative Intelligence Platform",
    description: "Advanced psychology analysis for creatives and record labels",
    siteName: "Psyche Siren",
  },
  twitter: {
    card: "summary_large_image",
    title: "Psyche Siren - Creative Intelligence Platform",
    description: "Advanced psychology analysis for creatives and record labels",
    creator: "@psychesiren",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}