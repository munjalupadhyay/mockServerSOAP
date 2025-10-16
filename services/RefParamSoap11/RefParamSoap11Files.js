const express = require('express');
const fs = require('fs');
const path = require('path');

// RefParamSoap11 file serving module
function createFileRouter() {
    const router = express.Router();

    // Serve RefParamSoap11.wsdl
    router.get('/RefParamSoap11.wsdl', (req, res) => {
        console.log('📄 Serving RefParamSoap11.wsdl');
        const wsdlPath = path.join(__dirname, 'RefParamSoap11.wsdl');
        try {
            const wsdlContent = fs.readFileSync(wsdlPath, 'utf8');
            res.type('application/xml');
            res.send(wsdlContent);
        } catch (error) {
            console.error('Error serving RefParamSoap11.wsdl:', error);
            res.status(404).send('WSDL file not found');
        }
    });

    // Serve any other files in RefParamSoap11 directory (imports, etc.)
    router.get('/:filename', (req, res) => {
        const filename = req.params.filename;
        console.log(`📄 Serving RefParamSoap11 file: ${filename}`);

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
