const http = require('http');

// Test HeaderExtnAttribService
async function testHeaderExtnAttribService() {
    const soapRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://mock.service.com/">
    <soapenv:Header>
        <tns:echoHeader>
            <tns:record>
                <tns:value>Test Header Value</tns:value>
            </tns:record>
        </tns:echoHeader>
    </soapenv:Header>
    <soapenv:Body>
        <tns:echoHeaderExtnAttributes>
            <tns:payload>
                <tns:record>
                    <tns:value>Test Payload Value</tns:value>
                </tns:record>
            </tns:payload>
        </tns:echoHeaderExtnAttributes>
    </soapenv:Body>
</soapenv:Envelope>`;

    const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/soap/HeaderExtnAttribService',
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'Content-Length': Buffer.byteLength(soapRequest)
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    response: data
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.write(soapRequest);
        req.end();
    });
}

// Run test and save results
async function runTest() {
    try {
        console.log('Testing HeaderExtnAttribService...');
        const result = await testHeaderExtnAttribService();
        const output = {
            operation: 'echoHeaderExtnAttributes',
            request: 'SOAP request with test header and payload',
            statusCode: result.statusCode,
            response: result.response
        };

        const fs = require('fs');
        fs.writeFileSync('HeaderExtnAttribService_test_results.json', JSON.stringify([output], null, 2));
        console.log('Test results written to HeaderExtnAttribService_test_results.json');

        // Read and display the results
        const results = JSON.parse(fs.readFileSync('HeaderExtnAttribService_test_results.json', 'utf8'));
        console.log('Test Results:');
        console.log(JSON.stringify(results, null, 2));

    } catch (error) {
        console.error('Test failed:', error.message);
        const fs = require('fs');
        const errorOutput = {
            operation: 'echoHeaderExtnAttributes',
            error: error.message
        };
        fs.writeFileSync('HeaderExtnAttribService_test_results.json', JSON.stringify([errorOutput], null, 2));
    }
}

runTest();
