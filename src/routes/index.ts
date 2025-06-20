import express from "express";
import { authRouter } from "../api/auth/auth.route";
import { userRouter } from "../api/user/user.route";

const router = express.Router();

interface RouterConfig {
  path: string;
  router: express.Router;
}

const routes: RouterConfig[] = [
  {
    path: "/auth",
    router: authRouter,
  },
  {
    path: "/users",
    router: userRouter,
  },
];

routes.forEach(({ path, router: routeHandler }) => {
  router.use(path, routeHandler);
});

export default router;
