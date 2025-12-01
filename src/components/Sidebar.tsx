"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import styles from "./Sidebar.module.scss";

// Icons
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Tooltip from "@mui/material/Tooltip";
import SettingsIcon from "@mui/icons-material/Settings";

const BASE_NAV_ITEMS = [
  { label: "New Request Form", href: "/new-request", Icon: AddCircleOutlineIcon },
  { label: "Campaign Set Requests", href: "/", Icon: ChecklistOutlinedIcon },
];


const ADMIN_EMAILS = ["uliana.sedko@ajmedia.io", "ivan.plametiuk@ajmedia.io"];

type CurrentUser = {
  email?: string;
};

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/profile", { credentials: "include" });
        if (!res.ok) throw new Error("Unauthorized");

        const json = await res.json();
        const email: string | undefined = json?.data?.user?.email;

        if (!cancelled) {
          setUser({ email });
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setUserLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  
  const isAdmin = user && ADMIN_EMAILS.includes(String(user.email || "").toLowerCase());

  // remember user preference
  useEffect(() => {
    const v = localStorage.getItem("sidebar:collapsed");
    if (v) setCollapsed(v === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("sidebar:collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const navItems =
    userLoaded && isAdmin
      ? [
          ...BASE_NAV_ITEMS,
          { label: "Admin panel", href: "/admin", Icon: SettingsIcon },
        ]
      : BASE_NAV_ITEMS;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside
      className={clsx(styles.root, collapsed && styles.collapsed)}
      data-collapsed={collapsed ? "1" : "0"}>
      <div className={styles.header}>
        <button
          className={styles.toggle}
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </button>
      </div>

      <nav className={styles.nav}>
        {navItems.map(({ label, href, Icon }) => {
          const linkEl = (
            <Link
              key={href}
              href={href}
              className={clsx(styles.link, isActive(href) && styles.active)}
              aria-current={isActive(href) ? "page" : undefined}
            >
              <Icon className={styles.icon} fontSize="small" />
              <span className={styles.text}>{label}</span>
            </Link>
          );
          return collapsed ? (
            <Tooltip key={href} title={label} placement="right" enterDelay={300}>
              {linkEl}
            </Tooltip>
          ) : (
            linkEl
          );
        })}
      </nav>
    </aside>
  );
}
