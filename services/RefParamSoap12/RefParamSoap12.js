const xml2js = require('xml2js');

const WSDL_CONFIG = {
    file: 'RefParamSoap12.wsdl',
    namespace: 'http://wsa/refparam',
    operations: ['echo', 'echoOneway']
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

// RefParamSoap12 operation handlers
function handleOperation(operationName, args, soapHeader) {
    console.log(`🛠️ Handling RefParamSoap12 operation: ${operationName}`, args);

    switch (operationName) {
        case 'echo':
            return handleEcho(args);
        case 'echoOneway':
            return handleEchoOneway(args);
        default:
            throw new Error(`Unsupported RefParamSoap12 operation: ${operationName}`);
    }
}

function handleEcho(args) {
    const message = getValue(args, 'message') || '';
    return {
        return: message
    };
}

function handleEchoOneway(args) {
    const msg = getValue(args, 'msg') || '';
    console.log(`📨 One-way message received: ${msg}`);
    // One-way operation - return special marker
    return { __oneWay: true };
}

function buildSoapResponse(operationName, result) {
    const builder = new xml2js.Builder();

    const responseName = `${operationName}Response`;
    const resultKey = `return`;

    const xmlObj = {
        'soap:Envelope': {
            $: {
                'xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
                'xmlns:tns': WSDL_CONFIG.namespace
            },
            'soap:Body': {
                [`tns:${responseName}`]: {
                    [`tns:${resultKey}`]: result[resultKey]
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
