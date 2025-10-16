const xml2js = require('xml2js');

const WSDL_CONFIG = {
    file: 'calculator.wsdl',
    namespace: 'http://tempuri.org/',
    operations: ['Add', 'Subtract', 'Multiply', 'Divide']
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

// Calculator operation handlers
function handleOperation(operationName, args) {
    console.log(`🛠️ Handling calculator operation: ${operationName}`, args);

    switch (operationName) {
        case 'Add':
            return handleAdd(args);
        case 'Subtract':
            return handleSubtract(args);
        case 'Multiply':
            return handleMultiply(args);
        case 'Divide':
            return handleDivide(args);
        default:
            throw new Error(`Unsupported calculator operation: ${operationName}`);
    }
}

function handleAdd(args) {
    const intA = parseInt(getValue(args, 'intA')) || 0;
    const intB = parseInt(getValue(args, 'intB')) || 0;
    return {
        AddResult: intA + intB
    };
}

function handleSubtract(args) {
    const intA = parseInt(getValue(args, 'intA')) || 0;
    const intB = parseInt(getValue(args, 'intB')) || 0;
    return {
        SubtractResult: intA - intB
    };
}

function handleMultiply(args) {
    const intA = parseInt(getValue(args, 'intA')) || 0;
    const intB = parseInt(getValue(args, 'intB')) || 0;
    return {
        MultiplyResult: intA * intB
    };
}

function handleDivide(args) {
    const intA = parseInt(getValue(args, 'intA')) || 0;
    const intB = parseInt(getValue(args, 'intB')) || 0;

    if (intB === 0) {
        throw new Error('Division by zero');
    }

    return {
        DivideResult: Math.floor(intA / intB) // Integer division
    };
}

function buildSoapResponse(operationName, result) {
    const builder = new xml2js.Builder();

    const responseName = `${operationName}Response`;
    const resultKey = `${operationName}Result`;

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
