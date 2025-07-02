const app = require('./app');
const { initializeDatabase } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await initializeDatabase();
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Database initialized with JSON files`);
        });
    } catch (error) {
        console.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
}

startServer()