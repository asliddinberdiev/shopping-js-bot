const express = require("express");
const app = express();
const mongoose = require("mongoose");

require("dotenv").config();
const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;

app.use(express.json());
require('./bot/bot')

async function dev() {
  try {
    // mongodb
    await mongoose
      .connect(MONGO_URL)
      .then(() => console.log("mongo_db start"))
      .catch((error) => console.log(error));

    // app
    app.listen(PORT, () => console.log("server running"));

  } catch (error) {
    console.log(error);
  }
}

dev().then()
