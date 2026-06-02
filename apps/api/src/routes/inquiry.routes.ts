import { Router } from "express";
import { inquiryController } from "../controllers/inquiry.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { createInquirySchema } from "../validators/inquiry.validator";

const router: Router = Router();

router.post("/", validate(createInquirySchema), inquiryController.create.bind(inquiryController));
router.get("/", authenticate, inquiryController.list.bind(inquiryController));
router.put("/:id/read", authenticate, inquiryController.markAsRead.bind(inquiryController));
router.delete("/:id", authenticate, inquiryController.delete.bind(inquiryController));

export { router as inquiryRoutes };
