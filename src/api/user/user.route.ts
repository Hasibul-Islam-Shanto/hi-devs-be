import express, { RequestHandler } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { getUserProfile, userSignup } from "./user.controller";

export const router = express.Router();

router.post("/signup", userSignup as RequestHandler);
router.get(
  "/profile",
  authMiddleware as RequestHandler,
  getUserProfile as RequestHandler,
);

export { router as userRouter };
