import type { Request, Response, NextFunction } from "express";
import { propertyService } from "../services/property.service";
import { ApiResponse } from "../lib/api-response";
import { logger } from "../lib/logger";
import type { CreatePropertyInput, UpdatePropertyInput } from "../validators/property.validator";

export class PropertyController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await propertyService.list({
        ciudad: req.query.ciudad as string | undefined,
        operacion: req.query.operacion as string | undefined,
        tipo: req.query.tipo as string | undefined,
        barrio: req.query.barrio as string | undefined,
        precioMax: req.query.precioMax ? Number(req.query.precioMax) : undefined,
        aptoBanco: req.query.aptoBanco === "true" ? true : req.query.aptoBanco === "false" ? false : undefined,
        permuta: req.query.permuta === "true" ? true : req.query.permuta === "false" ? false : undefined,
        cursor: req.query.cursor as string | undefined,
        limit: Number(req.query.limit) || 20,
      });
      res.json(ApiResponse.paginated(result.data, result.meta.total, result.meta.cursor));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const property = await propertyService.getById(req.params.id as string);
      res.json(ApiResponse.success(property));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input: CreatePropertyInput = req.body;
      const property = await propertyService.create(input);
      const adminEmail = (req as any).admin?.email || "anonymous";
      logger.info({ adminEmail, propertyId: property.id, direccion: property.direccion }, "property created");
      res.status(201).json(ApiResponse.success(property));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input: UpdatePropertyInput = req.body;
      const property = await propertyService.update(req.params.id as string, input);
      const adminEmail = (req as any).admin?.email || "anonymous";
      logger.info({ adminEmail, propertyId: property.id }, "property updated");
      res.json(ApiResponse.success(property));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await propertyService.delete(req.params.id as string);
      const adminEmail = (req as any).admin?.email || "anonymous";
      logger.info({ adminEmail, propertyId: req.params.id }, "property deleted");
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const propertyController = new PropertyController();
