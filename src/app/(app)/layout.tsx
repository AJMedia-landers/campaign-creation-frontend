import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/signin"); // ← guaranteed redirect before rendering anything

  return (
    <>
      <Topbar />
      <div style={{ display: "flex" }}>
        <Sidebar />
        <main id="app-main">{children}</main>
      </div>
    </>
  );
}