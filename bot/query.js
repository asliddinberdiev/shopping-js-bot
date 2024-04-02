const { bot } = require("./bot");

const { addCategory, paginationCategory, showCategory, removeCategory, editCategory, getAllCategories } = require("./helper/category");
const { addProduct, showProduct, removeProduct } = require("./helper/product");

bot.on("callback_query", async (query) => {
  const { data } = query;
  const chatId = query.from.id;
  console.log(data);

  if (data === 'add_category') await addCategory(chatId);

  if (["prev_category", "next_category"].includes(data)) await paginationCategory(chatId, data);

  if (data.includes('category_')) await showCategory(chatId, data.split('_')[1])

  if (data.includes('del_category-')) await removeCategory(chatId, data.split('-')[1])

  if (data.includes('edit_category-')) await editCategory(chatId, data.split('-')[1])

  if (data.includes('add_product-')) await addProduct(chatId, data.split('-')[1])

  if (data.includes('product_')) await showProduct(chatId, data.split('_')[1])

  if (data.includes('del_product-')) await removeProduct(chatId, data.split('-')[1])

  if (data.includes('rem_product-')) await removeProduct(chatId, data.split('-')[1], true)

  if (data === 'Katalog') await getAllCategories(chatId)
});
