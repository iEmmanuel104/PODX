import { Router } from "express";
import userRoute from "./user.routes";
import callRoutes from "./calls.routes";
import streakRoutes from "./streak.routes";
import webhookRoutes from "./webhook.routes";
import huddle01Routes from "./huddle01.routes";
import tipRoutes from "./tip.routes";
import ServerController from "../controllers/server.controller";

const router: Router = Router();

router.get("/health", ServerController.getServerHealth);

router
    .use("/calls", callRoutes)
    .use("/streak", streakRoutes)
    .use("/user", userRoute)
    .use("/tips", tipRoutes)
    .use("/webhooks", webhookRoutes)
    .use("/huddle01", huddle01Routes);

export default router;
