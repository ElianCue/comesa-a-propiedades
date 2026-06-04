import { Router } from "express";
import * as alertController from "../controllers/alert.controller";

const router: Router = Router();
router.post("/", alertController.create);
export { router as alertRoutes };
