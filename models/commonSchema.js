const mongoose = require('mongoose');

const commonSchema = mongoose.Schema({
    name:{
        type:String,
        require:[true,"name is required"],
        trim:true,
        unique:[true,"name already taken"],
    },
    difficulty:{
        type:Number,
        require:[true,"difficulty is required"]
    },
    reviewdByHowMany:{
        type:Number,
    },
    likes:{
        type:Number,
        require:[true,"likes is required"]
    },
    author:{
        type:String,
        require:[true,"author is required"]
    },
    authorId:{
        type:mongoose.Schema.ObjectId,
        require:[true,"author Id is required"]
    },
    goValues:{
        type:String,
        require:[true,"goValue is required"]
    },
    objects:{
        type:String,
        require:[true,"objects is required"]
    }
   
},{timestamps:true})

module.exports = commonSchema