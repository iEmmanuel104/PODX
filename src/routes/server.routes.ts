import express, { Router } from "express";
import ServerController from "../controllers/server.controller";

// Make sure that ServerController is correctly typed
const serverRouter: Router = express.Router();

// Ensure getServerHealth is typed correctly as a RequestHandler
serverRouter.get("/", ServerController.getServerHealth);

export default serverRouter;
