const Review = require("../models/reviews");
const Listing = require("../models/listings");

module.exports.createReview = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    newReview.createdBy = req.user._id;
    listing.reviews.push(newReview);

    await listing.save();
    await newReview.save();
    console.log("New Review Added Successfully!");
    req.flash("success", "Review Added Successfully!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyReview = async (req, res) => {
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    let result = await Review.findByIdAndDelete(reviewId);
    console.log("Deleted review :", result);
    req.flash("success", "Review Deleted Successfully!");
    res.redirect(`/listings/${id}`);
};