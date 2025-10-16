const express = require('express');
const fs = require('fs');
const path = require('path');

// rpBasicAuth file serving module
function createFileRouter() {
    const router = express.Router();

    // Serve rpBasicAuth.wsdl with fixed import URLs
    router.get('/rpBasicAuth.wsdl', (req, res) => {
        console.log('📄 Serving rpBasicAuth.wsdl');
        const wsdlPath = path.join(__dirname, 'rpBasicAuth.wsdl');
        try {
            let wsdlContent = fs.readFileSync(wsdlPath, 'utf8');
            // Fix import URLs to point to our server
            wsdlContent = fixImportUrls(wsdlContent);
            res.type('application/xml');
            res.send(wsdlContent);
        } catch (error) {
            console.error('Error serving rpBasicAuth.wsdl:', error);
            res.status(404).send('WSDL file not found');
        }
    });

    // Serve rpBasicAuthWS_xsd1.xsd
    router.get('/rpBasicAuthWS_xsd1.xsd', (req, res) => {
        console.log('📄 Serving rpBasicAuthWS_xsd1.xsd');
        const xsdPath = path.join(__dirname, 'rpBasicAuthWS_xsd1.xsd');
        try {
            const xsdContent = fs.readFileSync(xsdPath, 'utf8');
            res.type('application/xml');
            res.send(xsdContent);
        } catch (error) {
            console.error('Error serving rpBasicAuthWS_xsd1.xsd:', error);
            res.status(404).send('XSD file not found');
        }
    });

    // Serve any other files in rpBasicAuth directory (imports, etc.)
    router.get('/:filename', (req, res) => {
        const filename = req.params.filename;
        console.log(`📄 Serving rpBasicAuth file: ${filename}`);

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

// Fix import URLs in WSDL content
function fixImportUrls(wsdlContent) {
    // Replace any existing URLs with our server URLs
    return wsdlContent.replace(
        /schemaLocation="([^"]*)"/g,
        (match, url) => {
            // Extract just the filename from the URL
            const filename = url.split('/').pop();
            return `schemaLocation="http://localhost:8000/rpBasicAuth/${filename}"`;
        }
    );
}

module.exports = {
    createFileRouter
};
