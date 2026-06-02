import { Router } from "express";
import { propertyController } from "../controllers/property.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { propertyQuerySchema, createPropertySchema, updatePropertySchema } from "../validators/property.validator";

const router: Router = Router();

router.get("/", propertyController.list.bind(propertyController));
router.get("/:id", propertyController.getById.bind(propertyController));
router.post("/", authenticate, validate(createPropertySchema), propertyController.create.bind(propertyController));
router.put("/:id", authenticate, validate(updatePropertySchema), propertyController.update.bind(propertyController));
router.delete("/:id", authenticate, propertyController.delete.bind(propertyController));

export { router as propertyRoutes };
