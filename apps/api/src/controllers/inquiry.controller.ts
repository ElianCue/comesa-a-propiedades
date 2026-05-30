import type { Request, Response, NextFunction } from "express";
import { inquiryService } from "../services/inquiry.service";
import { ApiResponse } from "../lib/api-response";

export class InquiryController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const inquiry = await inquiryService.create(req.body);
      res.status(201).json(ApiResponse.success(inquiry));
    } catch (error) {
      next(error);
    }
  }

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const inquiries = await inquiryService.list();
      res.json(ApiResponse.success(inquiries));
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const inquiry = await inquiryService.markAsRead(req.params.id as string);
      res.json(ApiResponse.success(inquiry));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await inquiryService.delete(req.params.id as string);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}

export const inquiryController = new InquiryController();
