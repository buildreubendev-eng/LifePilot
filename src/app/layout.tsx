import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';
import type { Metadata } from "next";
import { AppFrame } from "@/components/AppFrame";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ColorSchemeScript, MantineProvider } from '@mantine/core';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "PLOS Executive",
  description: "Personal Life Operating System - Executive Edition",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable, "dark")} data-mantine-color-scheme="dark">
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body>
        <MantineProvider defaultColorScheme="dark" theme={{ primaryColor: 'indigo' }}>
          <AppFrame>{children}</AppFrame>
        </MantineProvider>
      </body>
    </html>
  );
}
