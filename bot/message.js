const { bot } = require("./bot");
const User = require("../model/user");

const { start, requestContact } = require("./helper/start");
const { getAllUsers } = require("./helper/users");
const { getAllCategories, newCategory, saveCategory } = require("./helper/category");
const { addProductNext } = require("./helper/product");
const { endOrder } = require("./helper/order");

bot.on("message", async (msg) => {
  const chatId = msg.from.id;
  const text = msg.text;
  console.log(text);

  const user = await User.findOne({ chatId }).lean();

  if (text === "/start") {
    await start(msg);
  }

  if (user) {

    if (text === "Foydalanuvchilar") return await getAllUsers(msg);

    if (text === "Katalog") return await getAllCategories(chatId);

    if (user.action === "order" && msg.location) await endOrder(chatId, msg.location)

    if (user.action === "request_contact" && !user.phone) await requestContact(msg);

    if (user.action === "add_category") await newCategory(msg);

    if (user.action.includes("edit_category-")) await saveCategory(chatId, text);

    if (user.action === "new_product_img") {
      if (msg.photo) await addProductNext(chatId, msg.photo.at(-1).file_id, 'img');
      else await bot.sendMessage(chatId, 'Mahsulot rasmini oddiy rasm kurinishda yuklang!')
    }

    if (user.action.includes("new_product_") && user.action !== "new_product_img")
      await addProductNext(chatId, text, user.action.split('_')[2]);
  }
});
