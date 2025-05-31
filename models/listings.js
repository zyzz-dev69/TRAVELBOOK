const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./reviews.js');

//No need for connection because we exported the model and not running this file.
// async function main() {
//     await mongoose.connect('mongodb://127.0.0.1:27017/wonderlust');
// };

// main()
//     .then((() => console.log("connection established with Database")))
//     .catch((err) => console.log(err));

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    image: {
        url: String,
        filename: String
    },
    price: {
        type: Number,
        min: 100,
        set: (p) => p === '' ? 100 : p,
    },
    location: {
        type: String,
    },
    country: {
        type: String,
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review', //That model is passed here as a reference of which data(only Id in this case) we want to store here
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    booked:{
        type:Boolean,
        default : false
    },
    propertyType:{
        type:String
    },
    bookedBy:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    bookingDuration:{
        type:Number,
        min:1,
        max:60
    },
    bookingExpiration:{
        type:Date
    },
});

listingSchema.post("findOneAndDelete", async (listing) => {

    await Review.deleteMany({ _id: { $in: listing.reviews } });
    // let data = await listing.populate("reviews")
    // console.log(data)
});


// listingSchema.pre("findOneAndDelete" , ()=>{
//     console.log("Pre MiddleWare Triggered!")
// })

const Listing = mongoose.model('Listing', listingSchema);

// let testData = new Listing({
//     title : "Dark Corp's Villa",
//     description : "This is a villa built by the Muhammad Yousaf in the loving memory of his Mom and Dad!",
//     price : 1,
//     location : "Jehangira , Nowhsera , KPK",
//     country : "Pakistan"
// });

// testData.save()
//     .then(((res) => console.log(res)))
//     .catch((err) => console.log(err));


module.exports = Listing;