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

const navItems = [
  { label: "New Request Form", href: "/new-request", Icon: AddCircleOutlineIcon },
  { label: "Campaign Set Requests", href: "/", Icon: ChecklistOutlinedIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // remember user preference
  useEffect(() => {
    const v = localStorage.getItem("sidebar:collapsed");
    if (v) setCollapsed(v === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("sidebar:collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

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
