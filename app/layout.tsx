// app/layout.tsx
import "./global.css"
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: "F1GPT",
    description: "Formula One Question On Demand!"
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
            </head>
            <body suppressHydrationWarning={true}>{children}</body>
        </html>
    )
}