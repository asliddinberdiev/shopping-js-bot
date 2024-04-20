const { bot } = require('../bot')
const User = require('../../model/user')
const Order = require('../../model/order')
const { adminKeyboard, userKeyboard } = require("../menu/keyboard");

const readyOrder = async (chatId, productId, count) => {
  let user = await User.findOne({ chatId }).lean()
  let orders = await Order.find({ user, status: 0 }).lean()

  await Promise.all(orders.map(async (order) => await Order.findByIdAndDelete(order._id)))

  await User.findByIdAndUpdate(user._id, { ...user, action: 'order' }, { new: true })

  const newOrder = new Order({ user: user._id, product: productId, count, status: 0 })
  await newOrder.save()

  bot.sendMessage(chatId, `Mahsulotni buyurtma qilish uchun yetkazib berish manzilini jo'nating`, {
    reply_markup: {
      keyboard: [
        [
          {
            text: 'Lokatsiyani jo\'natish',
            request_location: true
          }
        ]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  })
}

const endOrder = async (chatId, location) => {
  let user = await User.findOne({ chatId }).lean()
  let admin = await User.findOne({ admin: true }).lean()
  let order = await Order.findOne({ user: user._id, status: 0 }).populate(['product']).lean()

  await User.findByIdAndUpdate(user._id, { ...user, action: `end_order` }, { new: true })

  if (order) {
    await Order.findByIdAndUpdate(order._id, { ...order, location, status: 1 }, { new: true })

    await bot.sendMessage(chatId, `Buyurtmangiz kurib chiqilmoqda. Tez orada menejerimiz siz bilan bo'glanadi.`)
    await bot.sendMessage(admin.chatId, `Yangi buyurtma.\nBuyurtmachi: ${user.name}\nMahsulot: ${order.product.title}\nSoni: ${order.count} ta\nUmumiy narx: ${order.count * order.product.price} so'm`, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Bekor qilish',
              callback_data: `cancel_order-${order._id}`
            },
            {
              text: 'Qabul qilish',
              callback_data: `success_order-${order._id}`
            }
          ],
          [
            {
              text: 'Lokatsiyani olish',
              callback_data: `map_order-${order._id}`
            }
          ]
        ]
      }
    })

    await User.findByIdAndUpdate(user._id, { ...user, action: `Katalog` }, { new: true })
    await bot.sendMessage(chatId, 'Buyurtma berishda davom etishingiz mumkin', {
      reply_markup: {
        keyboard: user.admin ? adminKeyboard : userKeyboard,
        resize_keyboard: true,
      }
    })
  }
}

const showLocation = async (chatId, productId) => {
  let user = await User.findOne({ chatId }).lean()
  if (user.admin) {
    let order = await Order.findById(productId).lean()
    bot.sendLocation(chatId, order.location.latitude, order.location.longitude)
  } else {
    bot.sendMessage(chatId, 'Sizga bu yerga kirish mumkin emas!')
  }
}

const changeOrder = async (chatId, orderId, orderStatus) => {
  let admin = await User.findOne({ chatId }).lean()

  if (admin.admin) {
    let order = await Order.findById(orderId).populate(['user', 'product']).lean()
    await Order.findByIdAndUpdate(order._id, { ...order, status: orderStatus, createdAt: new Date() }, { new: true })

    const msg = orderStatus == 2 ? 'Buyurtmangiz qabul qilindi.' : 'Buyurtmangiz bekor qilindi.'
    bot.sendMessage(order.user.chatId, msg)
    bot.sendMessage(chatId, 'Buyurtma holati o\'zgardi.')
  }
}

module.exports = { readyOrder, endOrder, showLocation, changeOrder }