const { cloudinary } = require("./cloudConfig");
const Listing = require("./models/listings");
const Review = require("./models/reviews");

const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");


//CHECKING IF A USER IS LOGGED IN
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

//THE PREVIOUS PAGE ADDRESS | URL
module.exports.saveRedirectURL = (req, res, next) => {
    console.log("i was called")
    if (req.session.redirectURL) {
        res.locals.redirectURL = req.session.redirectURL;
    }
    next();
};

//VERIFYING IF THE CURRENT USER IS THE OWNER OF THE LISTING
module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id)
    // if (!listing.owner._id.equals(req.user._id)) {
    //     req.flash("error", "You do not have the permission to perform this action!");
    //     return res.redirect(`/listings/${id}`)
    // };
    if (listing.owner._id.equals(req.user._id) || req.user.role == 'admin') {
        return next();
    };
    req.flash("error", "You do not have the permission to perform this action!");
    res.redirect(`/listings/${id}`);
};

//VERIFYING IF THE CURRENT USER IS THE AUTHOR OF THE REVIEW
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

//VERIFYING IF THE CURENT USER IS ADMIN
module.exports.isAdmin = (req, res, next) => {
    if (!req.user || req.user.role == "user") {
        req.flash("error", "Unauthorized Access!");
        return res.redirect("/listings");
    };
    next();
}

//NSFW CHECKING
module.exports.checkNSFW = (req, res, next) => {
if(req.file){

    let IMG_URL = req.file.path;
    // Tesing if an image is SFW or NSFW for my TRAVELBOOK FYP!
    const PAT = '08139d5caed0426c956673fa7c08a75a';//Personal Access Token

    const USER_ID = 'clarifai';
    const APP_ID = 'main';
    // Change these to whatever model and image URL you want to use
    const MODEL_ID = 'nsfw-recognition';
    const MODEL_VERSION_ID = 'aa47919c9a8d4d94bfa283121281bcc4';


    const stub = ClarifaiStub.grpc();

    // This will be used by every Clarifai endpoint call
    const metadata = new grpc.Metadata();
    metadata.set("authorization", "Key " + PAT);

    stub.PostModelOutputs(
        {
            user_app_id: {
                "user_id": USER_ID,
                "app_id": APP_ID
            },
            model_id: MODEL_ID,
            version_id: MODEL_VERSION_ID, // This is optional. Defaults to the latest model version
            inputs: [
                { data: { image: { url: IMG_URL, allow_duplicate_url: true } } }
            ]
        },
        metadata,
        (err, response) => {
            if (err) {
                throw new Error(err);
            }
            
            if (response.status.code !== 10000) {
                throw new Error("Post model outputs failed, status: " + response.status.description);
            }
            
            // Since we have one input, one output will exist here
            const output = response.outputs[0];
            
            let sfwScore = null, nsfwScore = null;
            
            console.log("Predicted concepts:");
            for (const concept of output.data.concepts) {
                if (concept.name == "sfw") sfwScore = concept.value;
                else if (concept.name == "nsfw") nsfwScore = concept.value;
                // console.log(concept.name + " " + concept.value);
            }
            console.log(sfwScore, nsfwScore);
            if (sfwScore > nsfwScore) {
                next();
            } else {
                req.flash("error", "NSFW CONTENT DETECTED. TRY AGAIN!.");
                const public_id = req.file.filename;
                cloudinary.uploader.destroy(public_id).then((res) => console.log(res)).catch((err) => console.log(err));
                // console.log(req.headers.referer)
                res.redirect(req.headers.referer);
            }
        }
        
    );
}else return next();

};