"use client";

import { useEffect, useState } from "react";
import { usePropertyStore } from "@/lib/store";
import type { Property } from "@/lib/properties";

export function useProperties(): [Property[], () => void] {
  const { properties, loadProperties } = usePropertyStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadProperties();
    setReady(true);
  }, []);

  const refresh = () => {
    loadProperties();
  };

  return [ready ? properties : [], refresh];
}

export function usePropertiesProvider() {
  const { loadProperties } = usePropertyStore();
  
  useEffect(() => {
    loadProperties();
  }, []);
}
