require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js") //access listing in models
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapasync.js");
const ExpressError = require("./utils/ExpressError.js");
const { error } = require("console");
const { listingSchema, reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");

const session = require("express-session");
const flash = require("connect-flash");
const MongoStore = require("connect-mongo").default;


//for Authorization & Authentication
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");


const listingsRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");


// const Mongo_url = "mongodb://127.0.0.1:27017/wanderlust";

// main().then(() => {
//     console.log("connected to DB");
// }).catch((err) => {
//     console.log(err);
// });

// async function main() {
//   await mongoose.connect(Mongo_url);

// }

async function connectDB() {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas");
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "public")));

// defining session options
// const sessionOptions = {
//     secret: "secretcode",
//     resave: false,
//     saveUninitialized: true,
//     cookie: {
//         expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
//         maxAge: 7 * 24 * 60 * 60 * 1000,
//         httpOnly: true, 
//     }
// };

const sessionOptions = {
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: "sessions",
        ttl: 7 * 24 * 60 * 60
    }),

    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    }
};



app.get("/", (req, res) => {
    res.send("hii there!!");
});

//Session Options
// app.use(session(sessionOptions));
// app.use(flash()); 

// Connect to database before handling requests
app.use(async (req, res, next) => {
    try {
        await connectDB();
        console.log("Database middleware called");
        next();
    } catch (err) {
        next(err);
    }
});

// Vercel proxy configuration
app.set("trust proxy", 1);

// Session Options
app.use(session(sessionOptions));
app.use(flash());

//passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})


// all the routes is inside routes folder
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);


app.get("/testListing", wrapAsync(async (req, res) => {
    let sampleListing = new Listing({
        title: "my new villa",
        description: "by the beach",
        price: 1500,
        location: "Goa",
        country: "India",

    });
    await sampleListing.save();
    console.log("sample saved");
    res.send("successful testing");
})); 

app.all(/(.*)/, (req, res, next) => {
    next(new ExpressError(404, "page not found"));
});

app.use((err, req, res, next) => {
    let {statusCode=500, message="something went wrong!"} = err;
    res.status(statusCode).render("listings/error.ejs", { statusCode, message });

});

// app.listen(8080, () => {
//     console.log("listening");
// });

if (require.main === module) {
    connectDB()
        .then(() => {
            app.listen(process.env.PORT || 8080, () => {
                console.log("WanderLust server running");
            });
        })
        .catch((err) => {
            console.error("MongoDB connection failed:", err);
            process.exit(1);
        });
}

module.exports = app;