const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    userName:{
        type:String,
        require:[true,"username is required"],
        trim:true,
        unique:[true,"name already taken"],
    },
    password:{
        type:String,
        required:[true,'password is required'],
        trim:true,
    },
    email:{
        type:String,
        required:[true,'email is required'],
        trim:true,
    },
    wonGames:{
        type:[mongoose.Schema.ObjectId],
    },
    createdGames:{
        type:[mongoose.Schema.ObjectId],
    },
    score:{
        type:Number,
        require:[true,"score is required"],
    },
    dailyScore:{
        type:Number,
        require:[true,"weeklyScore is required"],
    },
   
},{timestamps:true})

module.exports = mongoose.model("User",userSchema)