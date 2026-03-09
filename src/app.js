const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const templeRoutes = require("./routes/templeRoutes");
const queueRoutes = require("./routes/queueRoutes");
const passRoutes = require("./routes/passRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "temple-management-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/temples", templeRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/passes", passRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/prediction", predictionRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
