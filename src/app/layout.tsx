import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniSign | Anonymous Campus Channels (*.edu.vn)",
  description: "Decentralized anonymous student collaboration secured with TideCloak Emergent Authority and 2/3 threshold archive protection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="h-screen w-screen overflow-hidden bg-[#faf8f5] text-[#263238] antialiased">
        {children}
      </body>
    </html>
  );
}
