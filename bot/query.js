const { bot } = require("./bot");

const { addCategory, paginationCategory, showCategory, removeCategory, editCategory, getAllCategories } = require("./helper/category");
const { addProduct, showProduct, removeProduct } = require("./helper/product");
const { readyOrder, showLocation, changeOrder } = require("./helper/order");

bot.on("callback_query", async (query) => {
  const { data } = query;
  const chatId = query.from.id;

  // await bot.answerCallbackQuery(query.id)

  console.log(data);

  if (data === 'add_category') await addCategory(chatId);

  if (data.includes('success_order-')) return await changeOrder(chatId, data.split('-')[1], 2)

  if (data.includes('cancel_order-')) return await changeOrder(chatId, data.split('-')[1], 3)

  if (data.includes('map_order-')) return await showLocation(chatId, data.split('-')[1])

  if (data.includes('order-')) {
    let id = data.split('-')
    await readyOrder(chatId, id[1], id[2])
  }

  if (data.includes('more_count-')) {
    let id = data.split('-')
    await showProduct(chatId, id[1], +id[2] + 1, query.message.message_id)
  }

  if (data.includes('less_count-')) {
    let id = data.split('-')
    if (id[2] > 1) {
      await showProduct(chatId, id[1], +id[2] - 1, query.message.message_id)
    }
  }

  if (["prev_category", "next_category"].includes(data)) await paginationCategory(chatId, data, query.message.message_id);

  if (data.includes('category_')) await showCategory(chatId, data.split('_')[1])

  if (data.includes('del_category-')) await removeCategory(chatId, data.split('-')[1])

  if (data.includes('edit_category-')) await editCategory(chatId, data.split('-')[1])

  if (data.includes('add_product-')) await addProduct(chatId, data.split('-')[1])

  if (data.includes('product_')) await showProduct(chatId, data.split('_')[1])

  if (data.includes('del_product-')) await removeProduct(chatId, data.split('-')[1])

  if (data.includes('rem_product-')) await removeProduct(chatId, data.split('-')[1], true)

  if (data === 'Katalog') await getAllCategories(chatId)
});
