import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Providers } from '@/components/Providers'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'NovelForge — 웹소설 기획 도우미',
  description: '아이디어를 기획 문서로. 로그라인·시놉시스·플롯·트리트먼트·스토리 바이블.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="h-full bg-[#eef0f5] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
