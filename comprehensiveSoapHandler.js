const express = require('express');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const app = express();

// Import service handlers
const calculatorService = require('./services/calculator/calculator');
const rpBasicAuthService = require('./services/rpBasicAuth/rpBasicAuth');
const meteringService = require('./services/MeteringService/MeteringService');
const refParamSoap11Service = require('./services/RefParamSoap11/RefParamSoap11');
const refParamSoap12Service = require('./services/RefParamSoap12/RefParamSoap12');
const headerExtnAttribService = require('./services/HeaderExtnAttribService/HeaderExtnAttribService');

// Import file serving modules
const calculatorFiles = require('./services/calculator/calculatorFiles');
const rpBasicAuthFiles = require('./services/rpBasicAuth/rpBasicAuthFiles');
const meteringFiles = require('./services/MeteringService/MeteringServiceFiles');
const refParamSoap11Files = require('./services/RefParamSoap11/RefParamSoap11Files');
const refParamSoap12Files = require('./services/RefParamSoap12/RefParamSoap12Files');
const headerExtnAttribFiles = require('./services/HeaderExtnAttribService/HeaderExtnAttribServiceFiles');

// Middleware to parse XML
app.use(express.text({ type: 'text/xml' }));

// Available services and their configurations
const SERVICES = {
    calculator: {
        ...calculatorService.WSDL_CONFIG,
        dir: 'calculator',
        handler: calculatorService
    },
    rpBasicAuth: {
        ...rpBasicAuthService.WSDL_CONFIG,
        dir: 'rpBasicAuth',
        handler: rpBasicAuthService
    },
    MeteringService: {
        ...meteringService.WSDL_CONFIG,
        dir: 'MeteringService',
        handler: meteringService
    },
    RefParamSoap11: {
        ...refParamSoap11Service.WSDL_CONFIG,
        dir: 'RefParamSoap11',
        handler: refParamSoap11Service
    },
    RefParamSoap12: {
        ...refParamSoap12Service.WSDL_CONFIG,
        dir: 'RefParamSoap12',
        handler: refParamSoap12Service
    },
    HeaderExtnAttribService: {
        ...headerExtnAttribService.WSDL_CONFIG,
        dir: 'HeaderExtnAttribService',
        handler: headerExtnAttribService
    }
};

// Use service-specific file routers
app.use('/calculator', calculatorFiles.createFileRouter());
app.use('/rpBasicAuth', rpBasicAuthFiles.createFileRouter());
app.use('/MeteringService', meteringFiles.createFileRouter());
app.use('/RefParamSoap11', refParamSoap11Files.createFileRouter());
app.use('/RefParamSoap12', refParamSoap12Files.createFileRouter());
app.use('/HeaderExtnAttribService', headerExtnAttribFiles.createFileRouter());

// Handle SOAP requests for calculator service
app.post('/soap/calculator', async (req, res) => {
    await handleSoapRequest('calculator', req, res);
});

// Handle SOAP requests for rpBasicAuth service
app.post('/soap/rpBasicAuth', async (req, res) => {
    await handleSoapRequest('rpBasicAuth', req, res);
});

// Handle SOAP requests for MeteringService
app.post('/soap/MeteringService', async (req, res) => {
    await handleSoapRequest('MeteringService', req, res);
});

// Handle SOAP requests for RefParamSoap11 service
app.post('/soap/RefParamSoap11', async (req, res) => {
    await handleSoapRequest('RefParamSoap11', req, res);
});

// Handle SOAP requests for RefParamSoap12 service
app.post('/soap/RefParamSoap12', async (req, res) => {
    await handleSoapRequest('RefParamSoap12', req, res);
});

// Handle SOAP requests for HeaderExtnAttribService
app.post('/soap/HeaderExtnAttribService', async (req, res) => {
    await handleSoapRequest('HeaderExtnAttribService', req, res);
});

// Common SOAP request handler
async function handleSoapRequest(serviceName, req, res) {
    try {
        console.log(`📨 Received SOAP request for ${serviceName}`);

        const parser = new xml2js.Parser({
            explicitArray: false,
            mergeAttrs: true
        });

        const result = await parser.parseStringPromise(req.body);
        console.log('🔍 Parsed SOAP envelope');

        // Extract the SOAP Body and Header, and find the operation
        // Handle any namespace prefix for the envelope
        let soapBody = null;
        let soapHeader = null;
        for (const key of Object.keys(result)) {
            if (key.endsWith(':Envelope') || key === 'Envelope') {
                const envelope = result[key];
                // Try different variations of Body
                for (const bodyKey of Object.keys(envelope)) {
                    if (bodyKey.endsWith(':Body') || bodyKey === 'Body') {
                        soapBody = envelope[bodyKey];
                    }
                    if (bodyKey.endsWith(':Header') || bodyKey === 'Header') {
                        soapHeader = envelope[bodyKey];
                    }
                }
                if (soapBody) break;
            }
        }
        if (!soapBody) {
            throw new Error('No SOAP Body found');
        }

        // Find the operation name
        const operationName = detectOperationForService(serviceName, soapBody);

        if (!operationName) {
            throw new Error('No operation found in SOAP request');
        }

        console.log(`⚡ Operation detected: ${operationName} (Service: ${serviceName})`);

        // Find the operation arguments - could be under plain name or namespace-prefixed name
        let operationArgs = soapBody[operationName];
        if (!operationArgs) {
            // Look for namespace-prefixed version
            for (const key of Object.keys(soapBody)) {
                if (key.endsWith(`:${operationName}`)) {
                    operationArgs = soapBody[key];
                    break;
                }
            }
        }

        // Special case for HeaderExtnAttribService: use entire body as args
        if (serviceName === 'HeaderExtnAttribService' && operationName === 'echoHeaderExtnAttributes' && !operationArgs) {
            operationArgs = soapBody;
        }

        const response = await handleOperation(serviceName, operationName, operationArgs, soapHeader);

        // Check if this is a one-way operation (no response expected)
        if (response && response.__oneWay) {
            console.log(`✅ Successfully processed one-way operation ${serviceName}:${operationName}`);
            res.status(202).send(); // 202 Accepted for one-way operations
            return;
        }

        const soapResponse = buildSoapResponse(serviceName, operationName, response);

        res.type('text/xml');
        res.send(soapResponse);

        console.log(`✅ Successfully processed ${serviceName}:${operationName}`);

    } catch (error) {
        console.error('❌ Error processing SOAP request:', error);
        const faultResponse = buildFault(error.message);
        res.type('text/xml');
        res.status(500).send(faultResponse);
    }
}

// Detect operation for a specific service
function detectOperationForService(serviceName, soapBody) {
    const service = SERVICES[serviceName];

    // Check for plain operation names
    for (const op of service.operations) {
        if (soapBody[op]) {
            return op;
        }
    }

    // Check for namespace-prefixed operation names
    // xml2js may create keys like "tns:Add" when namespaces are present
    for (const key of Object.keys(soapBody)) {
        // Extract the operation name after the colon (e.g., "tns:Add" -> "Add")
        const operationName = key.split(':').pop();
        if (service.operations.includes(operationName)) {
            return operationName;
        }
    }

    // Special case for HeaderExtnAttribService: if body contains echoRequest, assume it's echoHeaderExtnAttributes
    if (serviceName === 'HeaderExtnAttribService') {
        const hasEchoRequest = Object.keys(soapBody).some(key => key.includes('echoRequest'));
        if (hasEchoRequest) {
            return 'echoHeaderExtnAttributes';
        }
    }

    return null;
}

// Operation handlers
async function handleOperation(serviceName, operationName, args, soapHeader) {
    console.log(`🛠️ Handling operation: ${serviceName}:${operationName}`, args);

    const service = SERVICES[serviceName];
    if (!service) {
        throw new Error(`Unsupported service: ${serviceName}`);
    }

    return await service.handler.handleOperation(operationName, args, soapHeader);
}





function buildSoapResponse(serviceName, operationName, result) {
    const config = SERVICES[serviceName];
    return config.handler.buildSoapResponse(operationName, result);
}

function buildFault(message) {
    const builder = new xml2js.Builder();
    const xmlObj = {
        'soap:Envelope': {
            $: {
                'xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/'
            },
            'soap:Body': {
                'soap:Fault': {
                    'faultcode': 'soap:Server',
                    'faultstring': message
                }
            }
        }
    };

    return builder.buildObject(xmlObj);
}

// Health check and info page
app.get('/', (req, res) => {
    const services = Object.keys(SERVICES).map(serviceName => {
        const config = SERVICES[serviceName];
        return `
        <div class="service">
            <h3>${serviceName.toUpperCase()}</h3>
            <strong>WSDL:</strong> <code><a href="/${serviceName}/${config.file}">http://localhost:8000/${serviceName}/${config.file}</a></code><br>
            <strong>SOAP Endpoint:</strong> <code>POST http://localhost:8000/soap/${serviceName}</code><br>
            <strong>Operations:</strong> ${config.operations.join(', ')}<br>
        </div>`;
    }).join('');

    res.send(`
        <html>
            <head>
                <title>Comprehensive SOAP Web Services</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .service { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
                    code { background: #eee; padding: 2px 5px; }
                    .endpoints { background: #e8f4f8; padding: 15px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <h1>Comprehensive SOAP Web Services</h1>
                <p>This server provides multiple SOAP web services with separate endpoints for each service.</p>

                <div class="endpoints">
                    <h2>Available Services:</h2>
                    ${services}
                </div>

                <div class="endpoints">
                    <h2>Endpoints:</h2>
                    <strong>WSDL Files:</strong><br>
                    <code>GET http://localhost:8000/{service}/{service}.wsdl</code>
                    <p>Serve WSDL definitions for each service</p>

                    <strong>XSD/Import Files:</strong><br>
                    <code>GET http://localhost:8000/{service}/{filename}</code>
                    <p>Serve imported XSD schema files and other dependencies</p>
                </div>

                <h2>All Operations:</h2>
                <ul>
                    <li><strong>rpBasicAuth:</strong> process</li>
                    <li><strong>Calculator:</strong> Add, Subtract, Multiply, Divide</li>
                    <li><strong>MeteringService:</strong> echo</li>
                    <li><strong>RefParamSoap11:</strong> echo, echoOneway</li>
                    <li><strong>RefParamSoap12:</strong> echo, echoOneway</li>
                    <li><strong>HeaderExtnAttribService:</strong> echoHeaderExtnAttributes</li>
                </ul>

                <h2>Test Client:</h2>
                <p><a href="/test-client.html">Test SOAP Client</a></p>
            </body>
        </html>
    `);
});

// Start server
const PORT = 8000;
app.listen(PORT, () => {
    console.log(`
🚀 Comprehensive SOAP Server successfully started!
📍 Server URL: http://localhost:${PORT}

📋 Available Services:
${Object.entries(SERVICES).map(([name, config]) =>
    `   🔧 ${name}: ${config.operations.join(', ')}`
).join('\n')}

📄 WSDL Endpoints:
${Object.keys(SERVICES).map(name =>
    `   📄 http://localhost:${PORT}/${name}/${name}.wsdl`
).join('\n')}

🔧 SOAP Endpoints:
${Object.keys(SERVICES).map(name =>
    `   🔧 POST http://localhost:${PORT}/soap/${name}`
).join('\n')}

📁 Import Files:  http://localhost:${PORT}/{service}/{filename}
🏠 Home Page:     http://localhost:${PORT}/
🧪 Test Client:   http://localhost:${PORT}/test-client.html

💡 Features:
   • Multiple WSDL services supported
   • Separate endpoints for each service
   • Service-specific file serving modules
   • All imports and XSD files served
   • Raw XML processing (no SOAP libraries)
   • Service-specific operation handling

Ready to accept SOAP requests!
    `);
});
