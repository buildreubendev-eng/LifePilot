import type { Metadata } from "next";
import { AppFrame } from "@/components/AppFrame";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "PLOS MVP",
  description: "Reuben PLOS personal life admin dashboard MVP",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
