if (process.env.NODE_ENV != 'production') {
    require("dotenv").config();
};
const express = require('express');
const app = express();
const port = 3000;
const ATLAS_URL = process.env.MONGO_ATLAS_URL;
const mongoose = require('mongoose');
const path = require('path');
const { linkSync, stat, rmSync } = require('fs');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const { isLoggedIn, saveRedirectURL, isOwner, verifyCreator, isAdmin } = require("./middleware.js");

const listingController = require("./controllers/listing.js");
const reviewController = require("./controllers/review.js");
const userController = require("./controllers/user.js");

const passport = require('passport');
const LocalStrategy = require('passport-local');

const multer = require("multer");
const { storage } = require("./cloudConfig.js");
const upload = multer({ storage });

const session = require("express-session");
const mongoStore = require("connect-mongo");

const sessionStore = mongoStore.create({
    mongoUrl: ATLAS_URL,
    touchAfter: 24 * 60 * 60, // 24 hours
    crypto: {
        secret: process.env.MY_SESSION_SECRET, // Use a strong secret for encryption
    }
});
sessionStore.on("error", (err) => {
    console.log("Session Store Error : ", err); 
    // Handle session store errors here
});
sessionStore.on("connected", () => {
    console.log("Session Store Connected Successfully!");    
     //Handle successful connection to the session store here
 });

const sessionOptions = {
    store: sessionStore,
    name: "session",
    secret: process.env.MY_SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
};

const flash = require("connect-flash");

const expressError = require('./utils/expressError');
const wrapAsync = require('./utils/wrapAsync');
const { wrap } = require('module');
const cookie = require('express-session/session/cookie');
const Listing = require("./models/listings.js");
const User = require("./models/users.js");
const Review = require("./models/reviews.js");
const { Report } = require("./models/report.js");
const Payment = require("./models/payment.js");

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

mongoose.connect(ATLAS_URL)
    .then((() => console.log("connection established with Database")))
    .catch((err) => console.log(err));


//SESIONS AND FLASH
app.use(session(sessionOptions));
app.use(flash());


//Passport strategy requires session to be working;
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//LOCAL VARIABLES (Note : Always keep it below the passport)
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});



app.listen(port, () => console.log(`Server launched at localhost:${port}`));

//Index Route
app.get("/listings", wrapAsync(listingController.index));
app.get("/listings/room", wrapAsync(listingController.room));
app.get("/listings/apartment", wrapAsync(listingController.apartment));
app.get("/listings/banglow", wrapAsync(listingController.banglow));
app.get("/listings/villa", wrapAsync(listingController.villa));
app.get("/listings/farmhouse", wrapAsync(listingController.farmhouse));
app.get("/listings/penthouse", wrapAsync(listingController.penthouse));
app.get("/", async (req, res) => {
    let allUsers = await User.find();
    res.send(allUsers);
    console.log(allUsers);
})
app.get("/user", (req, res) => {
    console.log(req.socket.remoteAddress);
    res.send("Yes")
})

// New Listing Route **Use JOI for server side schema validation**
app.get("/listings/new", isLoggedIn, (listingController.newListingForm));
app.post("/listings", isLoggedIn, upload.single('image'), wrapAsync(listingController.createListing));

//Edit Routes
app.get("/listings/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.editFormRender));
app.put("/listings/:id", isLoggedIn, isOwner, upload.single('image'), wrapAsync(listingController.updateListing));

//Delete Route
app.delete("/listings/:id", isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

//Footer
app.get("/listings/terms&conditions", (req, res) => {
    res.render('footer/termsAndConditions');
});
app.get("/listings/privacyPolicy", (req, res) => {
    res.render('footer/privacy');
});

//Specific List Route
app.get("/listings/:id", wrapAsync(listingController.specificListing));


//Booking Routes
app.get("/listings/:id/booking", isLoggedIn, async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    res.render("booking/booking", { listing });
})
app.post("/listings/:id/booking", isLoggedIn, wrapAsync(async (req, res, next) => {
    let { id: bookedListingId } = req.params;
    let { duration, paymentAmount } = req.body;
    let currUser = req.user.id;
    let currTime = new Date();
    let bookingExpiration = new Date(currTime.getTime() + (duration * 24 * 60 * 60 * 1000));

    // let updatedListing = await Listing.findByIdAndUpdate(bookedListingId,
    //     { booked: true, bookedBy: currUser, bookingDuration: duration, bookingExpiration: bookingExpiration },
    //     { runValidators: true, new: true });
    let newPayment = new Payment({
        listingId: bookedListingId,
        paymentBy: currUser,
        paymentAmount: paymentAmount
    });
    await newPayment.save();
    req.flash("success", "Booked successfully!");
    res.redirect("/listings");
}));



//REVEIWS ROUTES
// Review Post Route
app.post("/listings/:id/reviews", isLoggedIn, wrapAsync(reviewController.createReview));

//Review Delete Route
app.delete("/listings/:id/reviews/:reviewId", isLoggedIn, verifyCreator, wrapAsync(reviewController.destroyReview));

//USER SIGNUP
app.get("/signup", userController.signupForm);
app.post("/signup", wrapAsync(userController.signUpUser));

//USER LOGIN
app.get("/login", userController.loginForm);
app.post("/login",
    saveRedirectURL,
    passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }),
    userController.loginUser
);

//USER LOGOUT
app.get("/logout", userController.logoutUSer);

//ADMIN ROUTES
app.get("/admin/signup", wrapAsync((req, res) => {
    res.render("admin/signup.ejs");
}));

app.post("/admin/signup", async (req, res) => {
    try {
        let { username, email, password } = req.body;
        let user = new User({
            username: username,
            email: email,
            role: "admin"
        });
        let newAdmin = await User.register(user, password);
        console.log(newAdmin);
        req.login(newAdmin, (err) => {
            if (err) {
                return next(err)
            } else {
                req.flash("success", "Logged in Successfully!");
                res.redirect("/listings");
            }
        });
    } catch (err) {
        if (err.name == 'MongoServerError') {
            req.flash("error", "Email already registered!");
            res.redirect("/signup");
        }
        else if (err.name == 'UserExistsError') {
            req.flash("error", "Username already exists!");
            res.redirect("/signup");
        } else {
            req.flash("error", err.name);
            res.redirect("/signup");
        };
    };
});

app.get("/admin/dashboard", isAdmin, wrapAsync(async (req, res) => {
    let totalListings = await Listing.countDocuments();
    let totalBookedListings = await Listing.countDocuments({ booked: true });
    let totalUsers = await User.countDocuments({ role: 'user' });
    let totalReviews = await Review.countDocuments();
    let totalReports = await Report.countDocuments({ reportStatus: "pending" });
    res.render("admin/admin.ejs", { totalListings, totalUsers, totalReviews, totalBookedListings, totalReports });
}));

//REPORTS ROUTES
app.get("/listings/:id/report", isLoggedIn, wrapAsync(async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    console.log(listing)
    res.render("report/reportForm", { listing })
}));

app.post("/listings/:id/report", isLoggedIn, wrapAsync(async (req, res, next) => {
    let userId = req.user.id;
    let { id } = req.params;
    let { reason } = req.body;
    let rep = await Report.create({ reason, userId, listingId: id })
    req.flash("success", "Reported Successfully!");
    console.log(`Report :${rep}`);
    res.redirect(`/listings/${id}`);
}));

app.get("/admin/reports", isAdmin, wrapAsync(async (req, res) => {
    let allReports = await Report.find({ reportStatus: "pending" });
    res.render("report/reports", { allReports });
}));

//Resolving Report
app.post("/admin/report/:id", async (req, res) => {
    let { id } = req.params;
    let report = await Report.findByIdAndUpdate(id, { reportStatus: "resolved" }, { runValidators: true, new: true });
    console.log(`Reolved : ${report}`);
    req.flash("success", "Report Resolved Successfully!");
    res.redirect("/admin/reports");
});

//Paymnet Routes
app.post("/payment-response", (req, res) => {
    console.log(req.body);
    res.redirect("/listings");
});

//Searching  Based on Titles
app.get("/searchTitles", async (req, res) => {
    const query = req.query.q || "";
    try {
        const regex = new RegExp(query, "i");
        const resultListings = await Listing.find({ title: regex }).select('title _id').limit(10);
        res.json(resultListings);
        console.log(`***********The searched Listings : ${resultListings} **********`)

    } catch (error) {
        res.json(error);
        console.log(error)
    }

})

//MiddleWares
app.all('*', (req, res, next) => {//to handle req sent on nonexisting routes //Don not write 'err' as arguments.
    next(new expressError(404, 'Page not Found!'));
    // next(err);
})

app.use((err, req, res, next) => {
    let { statusCode = 500, message = 'Something went wrong!' } = err;
    console.log(err);
    // res.status(statusCode).send(message);

    if (err.name === 'CastError') {  //Demostration of sending errors based on their names
        let reason = 'Cast Error Occured. Therefore the List could not be found'
        res.status(statusCode).render('listings/error.ejs', { reason });
    }
    else if (err.name === 'Error') {
        let reason = 'Page Not Found!'
        res.status(statusCode).render('listings/error.ejs', { reason });
    }
    else if (err.name === 'ValidationError') {
        let reason = 'Validation Error Occured. Plz fill out the fields correctly.'
        res.status(statusCode).render('listings/error.ejs', { reason });
    }
    else res.status(statusCode).send(message);


});
//**When handling errors with try and catch DONOT use ".then()"&.catch() */