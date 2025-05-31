const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reportSchema = new Schema(
    {
        listingId: {
            type: String
        },
        userId: {
            type: String
        },
        reason: {
            type: String,
            required:true
        },
        reportStatus: {
            type:String,
            default:"pending"
        },
        reportedAt:{
            type:Date,
            default: Date.now()
        }
    }
);

module.exports.Report = mongoose.model("Report", reportSchema);