import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedProperties, type Property } from "./properties";

interface PropertyStore {
  properties: Property[];
  loadProperties: () => Property[];
  saveProperties: (props: Property[]) => void;
  addProperty: (prop: Property) => void;
  updateProperty: (prop: Property) => void;
  deleteProperty: (id: string) => void;
}

export const usePropertyStore = create<PropertyStore>()(
  persist(
    (set, get) => ({
      properties: [],

      loadProperties: () => {
        const data = get().properties;
        if (data.length === 0) {
          set({ properties: seedProperties });
          return seedProperties;
        }
        return data;
      },

      saveProperties: (props) => set({ properties: props }),

      addProperty: (prop) =>
        set((state) => ({
          properties: [prop, ...state.properties],
        })),

      updateProperty: (prop) =>
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === prop.id ? prop : p
          ),
        })),

      deleteProperty: (id) =>
        set((state) => ({
          properties: state.properties.filter((p) => p.id !== id),
        })),
    }),
    {
      name: "comesana-properties",
    }
  )
);
