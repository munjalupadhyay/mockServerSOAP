const express = require('express');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware to parse XML bodies
app.use(express.text({ type: 'text/xml' }));

// Serve WSDL
app.get('/wsdl', (req, res) => {
    const minimalWsdl = createMinimalWsdl();
    res.type('application/xml');
    res.send(minimalWsdl);
});

// Handle SOAP requests
app.post('/wsdl', async (req, res) => {
    try {
        console.log('Received SOAP request:', req.body);
        
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(req.body);
        
        const body = result['soap:Envelope']['soap:Body'][0];
        const operation = Object.keys(body)[0];
        
        console.log('Detected operation:', operation);
        
        let response;
        if (operation === 'process') {
            response = await handleProcess(body[operation][0]);
        } else {
            throw new Error(`Unknown operation: ${operation}`);
        }
        
        const soapResponse = buildSoapResponse(operation, response);
        res.type('text/xml');
        res.send(soapResponse);
        
    } catch (error) {
        console.error('Error processing SOAP request:', error);
        const faultResponse = buildFault(error.message);
        res.type('text/xml');
        res.status(500).send(faultResponse);
    }
});

async function handleProcess(args) {
    console.log('Processing with args:', args);
    return {
        result: `Processed successfully: ${JSON.stringify(args)}`
    };
}

function buildSoapResponse(operationName, result) {
    const builder = new xml2js.Builder();
    const xmlObj = {
        'soap:Envelope': {
            $: {
                'xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
                'xmlns:tns': 'http://xmlns.oracle.com/rp_WS_Basic_Authentication_APP/rp_WS_Basic_Authentication/rp_Basic_Authentication_WS'
            },
            'soap:Body': {
                [`tns:${operationName}Response`]: {
                    'tns:result': result.result
                }
            }
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

app.listen(8000, () => {
    console.log('✅ Express SOAP Server running on port 8000');
    console.log('WSDL: http://localhost:8000/wsdl');
});