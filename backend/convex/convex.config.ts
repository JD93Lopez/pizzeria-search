import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";
import rag from "@convex-dev/rag/convex.config";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const app: any = defineApp();
app.use(agent);
app.use(rag);

export default app;
