import { Router } from "express";
import { lookupController } from "../controllers/lookup.controller";

const router: Router = Router();

router.get("/cities", lookupController.getCities.bind(lookupController));
router.get("/cities/:ciudadId/barrios", lookupController.getBarrios.bind(lookupController));
router.get("/barrios", lookupController.getBarrios.bind(lookupController));
router.get("/amenities", lookupController.getAmenities.bind(lookupController));
router.get("/property-types", lookupController.getPropertyTypes.bind(lookupController));
router.get("/operations", lookupController.getOperations.bind(lookupController));
router.get("/currencies", lookupController.getCurrencies.bind(lookupController));

export { router as lookupRoutes };
