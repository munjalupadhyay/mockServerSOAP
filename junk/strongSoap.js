const { soap } = require('strong-soap');
const http = require('http');
const fs = require('fs');
const path = require('path');

const wsdlPath = path.join(__dirname, 'rpBasicAuth.wsdl');
const wsdlContent = fs.readFileSync(wsdlPath, 'utf8');

// Service implementation
const service = {
    rp_Basic_Authentication_WSService: {
        rp_Basic_Authentication_WSPort: {
            process: function(args, callback) {
                console.log('Process operation called with:', args);
                
                // Your response should match the WSDL structure
                const response = {
                    processResponse: {
                        result: {
                            status: 'SUCCESS',
                            message: 'Processed by strong-soap',
                            data: JSON.stringify(args)
                        }
                    }
                };
                
                callback(null, response);
            }
        }
    }
};

const server = http.createServer((req, res) => {
    res.end('SOAP Server');
});

const options = {
    path: '/wsdl',
    services: service,
    xml: wsdlContent
};

soap.listen(server, options, () => {
    console.log('Strong-SOAP Server running at http://localhost:8000/wsdl');
});

server.listen(8000);