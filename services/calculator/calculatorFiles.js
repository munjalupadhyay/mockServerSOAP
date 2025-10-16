const express = require('express');
const fs = require('fs');
const path = require('path');

// Calculator file serving module
function createFileRouter() {
    const router = express.Router();

    // Serve calculator.wsdl
    router.get('/calculator.wsdl', (req, res) => {
        console.log('📄 Serving calculator.wsdl');
        const wsdlPath = path.join(__dirname, 'calculator.wsdl');
        try {
            const wsdlContent = fs.readFileSync(wsdlPath, 'utf8');
            res.type('application/xml');
            res.send(wsdlContent);
        } catch (error) {
            console.error('Error serving calculator.wsdl:', error);
            res.status(404).send('WSDL file not found');
        }
    });

    // Serve any other files in calculator directory (imports, etc.)
    router.get('/:filename', (req, res) => {
        const filename = req.params.filename;
        console.log(`📄 Serving calculator file: ${filename}`);

        const filePath = path.join(__dirname, filename);
        try {
            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                res.type('application/xml');
                res.send(fileContent);
            } else {
                res.status(404).send('File not found');
            }
        } catch (error) {
            console.error(`Error serving file ${filename}:`, error);
            res.status(404).send('File not found');
        }
    });

    return router;
}

module.exports = {
    createFileRouter
};
