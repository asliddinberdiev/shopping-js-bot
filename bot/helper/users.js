const {bot} = require("../bot");
const User = require("../../model/user");

const {userKeyboard} = require("../menu/keyboard");
const {NotAdminMsg} = require("./send_msgs");

const getAllUsers = async (msg) => {
  const chatId = msg.from.id;
  let user = await User.findOne({chatId}).lean();

  if (user.admin) {
    let users = await User.find().lean();
    let list = "";

    users.forEach(
      (user, index) => (list += `${++index}.${user.name}: ${user.chatId}\n`)
    );

    await bot.sendMessage(chatId, `Foydalanuvchilar ro'yhati: \n${list}`);
  } else {
    await bot.sendMessage(chatId, NotAdminMsg, {
      reply_markup: {
        keyboard: userKeyboard,
        resize_keyboard: true,
      },
    });
  }
};

module.exports = {getAllUsers};
