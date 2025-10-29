"use client";
import React from "react";
import { usePathname } from "next/navigation";

type Context = {
  query: string;
  setQuery: (v: string) => void;
  debounced: string;
};
const PageSearchContext = React.createContext<Context>({
  query: "",
  setQuery: () => {},
  debounced: "",
});

export function PageSearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const pathname = usePathname();

  React.useEffect(() => {
    setQuery("");
    setDebounced("");
  }, [pathname]);

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 200);
    return () => clearTimeout(id);
  }, [query]);

  return (
    <PageSearchContext.Provider value={{ query, setQuery, debounced }}>
      {children}
    </PageSearchContext.Provider>
  );
}

export const usePageSearch = () => React.useContext(PageSearchContext);
