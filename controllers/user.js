const User = require("../models/users");

module.exports.signupForm = (req, res) => {
    res.render("login/signup.ejs");
};

module.exports.signUpUser = async (req, res) => {
    try {
        let { username, email, password } = req.body;
        let user =  new User({
            username: username,
            email: email,
        });
        let newUser = await User.register(user, password);
        console.log(newUser);
        req.login(newUser, (err) => {
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
};

module.exports.loginForm = (req, res) => {
    res.render("login/login.ejs")
};

module.exports.loginUser = async (req, res) => {
    let { username } = req.body;
    req.flash("success", `Welcome back " ${username} ".`);
    let redirectURL = res.locals.redirectURL || "/listings";
    res.redirect(redirectURL);
};

module.exports.logoutUSer = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        } else {
            req.flash("success", "Logged Out Successfully!");
            res.redirect("/listings");
        }
    });
};