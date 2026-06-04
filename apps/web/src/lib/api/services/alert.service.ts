import { prisma } from "../prisma";
import { sendPropertyAlert } from "./email.service";

export interface CreateAlertInput {
  email: string;
  nombre?: string;
  ciudad?: string;
  operacion?: string;
  tipo?: string;
  barrio?: string;
  precio_min?: number;
  precio_max?: number;
  ambientes?: number;
  moneda?: string;
  dormitorios?: number;
}

export async function createAlert(input: CreateAlertInput) {
  return prisma.propertyAlert.create({ data: input });
}

function matches(preferences: CreateAlertInput, property: any): boolean {
  if (preferences.ciudad && preferences.ciudad !== property.ciudad) return false;
  if (preferences.operacion && preferences.operacion !== property.operacion) return false;
  if (preferences.tipo && preferences.tipo !== property.tipo) return false;
  if (preferences.barrio && preferences.barrio !== property.barrio) return false;
  if (preferences.moneda && preferences.moneda !== property.moneda) return false;
  if (preferences.precio_min != null && property.precio < preferences.precio_min) return false;
  if (preferences.precio_max != null && property.precio > preferences.precio_max) return false;
  if (preferences.ambientes != null && property.ambientes < preferences.ambientes) return false;
  if (preferences.dormitorios != null && property.dormitorios < preferences.dormitorios) return false;
  return true;
}

export async function matchAndNotify(property: any) {
  const alerts = await prisma.propertyAlert.findMany({
    where: { active: true, notified: false },
  });

  const results: { email: string; matched: boolean; sent?: boolean }[] = [];

  for (const alert of alerts) {
    const prefs: CreateAlertInput = {
      email: alert.email,
      ciudad: alert.ciudad ?? undefined,
      operacion: alert.operacion ?? undefined,
      tipo: alert.tipo ?? undefined,
      barrio: alert.barrio ?? undefined,
      precio_min: alert.precio_min ?? undefined,
      precio_max: alert.precio_max ?? undefined,
      ambientes: alert.ambientes ?? undefined,
      moneda: alert.moneda ?? undefined,
      dormitorios: alert.dormitorios ?? undefined,
    };

    if (!matches(prefs, property)) {
      results.push({ email: alert.email, matched: false });
      continue;
    }

    const sent = await sendPropertyAlert(alert.email, property);
    if (sent) {
      await prisma.propertyAlert.update({
        where: { id: alert.id },
        data: { notified: true, notified_at: new Date() },
      });
    }
    results.push({ email: alert.email, matched: true, sent });
  }

  return results;
}
