import { PORT } from "@/config";
import {
  globalErrorHandler,
  globalNotFoundHandler,
} from "@/middlewares/common";
import connectDB from "./database";
import { app } from "./server";

app.use(globalNotFoundHandler);
app.use(globalErrorHandler);

connectDB()
  .then(() => {
    console.log("Database connected successfully.");
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(
        `Swagger docs available at http://localhost:${PORT}/api-docs`,
      );
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });

export { app };
