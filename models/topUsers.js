const mongoose = require('mongoose');

const topUserSchema = mongoose.Schema({
    userName:{
        type:String,
        require:[true,"username is required"],
        trim:true,
        unique:[true,"name already taken"],
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

module.exports = mongoose.model("TopUser",topUserSchema)