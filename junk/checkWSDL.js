const fs = require('fs');
const path = require('path');

function checkAndFixWsdl(wsdlPath) {
    try {
        let wsdlContent = fs.readFileSync(wsdlPath, 'utf8');
        
        console.log('=== CHECKING WSDL FILE ===');
        
        // Check for common issues
        if (wsdlContent.includes('& ')) {
            console.log('Found unescaped ampersand, fixing...');
            wsdlContent = wsdlContent.replace(/& /g, '&amp; ');
        }
        
        // Remove any BOM characters
        if (wsdlContent.charCodeAt(0) === 0xFEFF) {
            console.log('Found BOM character, removing...');
            wsdlContent = wsdlContent.slice(1);
        }
        
        // Check XML declaration
        if (!wsdlContent.trim().startsWith('<?xml')) {
            console.log('Adding missing XML declaration...');
            wsdlContent = '<?xml version="1.0" encoding="UTF-8"?>\n' + wsdlContent;
        }
        
        // Ensure proper root element
        if (!wsdlContent.includes('<wsdl:definitions') && wsdlContent.includes('<definitions')) {
            console.log('Fixing definitions namespace...');
            wsdlContent = wsdlContent.replace(/<definitions/g, '<wsdl:definitions')
                                    .replace(/<\/definitions/g, '</wsdl:definitions');
        }
        
        // Save cleaned WSDL
        const cleanWsdlPath = wsdlPath.replace('.wsdl', '_clean.wsdl');
        fs.writeFileSync(cleanWsdlPath, wsdlContent);
        console.log('Cleaned WSDL saved to:', cleanWsdlPath);
        
        return cleanWsdlPath;
    } catch (error) {
        console.error('Error checking WSDL:', error);
        return wsdlPath; // Return original if cleanup fails
    }
}

const originalWsdlPath = path.join(__dirname, 'rpBasicAuth.wsdl');
const cleanWsdlPath = checkAndFixWsdl(originalWsdlPath);