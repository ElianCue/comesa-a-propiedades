import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validate } from "../middleware/validation.middleware";
import { loginSchema } from "../validators/auth.validator";

const router = Router();

router.post("/login", validate(loginSchema), authController.login.bind(authController));
router.post("/logout", authController.logout.bind(authController));
router.get("/me", authController.me.bind(authController));

export { router as authRoutes };
