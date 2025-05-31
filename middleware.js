const Listing = require("./models/listings");
const Review = require("./models/reviews");

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectURL = req.originalUrl;
        // console.log(req.session.redirectURL)
        req.flash('error', 'Please login to continue!');
        return res.redirect("/login");
    } else {
        next();
    }

};

module.exports.saveRedirectURL = (req, res, next) => {
    console.log("i was called")
    if (req.session.redirectURL) {
        res.locals.redirectURL = req.session.redirectURL;
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id)
    // if (!listing.owner._id.equals(req.user._id)) {
    //     req.flash("error", "You do not have the permission to perform this action!");
    //     return res.redirect(`/listings/${id}`)
    // };
    if (listing.owner._id.equals(req.user._id) || req.user.role == 'admin'){
        return next();
    };
    req.flash("error" , "You do not have the permission to perform this action!");
    res.redirect(`/listings/${id}`);
};

module.exports.verifyCreator = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    // if (!review.createdBy.equals(req.user._id)) {
    //     req.flash("error", "You don't have the permission to perform this action!");
    //     return res.redirect(`/listings/${id}`);
    // }
    if (review.createdBy.equals(req.user._id) || req.user.role == "admin") {
        return next();
    };
    req.flash("error", "You don't have the permission to perform this action!");
    res.redirect(`/listings/${id}`);
}

module.exports.isAdmin = (req, res, next) => {
    if (!req.user || req.user.role == "user") {
        req.flash("error", "Unauthorized Access!");
        return res.redirect("/listings");
    };
    next();
}