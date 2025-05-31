//With the help of this file we initialize the Database.
const mongoose = require('mongoose');
const Listing = require('../models/listings');
const listingData = require('./init');
const User = require('../models/users')

main()
    .then((() => console.log("connection established with Database")))
    .catch((err) => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/wonderlust');
};

async function initDB() {
    // await User.deleteMany().then((res) => console.log(res)).catch((res) => console.log(res))
    // let admin = new User({
    //     _id: "111111111111aaaaaaaaaaaa",
    //     username: "admin",
    //     password: "admin123",
    //     email: "admin@gmail.com"
    // }); Doesn't work because of Passport's automatic authorization i,e no hash value present....
    // await admin.save()
    //     .then((res) => console.log(res))
    //     .catch((res) => console.log(res))

    await Listing.deleteMany({})
        .then((res) => console.log(res))
        .catch((err) => console.log(err));
    let newData = listingData.data.map((obj) => ({ ...obj, owner: "6824b327540840f80d837d27", }));
    await Listing.insertMany(newData)
        .then((res) => console.log(res, "The Listing data was successfully added."))
        .catch((err) => console.log(err));

    // await Listing.find()
    //     .then((res) => console.log(res))
    //     .catch((err) => console.log(err))
};

initDB();
// console.log(listingData.data)

// const addRev = async () => {
//     const rev1 = new Review({ comment: "Good experience!", rating: 5 });
//     let res= await rev1.save();
//     console.log(res);
// };
// addRev();

// const remRev = async ()=>{
//     let listing =await Listing.findById("67363678d45d05d309696976");
//     // console.log(listing);
//     let res = listing.reviews.push('ObjectId("6741f01918ba5490595ff82c")');
//     console.log(res);
// }

// remRev();
