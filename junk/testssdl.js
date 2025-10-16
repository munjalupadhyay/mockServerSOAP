const soap = require('soap');
const http = require('http');
const fs = require('fs');
const path = require('path');

// First, let's check if the WSDL can be parsed
function testWsdlParsing(wsdlPath) {
    try {
        const wsdlContent = fs.readFileSync(wsdlPath, 'utf8');
        console.log('=== WSDL CONTENT ===');
        console.log(wsdlContent.substring(0, 3000) + '...'); // First 500 chars
        console.log('=== END WSDL CONTENT ===');
        
        // Check for common issues
        if (!wsdlContent.includes('definitions')) {
            console.error('ERROR: WSDL does not contain definitions element');
        }
        
        if (!wsdlContent.includes('message')) {
            console.warn('WARNING: WSDL does not contain message elements');
        }
        
        return true;
    } catch (error) {
        console.error('Error reading WSDL file:', error);
        return false;
    }
}

// Test your WSDL first
const wsdlPath = path.join(__dirname, 'rpBasicAuth.wsdl');
console.log('Testing WSDL at:', wsdlPath);

if (!testWsdlParsing(wsdlPath)) {
    process.exit(1);
}