"use client";

import { useEffect, useState } from "react";
import type { Property } from "@comesana/shared";

type PaginatedPropertiesResponse = {
  status: string;
  data: Property[];
  meta?: {
    total?: number;
    cursor?: string;
  };
};

export function usePaginatedProperties(page: number, perPage: number, enabled = true) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    if (!enabled) {
      setProperties([]);
      setTotal(0);
      setLoaded(true);
      return () => {
        active = false;
      };
    }

    const load = async () => {
      setLoaded(false);
      try {
        const params = new URLSearchParams({
          limit: String(perPage),
          page: String(page),
          activo: "true",
        });
        const res = await fetch(`/api/properties?${params.toString()}`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Error HTTP ${res.status}`);
        }

        const json = (await res.json()) as PaginatedPropertiesResponse;
        if (!active) return;

        setProperties(json.data ?? []);
        setTotal(json.meta?.total ?? 0);
      } catch {
        if (!active) return;
        setProperties([]);
        setTotal(0);
      } finally {
        if (active) setLoaded(true);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [enabled, page, perPage]);

  return {
    properties,
    total,
    loaded,
  };
}