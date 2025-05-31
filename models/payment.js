const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
    listingId: {
        type: Schema.Types.ObjectId,
        ref: 'Listing'
    },
    paymentBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    paymentAmount: {
        type: Number,
        min: 100
    },
    paymentTime:{
        type:Date,
        default:Date.now()
    } 
});

const Payment = mongoose.model("Payment" , paymentSchema);

module.exports = Payment;