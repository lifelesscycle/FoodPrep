const express = require('express');
const corsMiddleware = require('./src/middleware/cors');
const errorHandler = require('./src/middleware/errorHandler');
const routes = require('./src/routes');

const app = express();

app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/', (req, res) => {
    res.json({ message: "Express.js with JSON database is running" });
});

app.get('/health', (req, res) => {
    res.json({ status: "healthy", database: "json_files" });
});

app.use(errorHandler);

module.exports = app;