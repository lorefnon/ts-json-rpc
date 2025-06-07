import express from "express";
import { rpcHandler } from "../express.js";
import { RequestAwareServiceImpl } from "./RequestAwareServiceImpl.js";
import { DefaultServiceImpl } from "./DefaultServiceImpl.js";

const app = express();

app.use(express.json());

app.use("/api", (req, res, next) => {
  const status = req.header("Prefer-Status");
  if (status) res.status(parseInt(status)).end();
  else next();
});

app.post("/api", rpcHandler(DefaultServiceImpl));

app.post(
  "/request-aware-api",
  rpcHandler((req) => RequestAwareServiceImpl(req))
);

app.post(
  "/error-masked-api",
  rpcHandler(DefaultServiceImpl, {
    getErrorMessage: (error: unknown) => "Something went wrong",
    getErrorCode: (error: unknown) => 100
  })
)

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server listening on http://localhost:%s", port);
});
