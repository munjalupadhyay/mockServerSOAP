const fs = require('fs');
const { exec } = require('child_process');

// Test script for RefParamSoap12 service
async function testRefParamSoap12() {
    const results = [];

    // Test echo operation
    const echoRequest = `<soapenv:Envelope xmlns:ref="http://wsa/refparam" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body><ref:echo><ref:message>Hello World from RefParamSoap12</ref:message></ref:echo></soapenv:Body></soapenv:Envelope>`;

    try {
        const echoResponse = await makeRequest(echoRequest);
        results.push({
            operation: 'echo',
            request: echoRequest,
            response: echoResponse
        });
    } catch (error) {
        results.push({
            operation: 'echo',
            request: echoRequest,
            error: error.message
        });
    }

    // Test echoOneway operation (one-way, no response expected)
    const echoOnewayRequest = `<soapenv:Envelope xmlns:ref="http://wsa/refparam" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body><ref:echoOneway><ref:msg>One-way message from RefParamSoap12</ref:msg></ref:echoOneway></soapenv:Body></soapenv:Envelope>`;

    try {
        const echoOnewayResponse = await makeRequest(echoOnewayRequest);
        results.push({
            operation: 'echoOneway',
            request: echoOnewayRequest,
            response: echoOnewayResponse
        });
    } catch (error) {
        results.push({
            operation: 'echoOneway',
            request: echoOnewayRequest,
            error: error.message
        });
    }

    // Write results to file
    fs.writeFileSync('RefParamSoap12_test_results.json', JSON.stringify(results, null, 2));
    console.log('Test results written to RefParamSoap12_test_results.json');

    // Read and display results
    const savedResults = fs.readFileSync('RefParamSoap12_test_results.json', 'utf8');
    console.log('Test Results:');
    console.log(savedResults);
}

function makeRequest(xmlData) {
    return new Promise((resolve, reject) => {
        const curlCommand = `curl -s -X POST http://localhost:8000/soap/RefParamSoap12 -H "Content-Type: text/xml; charset=utf-8" -d '${xmlData}'`;

        exec(curlCommand, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}

// Run the test
testRefParamSoap12().catch(console.error);
