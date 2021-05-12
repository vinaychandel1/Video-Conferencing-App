const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const user_schema = new Schema({
  userName:{type:String},
  email:{type:String,required:true,unique:true},
  password:{type:String},
  isverified: { type: Boolean }
});

let User = mongoose.model("User", user_schema);

module.exports = User;