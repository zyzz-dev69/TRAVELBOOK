require("dotenv").config();

const express = require('express');
const app = express();
const port = 3000;
const nodemailer = require('nodemailer');
const ATLAS_URL = process.env.MONGO_ATLAS_URL;
const mongoose = require('mongoose');
const path = require('path');
const { linkSync, stat, rmSync } = require('fs');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const { isLoggedIn, saveRedirectURL, isOwner, verifyCreator, isAdmin, checkNSFW } = require("./middleware.js");

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
const { Subscription } = require("./models/subscription.js");
const e = require("connect-flash");
const { subscribe } = require("diagnostics_channel");

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));


//CONNECTION WITH DATABASE (MONGOATLAS)
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
app.get("/listings/room", wrapAsync(listingController.rooms));
app.get("/listings/apartment", wrapAsync(listingController.apartments));
app.get("/listings/banglow", wrapAsync(listingController.banglows));
app.get("/listings/villa", wrapAsync(listingController.villas));
app.get("/listings/farmhouse", wrapAsync(listingController.farmhouses));
app.get("/listings/penthouse", wrapAsync(listingController.penthouses));

app.get("/", async (req, res) => {
    console.log(req.socket.remoteAddress);
    res.send(
        `<h1>Welcome to the Home Page!</h1><br>
        <a href="https://travelbook-dmr4.onrender.com/listings">Click here to View all Listings!</a>`);
});
// app.get("/user", (req, res) => {
//     console.log(req.socket.remoteAddress);
//     res.send("Yes")
// })

// New Listing Route **Use JOI for server side schema validation**
app.get("/listings/new", isLoggedIn, (listingController.newListingForm));
app.post("/listings", isLoggedIn, upload.single('image'), checkNSFW, wrapAsync(listingController.createListing));

//Edit Routes
app.get("/listings/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.editFormRender));
app.put("/listings/:id", isLoggedIn, isOwner, upload.single('image'), checkNSFW, wrapAsync(listingController.updateListing));

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

//USER LISTINGS
app.get("/listings/:id/myListings", isLoggedIn, async (req, res) => {
    let { id } = req.params;
    let allListings = await Listing.find({ owner: id })
    console.log(allListings)
    res.render("listings/myListings", { allListings });
});

//USER BOOKINGS
app.get("/listings/:id/myBookings", isLoggedIn, async (req, res) => {
    //code to find booked lists....
    res.render("listings/myBookings");
})


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

app.get("/admin/dashboard", isLoggedIn, isAdmin, wrapAsync(async (req, res) => {
    let totalListings = await Listing.countDocuments();
    let totalBookedListings = await Listing.countDocuments({ booked: true });
    let totalUsers = await User.countDocuments({ role: 'user' });
    let totalReviews = await Review.countDocuments();
    let totalReports = await Report.countDocuments({ reportStatus: "pending" });
    let totalSubscribers = await Subscription.countDocuments({ isActive: true });
    res.render("admin/admin.ejs", { totalListings, totalUsers, totalReviews, totalBookedListings, totalReports, totalSubscribers });
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

//REPORTS
app.get("/admin/reports", isLoggedIn, isAdmin, wrapAsync(async (req, res) => {
    let allReports = await Report.find({ reportStatus: "pending" });
    res.render("report/reports", { allReports });
}));

//Resolving Report
app.post("/admin/report/:id", isLoggedIn, isAdmin, async (req, res) => {
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

});

//Subscription Routes
app.get("/admin/subscribers", isLoggedIn, isAdmin, async (req, res) => {
    let subscribers = await Subscription.find({ isActive: true });
    res.render("subscribers/subscribers", { subscribers });
})


// Helper function to send welcome email
async function sendWelcomeEmail(email, username) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MY_GMAIL,
            pass: process.env.APP_PASS
        }
    });
    const mailOptions = {
        from: "travelbookofficialteam",
        to: email,
        subject: 'Welcome to TRAVELBOOK Newsletter!',
        html: `<div style="font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #333; padding: 32px; border-radius: 10px; box-shadow: 0 4px 16px rgba(251,90,87,0.10); max-width: 600px; margin: auto;">
            <div style="text-align:center;">
                 <img src="https://res.cloudinary.com/dfdudnocp/image/upload/v1751133184/My%20Brand/1_yykbrz.png" alt="TravelBook Logo" style="width: 200px; height: 150px; margin-bottom: -50px">
            </div>
            <h1 style="color: #FB5A57; margin-bottom: 8px; text-align:center; font-size:2.2em;">WELCOME TO TRAVELBOOK!</h1>
            <hr style="border: none; border-top: 2px solid #FB5A57; margin: 32px 0;">
            <p style="font-size: 1.1em; margin-top:24px;">
            Hi ${username},<br>
            We're absolutely delighted to welcome you to our vibrant travel community! 🌍
            </p>
            <p>
                As a member, you'll enjoy <span style="color: #FB5A57; font-weight: bold;">exclusive travel tips</span>, <span style="color: #FB5A57; font-weight: bold;">personalized recommendations</span>, and <span style="color: #FB5A57; font-weight: bold;">special discounts</span> delivered straight to your inbox.
            </p>
            <p>
                <span style="color: #FB5A57; font-weight: bold;">Ready to explore?</span> Discover breathtaking destinations, plan your next trip, and unlock member-only deals curated just for you!
            </p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="https://travelbook-dmr4.onrender.com/listings" 
                   style="background: #FB5A57; color: #fff; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-size: 1.15em; font-weight: bold; box-shadow: 0 2px 8px rgba(251,90,87,0.18); display: inline-block; letter-spacing:1px;">
                   Explore TRAVELBOOK
                </a>
            </div>
            <hr style="border: none; border-top: 2px solid #FB5A57; margin: 32px 0;">
            <p style="font-size: 1em; color: #444;">
                Have questions or need travel advice? <span style="color:#FB5A57;font-weight:bold;">Just reply to this email</span>—our team is here to help!
            </p>
            <p style="font-size: 1em; color: #444;">
                Wishing you unforgettable journeys and new adventures,<br>
                <span style="color: #FB5A57; font-weight: bold;">The TRAVELBOOK Team</span>
            </p>
            <div style="margin-top: 32px; text-align: center; color: #FB5A57; font-size: 1em;">
                <em>Connect with us on <a href="https://instagram.com/jodzyrox" style="color:#FB5A57;text-decoration:underline;">Instagram</a> and <a href="https://discord.com/users/_web.dev_" style="color:#FB5A57;text-decoration:underline;">Discord</a> for daily inspiration & updates!</em>
            </div>
        </div>`
    };
    return transporter.sendMail(mailOptions);
}

app.post("/subscribe", wrapAsync(async (req, res) => {
    const { username, email } = req.body;
    console.log(`Username : ${username} , Email : ${email}`);
    try {
        const existingSubs = await Subscription.find({ email, isActive: true });
        if (existingSubs.length >= 1) {
            req.flash("error", "You are already subscribed!");
            return res.redirect("/listings");
        }
        const newSubscription = new Subscription({ username, email });
        await newSubscription.save();
        req.flash("success", "Subscribed Successfully!");
        console.log("New Subscription Created!");
        try {
            await sendWelcomeEmail(email, username);
            console.log("Email sent successfully");
        } catch (emailError) {
            console.error("Error sending email:", emailError);
        }
        return res.redirect("/listings");
    } catch (err) {
        console.log("Error in checking subscription : ", err);
        req.flash("error", "Some error in Database, Try again later!");
        return res.redirect("/listings");
    }
}));

app.delete("/unSubscribe/:id", isLoggedIn, isAdmin, async (req, res) => {
    let { id } = req.params;
    // let subscription = await Subscription.findByIdAndUpdate(id, { isActive: false }, { runValidators: true, new: true });
    let delSubscription = await Subscription.findByIdAndDelete(id);
    console.log(`Unsubscribed : ${delSubscription}`);
    req.flash("success", "Unsubscribed Successfully!");
    res.redirect("/admin/subscribers");
});


//NSFW CHECKER
app.post("/check", (req, res) => {
    console.log("*********************")
    console.log(req.file)
    console.log("*********************")
    res.json({ "success": "YES" })
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