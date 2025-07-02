const cors = require('cors');

const corsOptions = {
    origin: "*",
    credentials: true,
    methods: ["*"],
    allowedHeaders: ["*"]
};

module.exports = cors(corsOptions);