const { bot } = require("../bot");
const User = require("../../model/user");
const Category = require("../../model/category");
const Product = require("../../model/product");

const { NotAdminMsg } = require("./send_msgs");
const { clearDraftProduct } = require('../helper/product')

const getAllCategories = async (chatId, page = 1) => {
  await clearDraftProduct() // clear trash products delete

  let user = await User.findOne({ chatId }).lean();

  let limit = 5;
  let skip = (page - 1) * limit;

  if (page === 1)
    await User.findByIdAndUpdate(
      user._id,
      { ...user, action: 'category-1' },
      { new: true }
    )

  let categories = await Category.find().skip(skip).limit(limit).lean();
  if (categories.length === 0 && page !== 1) {
    page--
    await User.findByIdAndUpdate(
      user._id,
      {
        ...user,
        action: `category-${page}`,
      },
      {
        new: true,
      }
    );
    await getAllCategories(chatId, page)

    return
  }

  let categoryList = categories.map((category) => [
    {
      text: category.title,
      callback_data: `category_${category._id}`,
    },
  ]);

  await bot.sendMessage(chatId, `Kategoriyalar ro'yxati`, {
    reply_markup: {
      remove_keyboard: true,
      inline_keyboard: [
        ...categoryList,
        [
          {
            text: "Ortga",
            callback_data: page > 1 ? "prev_category" : page,
          },
          {
            text: page,
            callback_data: "0",
          },
          {
            text: "Kiyingi",
            callback_data: limit === categories.length ? "next_category" : page,
          },
        ],
        user.admin
          ? [
            {
              text: "Yangi kategoriya",
              callback_data: "add_category",
            },
          ]
          : [],
      ],
    },
  });
};

const addCategory = async (chatId) => {
  let user = await User.findOne({ chatId }).lean();

  if (user.admin) {
    await User.findByIdAndUpdate(
      user._id,
      {
        ...user,
        action: "add_category",
      },
      {
        new: true,
      }
    );

    await bot.sendMessage(chatId, "Yangi kategoriya nomini kiriting!");
  } else {
    await bot.sendMessage(chatId, NotAdminMsg);
  }
};

const newCategory = async (msg) => {
  const chatId = msg.from.id;
  const text = msg.text.trim();

  let user = await User.findOne({ chatId }).lean();

  if (user.admin && user.action === "add_category") {
    let newCategory = new Category({
      title: text,
    });
    await newCategory.save();
    await User.findByIdAndUpdate(user._id, {
      ...user,
      action: "category",
    });
    await getAllCategories(chatId);
  } else {
    await bot.sendMessage(chatId, NotAdminMsg);
  }
};

const paginationCategory = async (chatId, action) => {
  let user = await User.findOne({ chatId }).lean();
  let page = 1;

  if (user.action.includes("category-")) {
    page = +user.action.split("-")[1];

    if (action === "prev_category" && page > 1) page--;
  }

  if (action === "next_category") page++;

  await User.findByIdAndUpdate(
    user._id,
    {
      ...user,
      action: `category-${page}`,
    },
    {
      new: true,
    }
  );
  await getAllCategories(chatId, page);
};

const showCategory = async (chatId, categoryId, page = 1) => {
  let user = await User.findOne({ chatId }).lean()
  let category = await Category.findById(categoryId).lean()

  await User.findByIdAndUpdate(user._id, { ...user, action: `category_${category._id}` }, { new: true })

  let limit = 5;
  let skip = (page - 1) * limit;
  let products = await Product.find({ category: category._id, status: 1 })
    .skip(skip)
    .limit(limit)
    .sort({ _id: -1 })
    .lean()

  let productList = products.map((product) =>
    [
      {
        text: product.title,
        callback_data: `product_${product._id}`,
      }
    ]
  );

  const userKeyboards = []
  const adminKeyboards = [
    [
      {
        text: "Yangi mahsulot",
        callback_data: `add_product-${category._id}`,
      },
    ],
    [
      {
        text: "Turkumni tahrirlash",
        callback_data: `edit_category-${category._id}`,
      },
      {
        text: "Turkumni o'chirish",
        callback_data: `del_category-${category._id}`,
      },
    ]
  ]
  const keyboards = user.admin ? adminKeyboards : userKeyboards

  await bot.sendMessage(chatId, `${category.title} turkumidagi mahsulotlar ro'yxati`, {
    reply_markup: {
      remove_keyboard: true,
      inline_keyboard: [
        ...productList,
        [
          {
            text: "Ortga",
            callback_data: page > 1 ? "prev_product" : page,
          },
          {
            text: page,
            callback_data: "0",
          },
          {
            text: "Kiyingi",
            callback_data: limit === products.length ? "next_product" : page,
          },
        ],
        ...keyboards
      ],
    },
  });
}

const removeCategory = async (chatId, categoryId) => {
  let user = await User.findOne({ chatId }).lean()
  let category = await Category.findById(categoryId).lean()

  if (user.action !== 'del_category') {
    await User.findByIdAndUpdate(user._id, { ...user, action: "del_category" }, { new: true })

    await bot.sendMessage(
      chatId,
      `Siz ${category.title} turkumni o'chirmoqchisiz. Qaroringiz qat'iymi?`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Bekor qilish",
                callback_data: `category_${category._id}`
              },
              {
                text: "O'chirish",
                callback_data: `del_category-${category._id}`
              }
            ]
          ]
        }
      }
    )
  } else {
    let products = await Product.find({ category: category._id }).select(['_id']).lean()

    await Promise.all(products.map(async product => {
      await Product.findByIdAndDelete(product._id)
    }))

    await Category.findByIdAndDelete(categoryId)

    bot.sendMessage(chatId, `${category.title} turkumi o'chirildi.`)
    await User.findByIdAndUpdate(user._id, { ...user, action: `Katalog` }, { new: true })
    getAllCategories(chatId)
  }
}

const editCategory = async (chatId, categoryId) => {
  let user = await User.findOne({ chatId }).lean()
  let category = await Category.findById(categoryId).lean()

  await User.findByIdAndUpdate(user._id, { ...user, action: `edit_category-${categoryId}` }, { new: true })

  await bot.sendMessage(chatId, `${category.title} turkumga yangi nom bering`)
}

const saveCategory = async (chatId, title) => {
  let user = await User.findOne({ chatId }).lean()
  await User.findByIdAndUpdate(user._id, { ...user, action: 'Katalog' })

  let categoryId = user.action.split('-')[1]
  let category = await Category.findById(categoryId).lean()
  await Category.findByIdAndUpdate(categoryId, { ...category, title }, { new: true })

  await bot.sendMessage(chatId, `Turkum yangilandi.`)
  await getAllCategories(chatId)
}

module.exports = {
  getAllCategories,
  addCategory,
  newCategory,
  paginationCategory,
  showCategory,
  removeCategory,
  editCategory,
  saveCategory
};
