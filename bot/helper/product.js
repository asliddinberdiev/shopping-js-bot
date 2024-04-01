const { bot } = require("../bot");
const User = require("../../model/user");
const Product = require("../../model/product");


const addProduct = async (chatId, categoryId) => {
  const newProduct = new Product({
    category: categoryId,
    status: 0
  })
  await newProduct.save()

  let user = await User.findOne({ chatId }).lean()
  await User.findByIdAndUpdate(user._id, {
    ...user,
    action: `new_product_title`
  }, { new: true })

  await bot.sendMessage(chatId, 'Yangi mahsulot nomini kiriting!')
}

const addProductNext = async (chatId, value, fieldName) => {
  let user = await User.findOne({ chatId }).lean()
  await User.findByIdAndUpdate(user._id, {
    ...user,
    action: `new_product_${fieldName}`
  }, { new: true })

  let product = await Product.findOne({ status: 0 }).lean()

  if (['title', 'text', 'price', 'img'].includes(fieldName)) {
    product[fieldName] = value

    const steps = {
      'title': {
        action: 'new_product_price',
        text: 'Mahsulot narxini kiriting'
      },
      'price': {
        action: 'new_product_img',
        text: 'Mahsulot rasmini yuklang'
      },
      'img': {
        action: 'new_product_text',
        text: 'Mahsulot haqida qisqacha ma\'lumot kiriting'
      }
    }

    if (fieldName === 'text') {
      product.status = 1
      await User.findByIdAndUpdate(user._id, { ...user, action: `Katalog` })
      await bot.sendMessage(chatId, 'Yangi mahsulot kiritildi!')
    } else {
      await User.findByIdAndUpdate(user._id, { ...user, action: steps[fieldName].action })
      await bot.sendMessage(chatId, steps[fieldName].text)
    }

    await Product.findByIdAndUpdate(product._id, product, { new: true })
  }


}

const clearDraftProduct = async () => {
  let products = await Product.find({ status: 0 }).lean()
  if (products) {
    await Promise.all(products.map(async product => {
      await Product.findByIdAndDelete(product._id)
    }))
  }
}

const showProduct = async (chatId, productId) => {
  let product = await Product.findById(productId).populate(['category']).lean()

  await bot.sendPhoto(chatId, product.img, {
    caption: `${product.title}\nTurkum: ${product.category.title}\nNarxi:${product.price} so'm\nTasnifi: ${product.text}`
  })
}

module.exports = { addProduct, addProductNext, clearDraftProduct, showProduct }