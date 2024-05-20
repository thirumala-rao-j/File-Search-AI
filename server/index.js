const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const router = require("./routes/filesearch");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/v1/filesearch", router);

app.get("/", async (req, res) => {
  res.status(200).json({
    status: "success",
  });
});

app.listen(8000, () => {
  console.log("Listening on port 8000");
});
