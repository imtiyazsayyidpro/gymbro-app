import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { HapticFeedback } from "@/src/components/gymbro/HapticFeedback";
import { ServiceWorkerRegistration } from "@/src/components/gymbro/ServiceWorkerRegistration";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  weight: ["400", "500", "600"],
  variable: "--font-body",
  subsets: ["latin"],
});

const appUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.startsWith("http")
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Gymbro",
    template: "%s | Gymbro",
  },
  applicationName: "Gymbro",
  description: "Track workouts, progressive overload, and weekly progress with Gymbro.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/assets/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/assets/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/assets/pwa-icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Gymbro",
    title: "Gymbro",
    description:
      "Track workouts, progressive overload, and weekly progress with Gymbro.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Gymbro workout tracker preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gymbro",
    description:
      "Track workouts, progressive overload, and weekly progress with Gymbro.",
    images: ["/twitter-image"],
  },
  appleWebApp: {
    capable: true,
    title: "Gymbro",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${dmSans.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ServiceWorkerRegistration />
        <HapticFeedback />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
