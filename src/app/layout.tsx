import type { Metadata } from "next";
import "./globals.scss";
import ThemeRegistry from "@/lib/ThemeRegistry";
import ReactQueryProvider from "@/lib/ReactQueryProvider";
import { PageSearchProvider } from "@/lib/PageSearchContext";

export const metadata: Metadata = { title: "CA App", description: "Campaign creation frontend" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <ReactQueryProvider>
            <PageSearchProvider>{children}</PageSearchProvider>
          </ReactQueryProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}