const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const wsdlPath = path.join(__dirname, 'rpBasicAuth.wsdl');
const wsdlContent = fs.readFileSync(wsdlPath, 'utf8');

async function analyzeWsdl() {
    try {
        const parser = new xml2js.Parser({
            explicitArray: false, // Don't always create arrays
            mergeAttrs: true,     // Merge attributes
            explicitRoot: false   // Don't include root
        });
        
        const result = await parser.parseStringPromise(wsdlContent);
        
        console.log('=== RAW WSDL STRUCTURE ===');
        console.log(JSON.stringify(result, null, 2).substring(0, 2000) + '...');
        
        console.log('\n=== KEY ELEMENTS ===');
        
        // Check for definitions with different namespace prefixes
        const definitions = result['definitions'] || result['wsdl:definitions'];
        if (!definitions) {
            console.log('No definitions found. Available keys:');
            console.log(Object.keys(result));
            return;
        }
        
        console.log('Definitions found:', Object.keys(definitions));
        
        // Service information
        if (definitions.service) {
            console.log('\n=== SERVICES ===');
            const services = Array.isArray(definitions.service) ? definitions.service : [definitions.service];
            services.forEach(service => {
                console.log('Service:', service.$.name);
                if (service.port) {
                    const ports = Array.isArray(service.port) ? service.port : [service.port];
                    ports.forEach(port => {
                        console.log('  Port:', port.$.name);
                        console.log('  Binding:', port.$.binding);
                        if (port['soap:address']) {
                            console.log('  Address:', port['soap:address'].$.location);
                        }
                    });
                }
            });
        }
        
        // Port Types (Operations)
        if (definitions.portType) {
            console.log('\n=== PORT TYPES & OPERATIONS ===');
            const portTypes = Array.isArray(definitions.portType) ? definitions.portType : [definitions.portType];
            portTypes.forEach(portType => {
                console.log('Port Type:', portType.$.name);
                if (portType.operation) {
                    const operations = Array.isArray(portType.operation) ? portType.operation : [portType.operation];
                    operations.forEach(op => {
                        console.log('  Operation:', op.$.name);
                    });
                }
            });
        }
        
        // Bindings
        if (definitions.binding) {
            console.log('\n=== BINDINGS ===');
            const bindings = Array.isArray(definitions.binding) ? definitions.binding : [definitions.binding];
            bindings.forEach(binding => {
                console.log('Binding:', binding.$.name);
                console.log('  Type:', binding.$.type);
            });
        }
        
        // Messages
        if (definitions.message) {
            console.log('\n=== MESSAGES ===');
            const messages = Array.isArray(definitions.message) ? definitions.message : [definitions.message];
            messages.forEach(message => {
                console.log('Message:', message.$.name);
            });
        }
        
        // Types
        if (definitions.types) {
            console.log('\n=== TYPES ===');
            console.log('Types section exists');
        }
        
    } catch (error) {
        console.error('Error analyzing WSDL:', error);
        console.error('Error stack:', error.stack);
    }
}

analyzeWsdl();