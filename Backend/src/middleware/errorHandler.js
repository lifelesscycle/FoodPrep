const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err instanceof multer.MulterError) {
        return res.status(400).json({ detail: err.message });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({ detail: err.message });
    }

    res.status(500).json({ 
        detail: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message 
    });
};

module.exports = errorHandler;