import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "MEV Shield - Have I Been Sandwiched?",
  description:
    "Find out how much MEV bots have stolen from your Solana wallet. Check your sandwich attack history and protect yourself.",
  keywords: ["MEV", "sandwich attack", "Solana", "DeFi", "MEV protection", "sandwich bot"],
  openGraph: {
    title: "MEV Shield - Have I Been Sandwiched?",
    description:
      "Find out how much MEV bots have stolen from your Solana wallet.",
    type: "website",
    siteName: "MEV Shield",
  },
  twitter: {
    card: "summary_large_image",
    title: "MEV Shield - Have I Been Sandwiched?",
    description:
      "Find out how much MEV bots have stolen from your Solana wallet.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen bg-background`}
      >
        <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-white"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className="font-bold text-lg">MEV Shield</span>
            </a>
            <nav className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="/#how-it-works" className="hover:text-foreground transition-colors">
                How It Works
              </a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-border/50 py-8 mt-16">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>MEV Shield &mdash; Protecting Solana traders from sandwich attacks</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
