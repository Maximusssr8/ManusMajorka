import { useEffect } from "react";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — Majorka` : "Majorka — AI Ecommerce OS";
    return () => { document.title = prev; };
  }, [title]);
}
