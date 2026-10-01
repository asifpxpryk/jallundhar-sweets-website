"use client";

import { createContext, useContext } from "react";

export type CatalogSectionChoice = { slug: string; name: string };
export type CatalogAisleChoice = { section: string; slug: string; name: string };

const CategoryCatalogContext = createContext<{
  sections: CatalogSectionChoice[];
  aisles: CatalogAisleChoice[];
} | null>(null);

export function CategoryCatalogProvider({
  sections,
  aisles,
  children,
}: {
  sections: CatalogSectionChoice[];
  aisles: CatalogAisleChoice[];
  children: React.ReactNode;
}) {
  return (
    <CategoryCatalogContext.Provider value={{ sections, aisles }}>
      {children}
    </CategoryCatalogContext.Provider>
  );
}

export function useCategoryCatalog() {
  return useContext(CategoryCatalogContext);
}
