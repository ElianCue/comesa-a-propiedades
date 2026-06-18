"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import type { Property } from "@comesana/shared";

export function useProperties(): [Property[], () => void, boolean] {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<any>("/api/properties?limit=200&activo=true");
      // API may return either an array or a paginated object { data, meta }
      const items = Array.isArray(res) ? res : res?.data ?? [];
      setProperties(items as Property[]);
    } catch {
      setProperties([]);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, []);

  return [loaded ? properties : [], load, loaded];
}
