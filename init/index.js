const mongoose = require("mongoose");
const data = require("./data.js");
const Listing = require("../models/listing.js");

const Mongo_url = "mongodb://127.0.0.1:27017/wanderlust";

main().then(() => {
    console.log("connected to DB");
}).catch((err) => {
    console.log(err);
});

async function main() {
  await mongoose.connect(Mongo_url);

}

const initDB = async () => {
    await Listing.deleteMany({});
    data.data = data.data.map((obj) => ({
        ...obj, 
        owner: "6a69fce9a6dcb53368f77174",

    }));
    await Listing.insertMany(data.data);
    console.log("data was initialized");
    mongoose.connection.close();
};

initDB();