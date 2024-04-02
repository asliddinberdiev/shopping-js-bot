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
  let user = await User.findOne({ chatId }).lean()

  await bot.sendPhoto(chatId, product.img, {
    caption: `<b>${product.title}</b>\n📦 Turkum: ${product.category.title}\n💸 Narxi: ${product.price} so'm\n🔥 Tasnifi:\n ${product.text}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '➖',
            callback_data: 'less_count'
          },
          {
            text: '1',
            callback_data: '1'
          },
          {
            text: '➕',
            callback_data: 'more_count'
          }
        ],
        user.admin ?
          [
            {
              text: '🖋 Tahrirlash',
              callback_data: `edit_product-${product._id}`
            },
            {
              text: '🗑 o\'chirish',
              callback_data: `del_product-${product._id}`
            }
          ] : [],
        [
          {
            text: '🛒 Savatchaga qo\'shish',
            callback_data: 'add_cart'
          }
        ]
      ]
    }
  })
}

const removeProduct = async (chatId, productId, sure) => {
  let user = await User.findOne({ chatId }).lean()
  if (user.admin) {
    if (sure) {
      await Product.findByIdAndDelete(productId)
      await bot.sendMessage(chatId, `Mahsulot o'chirildi!`)
    } else {
      await bot.sendMessage(chatId, `Mahsulotni o'chirmoqchisiz. Qaroringiz qat'iymi?`, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '❌ Yo\'q',
                callback_data: 'Katalog'
              }, {
                text: '✅ Ha',
                callback_data: `rem_product-${productId}`
              }
            ]
          ]
        }
      })
    }
  } else {
    await bot.sendMessage(chatId, 'Sizga mahsulot o\'chirish mumkin emas!')
  }
}

module.exports = { addProduct, addProductNext, clearDraftProduct, showProduct, removeProduct }