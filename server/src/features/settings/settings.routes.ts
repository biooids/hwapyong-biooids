// FILE: src/features/settings/settings.routes.ts

import { Router } from "express";
import { settingsController } from "./settings.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { updateSettingsSchema } from "./settings.validation.js";

const router: Router = Router();

// All routes in this file will require an authenticated user.
const requireAuth = authenticate({ required: true });
router.use(requireAuth);

// Route to get the user's current settings
router.get("/", settingsController.getSettings);

// Route to update the user's settings
router.patch(
  "/",
  validate(updateSettingsSchema),
  settingsController.updateSettings
);

export default router;
