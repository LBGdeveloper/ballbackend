const express = require('express');
var app = express();
const cors = require('cors'); 
const bodyParser = require('body-parser');
const jwt = require("jsonwebtoken");
const cron = require('node-cron');

app.use(cors());
//place is imp



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
require('dotenv').config();
const mongoose = require('mongoose');
const uri = process.env.DATABASEURI;
const User = require('./models/user');
const TopUser = require('./models/topUsers');
const TopDailyUser = require('./models/topDailyUsers');
const Mostliked = require('./models/mostliked');
const Mostchallenging = require('./models/mostChallenging');
const Level = require('./models/level');
const topDailyUsers = require('./models/topDailyUsers');

mongoose.connect(uri)
.then(()=>{
    console.log("db connected")
    setTimeout(() => {
        updateScoresTable()
        hourlyTask()
    }, 5000);
})
.catch((err)=>console.log(err))

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
  
    if (token == null) return res.sendStatus(401)
  
    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
      console.log(err)
  
      if (err) return res.sendStatus(403)
  
      req.user = user

      next()
    })
  }

app.post('/login',async (req,res)=>{
    const theUser = await User.findOne({userName:req.body.userName})
    if(theUser){
        if(theUser.password === req.body.password){
            let token1 = ""
            try {
                //Creating jwt token
                token1 = jwt.sign(
                    {
                        userName: theUser.userName,
                        id:theUser._id
                    },
                    process.env.TOKEN_SECRET,
                    {}
                );
            } catch (err) {
                console.log(err);
            }
            res.status(200).json({
                userName:theUser.userName , 
                message:"logged in sucessfully", 
                token:token1,
            })
        }else{
            res.status(400).json({message:"incorrect password"})
        } 
    }else{
        res.status(400).send({message:"user not found"})
    }
})
app.post('/register',async (req,res)=>{
    const theUser = await User.findOne({userName:req.body.userName})
    if(!theUser){
        if(req.body.password && req.body.userName && req.body.email){
            var newUser = await new User({
                userName : req.body.userName,
                password: req.body.password,
                email: req.body.email,
                wonGames: [],
                createdGames:[],
                score:0,
                dailyScore:0,
            })
            await newUser.save().then(()=>{
                let token1 = ""
                try {
                    //Creating jwt token
                    token1 = jwt.sign(
                        {
                            userName: newUser.userName,
                            id:newUser._id
                        },
                        process.env.TOKEN_SECRET,
                        {}
                    );
                } catch (err) {
                    console.log(err);
                }
                res.status(200).json({
                    message:'created successfully',token:token1,userName:newUser.userName
                })
            }).catch((err)=>{
                res.status(400).json(err)
            })
        }else{
            res.status(400).json({message:"Incomplete data for user creation"})
        } 
    }else{
        res.status(400).send({message:"username already taken, try a different one"})
    }
})
app.get('/profile',authenticateToken,async (req,res)=>{
    const usr = await User.findOne({_id:req.user.id}, {});
    if(usr){
        res.status(200).send(usr)
    }
})
app.post('/saveLevel', authenticateToken ,async (req,res)=>{
    
        var newLevel = await new Level({
            name : req.body.name,
            authorId:req.user.id,
            author:req.user.userName,
            difficulty:5,
            likes:0,
            reviewdByHowMany:1,
            goValues:req.body.goValues.toString(),
            objects:req.body.objects.toString(),
        })
        await newLevel.save().then((savedLvl)=>{
            res.status(200).json({message:'created successfully'})
            User.findOneAndUpdate({_id : req.user.id},{ $push: { createdGames: savedLvl._id } })
            .then(()=>console.log("updated user"))
            .catch(err=>{
                res.status(400).json({message:"name already taken"})
            });
        }).catch((err)=>{
            res.status(400).json(err)
        })
})
const makeReviewUpdateObj = (body,lvl)=>{
    let obj = {}
    if(body.like){
        obj.likes = lvl.likes + 1
    }
    if(body.hasOwnProperty('difficulty')){ 
        obj.reviewdByHowMany = lvl.reviewdByHowMany + 1;
        obj.difficulty = (lvl.difficulty*lvl.reviewdByHowMany + body.difficulty)/(lvl.reviewdByHowMany + 1); 
    }
    return obj;
}
app.post('/reviewLevel', authenticateToken ,async (req,res)=>{
    const existingLevel = await Level.findOne({_id:req.body.levelId});
    if(existingLevel){
        Level.findOneAndUpdate({_id:existingLevel._id},makeReviewUpdateObj(req.body,existingLevel)).then(()=>{
            res.status(200).json({message:'updated successfully'})
        }).catch((err)=>{
            res.status(400).json(err)
        })
        User.findOneAndUpdate({_id : req.user.id},{ $push: { wonGames: existingLevel._id }, $inc: { score: existingLevel.difficulty , dailyScore: existingLevel.difficulty  } })
        .then(()=>console.log("updated user"))
        .catch(err=>{
            res.status(400).json(err)
        });
    }else{
        res.status(400).json({message:'level not found'})
    }
})

app.get('/levelsByDifficulty',authenticateToken,async (req,res)=>{
    const lvls = await Mostchallenging.find({}).limit(50)
    res.status(200).send({levels:lvls})
})

app.get('/levelsByLikes',authenticateToken,async (req,res)=>{
    const lvls = await Mostliked.find({}).limit(50)
    res.status(200).send({levels:lvls})
})
app.get('/levelsByInventory',authenticateToken,async (req,res)=>{
    const lvls = await Level.find({authorId:req.user.id}, {}, { sort: { 'createdAt' : -1 } }).limit(50)
    res.status(200).send({levels:lvls})
})
app.get('/levelsByLatest',authenticateToken,async (req,res)=>{
    const lvls = await Level.find({}, {}, { sort: { 'createdAt' : -1 } }).limit(20)
    res.status(200).send({levels:lvls})
})
app.get('/levelsBySearch',authenticateToken,async (req,res)=>{
    const {search }=req.query
    const query = {};
    if(search  && search .length > 1){
        query.$or = [
            { name: { $regex: search, $options: 'i' } }, // Case-insensitive search in 'name'
            { author: { $regex: search, $options: 'i' } } // Case-insensitive search in 'description'
          ];
        const lvls = await Level.find(query, {}, { sort: { 'createdAt' : -1 } }).limit(10)
        res.status(200).send({levels:lvls})
    }
})
app.get('/leaderboard',authenticateToken,async (req,res)=>{
    const top = await TopUser.find({}).limit(100)
    res.status(200).send({top:top})
})
app.get('/leaderboardDaily',authenticateToken,async (req,res)=>{
    const top = await TopDailyUser.find({}).limit(100)
    res.status(200).send({top:top })
})

app.get('/',(req,res)=>{
    res.send('hi ball is it?')
})

cron.schedule('0 0 * * *', () => {
    console.log('Running update toplevels & dailyScore ...');
    // Call your function here
    updateScoresTable();
});

cron.schedule('0 * * * *', () => {
    hourlyTask();
});

async function hourlyTask() {
    try {
        await topDailyUsers.deleteMany({});
        let top = await User.find({},{},{sort: { 'dailyScore' : -1 }}).limit(100);

        if(top.length > 0)
        // Step 4: Insert the top 100 scores into the collection
        await topDailyUsers.insertMany(top);
        console.log('hourly updated successfully');
        
    } catch (error) {
        console.error('Error updating horly hours:', error);
    }
    
}

async function updateScoresTable() {
    try {
        // Step 1: Clear the existing scores
        await Mostchallenging.deleteMany({});

        let top = await Level.find({},{},{sort: { 'difficulty' : -1 }}).limit(100);

        if(top.length > 0)
        // Step 4: Insert the top 100 scores into the collection
        await Mostchallenging.insertMany(top);

        await Mostliked.deleteMany({});
        let top1 = await Level.find({},{},{sort: { 'likes' : -1 }}).limit(100);

        if(top1.length > 0)
        // Step 4: Insert the top 100 scores into the collection
        await Mostliked.insertMany(top1);

        await User.updateMany({}, { $set: { dailyScore: 0 } });

        ///leaderBoard

        await TopUser.deleteMany({});
        let top2 = await User.find({},{},{sort: { 'score' : -1 }}).limit(100);

        if(top2.length > 0)
        // Step 4: Insert the top 100 scores into the collection
        await TopUser.insertMany(top2);

        console.log('top levels updated successfully');
    } catch (error) {
        console.error('Error updating levels table:', error);
    }
}

const port = process.env.PORT || 8000


app.listen(port , ()=>{
    console.log(`server on port : ${port}`)
})





