const xml2js = require('xml2js');

const WSDL_CONFIG = {
    file: 'MeteringService.wsdl',
    namespace: 'http://metering.mock.com/',
    operations: ['echo']
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

// MeteringService operation handlers
function handleOperation(operationName, args) {
    console.log(`🛠️ Handling MeteringService operation: ${operationName}`, args);

    switch (operationName) {
        case 'echo':
            return handleEcho(args);
        default:
            throw new Error(`Unsupported MeteringService operation: ${operationName}`);
    }
}

function handleEcho(args) {
    const inputCounter = getValue(args, 'inputCounter') || '1';
    const inputString = getValue(args, 'inputString') || '';

    const counter = parseInt(inputCounter);
    const repeatCount = isNaN(counter) || counter < 1 ? 1 : counter;

    const outputStrings = [];
    for (let i = 0; i < repeatCount; i++) {
        // Create 2^i repetitions of the input string, joined with " - "
        const repetitions = Math.pow(2, i);
        const repeatedString = Array(repetitions).fill(inputString).join(' - ');
        outputStrings.push(repeatedString);
    }

    return {
        outputString: outputStrings
    };
}

function buildSoapResponse(operationName, result) {
    const builder = new xml2js.Builder();

    const responseName = `${operationName}Response`;

    const xmlObj = {
        'soap:Envelope': {
            $: {
                'xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
                'xmlns:tns': WSDL_CONFIG.namespace
            },
            'soap:Body': {
                [`tns:${responseName}`]: {
                    [`tns:outputString`]: result.outputString
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
