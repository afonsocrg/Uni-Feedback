import compression from "compression";
import express from "express";
import morgan from "morgan";

// Short-circuit the type-checking of the built output.
const BUILD_PATH = "./build/server/index.js";
const DEVELOPMENT = process.env.NODE_ENV === "development";
const PORT = Number.parseInt(process.env.PORT || "3000");

const app = express();

app.use(compression());
app.disable("x-powered-by");

if (DEVELOPMENT) {
  console.log("Starting development server");
  const viteDevServer = await import("vite").then((vite) =>
    vite.createServer({
      server: { middlewareMode: true },
    }),
  );
  app.use(viteDevServer.middlewares);
  app.use(async (req, res, next) => {
    try {
      const source = await viteDevServer.ssrLoadModule("./server/app.ts");
      return await source.app(req, res, next);
    } catch (error) {
      if (typeof error === "object" && error instanceof Error) {
        viteDevServer.ssrFixStacktrace(error);
      }
      next(error);
    }
  });
} else {
  console.log("Starting production server");
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" }),
  );
  app.use(morgan("tiny"));
  app.use(express.static("build/client", { maxAge: "1h" }));
  app.use(await import(BUILD_PATH).then((mod) => mod.app));
}

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
async function shutdown() {
  console.log("Shutting down gracefully...");

  // Close HTTP server
  await new Promise((resolve) => {
    server.close(() => {
      console.log("HTTP server closed");
      resolve();
    });
  });

  // Close database connection pool
  try {
    if (DEVELOPMENT) {
      const source = await import("./server/app.ts");
      await source.client.end({ timeout: 5 });
    } else {
      const source = await import(BUILD_PATH);
      await source.client.end({ timeout: 5 });
    }
    console.log("Database connections closed");
  } catch (error) {
    console.error("Error closing database connections:", error);
  }

  process.exit(0);
}

process.on("SIGTERM", () => {
  console.log("SIGTERM received");
  shutdown();
});

process.on("SIGINT", () => {
  console.log("SIGINT received");
  shutdown();
});
