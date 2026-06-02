import type { Request, Response, NextFunction } from "express";
import { lookupService } from "../services/lookup.service";
import { ApiResponse } from "../lib/api-response";

export class LookupController {
  async getCities(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await lookupService.getCities();
      res.json(ApiResponse.success(data));
    } catch (error) {
      next(error);
    }
  }

  async getBarrios(req: Request, res: Response, next: NextFunction) {
    try {
      const ciudadId = Array.isArray(req.params.ciudadId)
        ? req.params.ciudadId[0]
        : req.params.ciudadId;
      const data = await lookupService.getBarrios(ciudadId);
      res.json(ApiResponse.success(data));
    } catch (error) {
      next(error);
    }
  }

  async getAmenities(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await lookupService.getAmenities();
      res.json(ApiResponse.success(data));
    } catch (error) {
      next(error);
    }
  }

  async getPropertyTypes(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await lookupService.getPropertyTypes();
      res.json(ApiResponse.success(data));
    } catch (error) {
      next(error);
    }
  }

  async getOperations(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await lookupService.getOperations();
      res.json(ApiResponse.success(data));
    } catch (error) {
      next(error);
    }
  }

  async getCurrencies(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await lookupService.getCurrencies();
      res.json(ApiResponse.success(data));
    } catch (error) {
      next(error);
    }
  }
}

export const lookupController = new LookupController();
