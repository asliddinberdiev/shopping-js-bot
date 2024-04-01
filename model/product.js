const {Schema, model} = require('mongoose')

const Product = new Schema({
  title: String,
  price: Number,
  img: String,
  text: String,
  category: {
    type: Schema.Types.ObjectId,
    ref: "Category"
  },
  status: {
    type: Number,
    default: 0

    /**
     0 - qo'shilyapdi
     1 - faol mahsulot
     3 - no faol mahsulot
     */
  }
})

/**
 1 - title
 2 - narxi
 3 - fayli
 4 - matni
 */

module.exports = model('Product', Product)