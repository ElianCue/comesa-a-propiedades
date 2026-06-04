import { Request, Response, NextFunction } from "express";
import { createAlert } from "../services/alert.service";
import { createAlertSchema } from "../validators/alert.validator";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createAlertSchema.parse(req.body);
    const alert = await createAlert(data);
    res.status(201).json({ ok: true, id: alert.id });
  } catch (e) {
    next(e);
  }
}
