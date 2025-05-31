const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = mongoose.Schema({
    username: String,
    password: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    role:{
        type:String,
        default: "user"
    }

});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);
module.exports = User;