const express = require('express');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const app = express();

// Middleware to parse XML
app.use(express.text({ type: 'text/xml' }));

// Serve static files from wsdl directory (for XSD imports)
app.use('/wsdl/files', express.static(path.join(__dirname, 'wsdl')));

// Store your original WSDL content
const originalWsdlPath = path.join(__dirname, 'wsdl/rpBasicAuth.wsdl');
let originalWsdlContent = '';

try {
    originalWsdlContent = fs.readFileSync(originalWsdlPath, 'utf8');
    console.log('✅ Original WSDL loaded');
} catch (error) {
    console.log('⚠️  Could not load original WSDL, using minimal version');
}

// Serve the main WSDL file
app.get('/wsdl', (req, res) => {
    console.log('📄 Serving WSDL to client');
    
    // You can either serve the original WSDL or a modified version
    let wsdlToServe = originalWsdlContent;
    
    // Fix import URLs to point to our server
    wsdlToServe = fixImportUrls(wsdlToServe);
    
    res.type('application/xml');
    res.send(wsdlToServe);
});

// Serve individual XSD files (for imports)
app.get('/wsdl/:xsdFile', (req, res) => {
    const xsdFile = req.params.xsdFile;
    const xsdPath = path.join(__dirname, 'wsdl', xsdFile);
    
    console.log(`📄 Serving XSD: ${xsdFile}`);
    
    try {
        if (fs.existsSync(xsdPath)) {
            const xsdContent = fs.readFileSync(xsdPath, 'utf8');
            res.type('application/xml');
            res.send(xsdContent);
        } 
    } catch (error) {
        console.error(`Error serving XSD ${xsdFile}:`, error);
        res.status(404).send('XSD not found');
    }
});

// Handle SOAP requests
app.post('/wsdl', async (req, res) => {
    try {
        console.log('📨 Received SOAP request');
        
        const parser = new xml2js.Parser({
            explicitArray: false,
            mergeAttrs: true
        });
        
        const result = await parser.parseStringPromise(req.body);
        console.log('🔍 Parsed SOAP envelope');
        
        // Extract the SOAP Body and find the operation
        const soapBody = result['soap:Envelope']?.['soap:Body'] || result.Envelope?.Body;
        if (!soapBody) {
            throw new Error('No SOAP Body found');
        }
        
        // Find the operation name (first key that's not metadata)
        const operationName = Object.keys(soapBody).find(key => 
            !key.startsWith('$') && key !== 'soap:Fault'
        );
        
        if (!operationName) {
            throw new Error('No operation found in SOAP request');
        }
        
        console.log(`⚡ Operation detected: ${operationName}`);
        
        // Handle the operation
        const operationArgs = soapBody[operationName];
        const response = await handleOperation(operationName, operationArgs);
        
        const soapResponse = buildSoapResponse(operationName, response);
        
        res.type('text/xml');
        res.send(soapResponse);
        
        console.log(`✅ Successfully processed ${operationName}`);
        
    } catch (error) {
        console.error('❌ Error processing SOAP request:', error);
        const faultResponse = buildFault(error.message);
        res.type('text/xml');
        res.status(500).send(faultResponse);
    }
});

// Operation handlers
async function handleOperation(operationName, args) {
    console.log(`🛠️ Handling operation: ${operationName}`, args);
    
    switch (operationName) {
        case 'process':
            return await handleProcess(args);
        
        case 'getUser':
            return await handleGetUser(args);
            
        case 'createUser':
            return await handleCreateUser(args);
            
        default:
            throw new Error(`Unsupported operation: ${operationName}`);
    }
}

async function handleProcess(args) {
    // Your business logic for process operation
    return {
        status: 'SUCCESS',
        message: 'Process completed successfully',
        data: {
            input: args.input || 'No input provided',
            timestamp: new Date().toISOString(),
            processedBy: 'Node.js SOAP Server'
        }
    };
}

async function handleGetUser(args) {
    // Your business logic for getUser operation
    const userId = args.userId || 'unknown';
    return {
        user: {
            id: userId,
            name: 'John Doe',
            email: 'john.doe@example.com',
            status: 'active'
        }
    };
}

async function handleCreateUser(args) {
    // Your business logic for createUser operation
    const userData = args.user || {};
    return {
        success: true,
        userId: 'USER_' + Date.now(),
        message: `User ${userData.name || 'Unknown'} created successfully`
    };
}

// Utility functions
function fixImportUrls(wsdlContent) {
    // Fix schemaLocation URLs to point to our server
    return wsdlContent.replace(
        /schemaLocation="([^"]*)"/g, 
        'schemaLocation="http://localhost:8000/wsdl/$1"'
    );
}

function buildSoapResponse(operationName, result) {
    const builder = new xml2js.Builder();
    
    let responseBody;
    if (operationName === 'process') {
        responseBody = {
            'tns:processResponse': {
                'tns:status': result.status,
                'tns:message': result.message,
                'tns:data': JSON.stringify(result.data)
            }
        };
    } else if (operationName === 'getUser') {
        responseBody = {
            'tns:getUserResponse': {
                'tns:user': {
                    'tns:id': result.user.id,
                    'tns:name': result.user.name,
                    'tns:email': result.user.email,
                    'tns:status': result.user.status
                }
            }
        };
    } else {
        responseBody = {
            [`tns:${operationName}Response`]: {
                'tns:result': JSON.stringify(result)
            }
        };
    }
    
    const xmlObj = {
        'soap:Envelope': {
            $: {
                'xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
                'xmlns:tns': 'http://xmlns.oracle.com/rp_WS_Basic_Authentication_APP/rp_WS_Basic_Authentication/rp_Basic_Authentication_WS'
            },
            'soap:Body': responseBody
        }
    };
    
    return builder.buildObject(xmlObj);
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
    res.send(`
        <html>
            <head>
                <title>SOAP Web Service</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; }
                    code { background: #eee; padding: 2px 5px; }
                </style>
            </head>
            <body>
                <h1>SOAP Web Service</h1>
                <p>This service provides SOAP web service endpoints.</p>
                
                <h2>Endpoints:</h2>
                
                <div class="endpoint">
                    <strong>WSDL Document:</strong><br>
                    <code>GET <a href="/wsdl">http://localhost:8000/wsdl</a></code>
                    <p>Complete WSDL contract for SOAP clients</p>
                </div>
                
                <div class="endpoint">
                    <strong>SOAP Service:</strong><br>
                    <code>POST http://localhost:8000/wsdl</code>
                    <p>SOAP endpoint for all operations</p>
                </div>
                
                <div class="endpoint">
                    <strong>XSD Imports:</strong><br>
                    <code>GET http://localhost:8000/wsdl/{filename}.xsd</code>
                    <p>Serve imported XSD schema files</p>
                </div>
                
                <h2>Available Operations:</h2>
                <ul>
                    <li><code>process</code> - Main processing operation</li>
                    <li><code>getUser</code> - Get user information</li>
                    <li><code>createUser</code> - Create new user</li>
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
🚀 SOAP Server successfully started!
📍 Server URL: http://localhost:${PORT}

📋 Available Endpoints:
   📄 WSDL Contract: http://localhost:${PORT}/wsdl
   🔧 SOAP Service:  POST http://localhost:${PORT}/wsdl
   📁 XSD Files:     http://localhost:${PORT}/wsdl/{filename}.xsd
   🏠 Home Page:     http://localhost:${PORT}/
   🧪 Test Client:   http://localhost:${PORT}/test-client.html

💡 Clients can now:
   • Download the complete WSDL from the URL
   • Resolve all imports and XSD schemas
   • Make SOAP requests to the service endpoint
   • Get proper SOAP responses

Ready to accept SOAP requests!
    `);
});