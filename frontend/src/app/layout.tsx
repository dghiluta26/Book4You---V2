import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"
import { LanguageProvider } from "@/i18n/LanguageProvider"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"], // latin-ext covers Romanian diacritics (ă, â, î, ș, ț)
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Book4You",
  description: "Find the right accommodation faster: classic search plus a RO/EN chatbot.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${poppins.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  )
}
