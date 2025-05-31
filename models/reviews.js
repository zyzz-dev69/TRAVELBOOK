const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    comment: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});
// module.exports = monsoose.model("Reveiw" , reviewSchema);
const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;

