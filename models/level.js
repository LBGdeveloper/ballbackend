const mongoose = require('mongoose');
const commonSchema = require('./commonSchema');

module.exports = mongoose.model("Level",commonSchema)