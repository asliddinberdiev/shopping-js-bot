const { bot } = require("../bot");
const User = require("../../model/user");

const { NewUserStartMsg } = require("./send_msgs");
const { adminKeyboard, userKeyboard } = require("../menu/keyboard");
const user = require("../../model/user");

const ADMINS = process.env.ADMIN_PHONES.split(",");

const start = async (msg) => {
  const chatId = msg.from.id;

  let checkUser = await User.findOne({ chatId }).lean();

  if (!checkUser) {
    let newUser = new User({
      name: msg.from.first_name,
      chatId,
      createdAt: new Date(),
      action: "request_contact",
    });

    await newUser.save();

    await bot.sendMessage(
      chatId,
      NewUserStartMsg.replaceAll("%text%", msg.from.first_name),
      {
        reply_markup: {
          keyboard: [
            [
              {
                text: "Telfon raqamni yuborish",
                request_contact: true,
              },
            ],
          ],
          resize_keyboard: true,
        },
      }
    );

  } else if (!checkUser.phone) {
    await User.findByIdAndUpdate(
      checkUser._id,
      {
        ...checkUser,
        action: "request_contact",
      },
      { new: true }
    );

  }
  else {
    await User.findByIdAndUpdate(
      checkUser._id,
      {
        ...checkUser,
        action: "menu",
      },
      { new: true }
    );

    await bot.sendMessage(
      chatId,
      `Katalogni tanlang, ${checkUser.admin ? "Admin" : checkUser.name}`,
      {
        reply_markup: {
          keyboard: checkUser.admin ? adminKeyboard : userKeyboard,
          resize_keyboard: true,
        },
      }
    );

  }
};

const requestContact = async (msg) => {
  const chatId = msg.from.id;

  if (msg?.contact) {
    const userPhone = msg.contact.phone_number;
    let user = await User.findOne({ chatId }).lean();

    user.phone = userPhone;
    ADMINS.forEach((admin_phone) => {
      if (admin_phone === userPhone) {
        user.admin = true;
      }
    });
    user.action = "menu";
    await User.findByIdAndUpdate(user._id, user, { new: true });

    await bot.sendMessage(
      chatId,
      `Katalog tanlang, ${user.admin ? "Admin" : user.name}`,
      {
        reply_markup: {
          keyboard: user.admin ? adminKeyboard : userKeyboard,
          resize_keyboard: true,
        },
      }
    );
  } else {
    await bot.sendMessage(
      chatId,
      "Botdan to'liq foydalanish uchun\n\n<b>Telfon raqamni yuborish</b>\n\ntugmasini bosing!",
      {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            [
              {
                text: "Telfon raqamni yuborish",
                request_contact: true,
              },
            ],
          ],
          resize_keyboard: true,
        },
      }
    );
  }
};

module.exports = { start, requestContact };
