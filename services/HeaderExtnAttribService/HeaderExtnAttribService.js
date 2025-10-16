const xml2js = require('xml2js');

const WSDL_CONFIG = {
    file: 'HeaderExtnAttribService.wsdl',
    namespace: 'http://mock.service.com/',
    operations: ['echoHeaderExtnAttributes']
};

// Helper function to extract values that handles namespace prefixes
function getValue(obj, key) {
    // Try plain key first
    if (obj[key] !== undefined) {
        return obj[key];
    }
    // Try namespace-prefixed key
    for (const objKey of Object.keys(obj)) {
        if (objKey.endsWith(`:${key}`)) {
            return obj[objKey];
        }
    }
    return undefined;
}

// HeaderExtnAttribService operation handlers
function handleOperation(operationName, args, soapHeader) {
    console.log(`🛠️ Handling HeaderExtnAttribService operation: ${operationName}`, args);

    switch (operationName) {
        case 'echoHeaderExtnAttributes':
            return handleEchoHeaderExtnAttributes(args, soapHeader);
        default:
            throw new Error(`Unsupported HeaderExtnAttribService operation: ${operationName}`);
    }
}

function handleEchoHeaderExtnAttributes(args, soapHeader) {
    // Extract echoRequest from args
    const echoRequest = getValue(args, 'echoRequest');
    const payload = echoRequest ? getValue(echoRequest, 'request') : null;

    // Extract echoHeader from soapHeader
    const echoHeader = soapHeader ? getValue(soapHeader, 'echoHeader') : null;
    const header = echoHeader ? getValue(echoHeader, 'header') : null;

    console.log('Payload:', payload);
    console.log('Header:', header);

    // For mock, return the input payload and header as response
    return {
        response: payload ? { value: getValue(getValue(payload, 'record'), 'value') } : { value: 'Mock Response' },
        header: header ? { value: getValue(getValue(header, 'record'), 'value') } : { value: 'Mock Header Response' }
    };
}

function buildSoapResponse(operationName, result) {
    const builder = new xml2js.Builder();

    const xmlObj = {
        'S:Envelope': {
            $: {
                'xmlns:env': 'http://schemas.xmlsoap.org/soap/envelope/',
                'xmlns:S': 'http://schemas.xmlsoap.org/soap/envelope/'
            },
            'S:Header': {
                'ns0:echoHeader': {
                    $: {
                        'xmlns:ns1': 'http://mock.service.com/types/base',
                        'xmlns:ns0': 'http://mock.service.com/types'
                    },
                    'ns1:header': {
                        'ns1:record': {
                            'ns1:value': result.header.value || 'Mock Header Response'
                        }
                    }
                }
            },
            'S:Body': {
                'ns0:echoResponse': {
                    $: {
                        'xmlns:ns1': 'http://mock.service.com/types/base',
                        'xmlns:ns0': 'http://mock.service.com/types'
                    },
                    'ns1:response': {
                        'ns1:record': {
                            'ns1:value': result.response.value || 'Mock Response'
                        }
                    }
                }
            }
        }
    };

    return builder.buildObject(xmlObj);
}

module.exports = {
    WSDL_CONFIG,
    handleOperation,
    buildSoapResponse
};
