// src/app.ts
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { globalErrorHandler } from "./middleware/globalErrorHandler.js";
import { createHttpError } from "./utils/error.factory.js";
import { corsOptions } from "./config/corsOptions.js";
import apiRoutes from "./features/apiRoutes.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

//Express
const app: Express = express();

//  Use helmet to set security headers
app.use(helmet());

// // Enable CORS with your detailed options
app.use(cors(corsOptions));

// // Parse JSON request bodies
app.use(express.json({ limit: "10kb" }));

// // Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// // Parse cookies
app.use(cookieParser());

// // --- Static File Serving (if you store files locally) ---
// // This line serves files from a local 'uploads' directory at the '/uploads' URL path.
app.use("/uploads", express.static("uploads"));
// // Example: If you have server/uploads/image.jpg, it's accessible via http://localhost:PORT/uploads/image.jpg

// // --- Health Check Route ---
app.get("/", (_req: Request, res: Response) => {
  res
    .status(200)
    .json({ status: "success", message: "Chat API is healthy and running!" });
});

// // --- API Routes  ---
app.use("/api/v1", apiLimiter, apiRoutes);

// --- Not Found Handler ---
// app.all("*", (req: Request, _res: Response, next: NextFunction) => {
//   next(createHttpError(404, `Can't find ${req.originalUrl} on this server!`));
// });
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(createHttpError(404, `Can't find ${req.originalUrl} on this server!`));
});

// // --- Global Error Handling Middleware (Must be LAST) ---
app.use(globalErrorHandler);

export default app;
