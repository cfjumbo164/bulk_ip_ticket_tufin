process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
require('dotenv').config();

const express = require('express');
const bodyParser = require("body-parser");
const app = express();

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.text());
if(process.env.NODE_ENV === 'production') {
    // We are running in production mode
    const cors = require('cors');
    app.use(cors({
        origin: process.env.URL_ORIGIN_CORS
    }));
    app.use(express.json());
} else {
   // We are running in development mode
}

const routes = require('./api_routes/routes');
routes(app);
const port = process.env.PORT||3000;

app.listen(port, () => {
console.log(`Listening to port http://localhost:${port}`);
console.log("Ambiente: ", process.env.NODE_ENV);
});
