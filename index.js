const mongoose = require("mongoose");

require("dotenv").config();
const MONGO_URL = process.env.MONGO_URL;

require('./bot/bot')

async function dev() {
  try {
    // mongodb
    await mongoose
      .connect(MONGO_URL)
      .then(() => console.log("mongo_db start"))
      .catch((error) => console.log(error));

  } catch (error) {
    console.log(error);
  }
}

dev()
