const Listing = require("../models/listings");
const cloudinary = require("cloudinary").v2;


module.exports.index = async (req, res) => {
    let allListings = await Listing.find({ booked: false });
    res.render("listings/index.ejs", { allListings });
};
module.exports.rooms = async (req, res) => {
    let allListings = await Listing.find({ propertyType: "room", booked: false });
    res.render("listings/filteredListings/rooms.ejs", { allListings });
};
module.exports.apartments = async (req, res) => {
    let allListings = await Listing.find({ propertyType: "apartment", booked: false });
    res.render("listings/filteredListings/apartments.ejs", { allListings });
};
module.exports.banglows = async (req, res) => {
    let allListings = await Listing.find({ propertyType: "banglow", booked: false });
    res.render("listings/filteredListings/banglows.ejs", { allListings });
};
module.exports.villas = async (req, res) => {
    let allListings = await Listing.find({ propertyType: "villa", booked: false });
    res.render("listings/filteredListings/villas.ejs", { allListings });
};
module.exports.farmhouses = async (req, res) => {
    let allListings = await Listing.find({ propertyType: "farmhouse", booked: false });
    res.render("listings/filteredListings/farmhouses.ejs", { allListings });
};
module.exports.penthouses = async (req, res) => {
    let allListings = await Listing.find({ propertyType: "penthouse", booked: false });
    res.render("listings/filteredListings/penthouses.ejs", { allListings });
};

module.exports.newListingForm = (req, res) => {
    res.render("listings/newListing.ejs");
};

module.exports.createListing = async (req, res) => {
    let { title, description, price, location, country, propertyType } = req.body;
    let newListing = new Listing({
        title: title,
        description: description,
        price: price,
        location: location,
        country: country,
        propertyType: propertyType,
    });
    newListing.owner = req.user._id;
    newListing.image.url = req.file.path;
    newListing.image.filename = req.file.filename;
    // console.log(newListing);
    // console.log(req.file);
    await newListing.save();
    req.flash("success", "Listing added Successfully!");
    res.redirect("/listings");


};

module.exports.editFormRender = async (req, res) => {
    let { id } = req.params;
    let editList = await Listing.findById(id);
    if (!editList) {
        req.flash("error", "The listing you requested could not be found!");
        res.redirect("/listings");
    };
    let modedImgUrl = editList.image.url.replace("/upload", "/upload/h_120,w_200");
    res.render("listings/edit.ejs", { editList, modedImgUrl });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body }, { runValidators: true, new: true });
    if (typeof req.file !== 'undefined') {
        listing.image.url = req.file.path;
        listing.image.filename = req.file.filename;
        await listing.save();
    };
    req.flash("success", "Listing Updated Successfully!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(`Deleted Listing : ${deletedListing}`);
    let public_id = deletedListing.image.filename;
    // console.log(public_id);
    cloudinary.uploader.destroy(public_id).then((res) => console.log(res)).catch((err) => console.log(err));
    req.flash("success", "Listing Deleted Successfully!")
    res.redirect("/listings");
};

module.exports.specificListing = async (req, res) => {
    let { id } = req.params;
    let list = await Listing.findById(id).populate({ path: "reviews", populate: { path: "createdBy" } }).populate("owner"); //Field name is passed here as a reference of which we need details.
    console.log(list);
    if (!list) {
        req.flash("error", "The listing you requested could not be found!");
        res.redirect("/listings");
    } else {
        res.render("listings/list.ejs", { list });
    };
};