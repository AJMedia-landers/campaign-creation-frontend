import type { Metadata } from "next";
import "./globals.scss";
import ThemeRegistry from "@/lib/ThemeRegistry";
import ReactQueryProvider from "@/lib/ReactQueryProvider"; // <— new
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = { title: "CA App", description: "Campaign creation frontend" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <ReactQueryProvider>
            <Topbar />
            <div style={{ display: "flex" }}>
              <Sidebar />
              <main id="app-main">{children}</main>
            </div>
          </ReactQueryProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
