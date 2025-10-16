const soap = require('strong-soap').soap;
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load your WSDL
const wsdlPath = path.join(__dirname, 'rpBasicAuth.wsdl');
const wsdl = fs.readFileSync(wsdlPath, 'utf8');

const calcwsdlPath = path.join(__dirname, 'calculator.wsdl');
const calc = fs.readFileSync(calcwsdlPath, 'utf8');


const calculator = {
    Calculator: {                // <wsdl:service name="Calculator">
    CalculatorSoap: {          // <wsdl:port name="CalculatorSoap">
      Add(args) {
        const { intA, intB } = args;
        const result = parseInt(intA) + parseInt(intB);
        console.log(`Add called with ${intA} + ${intB} = ${result}`);
        return { AddResult: result };
      },
      Subtract(args) {
        const { intA, intB } = args;
        const result = parseInt(intA) - parseInt(intB);
        console.log(`Subtract called with ${intA} - ${intB} = ${result}`);
        return { SubtractResult: result };
      },
      Multiply(args) {
        const { intA, intB } = args;
        const result = parseInt(intA) * parseInt(intB);
        console.log(`Multiply called with ${intA} * ${intB} = ${result}`);
        return { MultiplyResult: result };
      },
      Divide(args) {
        const { intA, intB } = args;
        const result = parseInt(intA) / parseInt(intB);
        console.log(`Divide called with ${intA} / ${intB} = ${result}`);
        return { DivideResult: result };
      },
      // Add(args) {
      //   return { AddResult: 999 }; // always return fixed mock
      // }
    }
  }
};

const myService = {
// <wsdl:service name="rp_basic_authentication_ws_client_ep">
  rp_basic_authentication_ws_client_ep: {
    // <wsdl:port name="rp_Basic_Authentication_WS_pt">
    rp_Basic_Authentication_WS_pt: {
      // <wsdl:operation name="process">
      // Request element: client:process containing "input" (xsd:string)
      // Response element: client:processResponse containing "result" (xsd:string)
      process(args) {
        // Print parsed request payload
        console.log('rpBasicAuth.process called with:', JSON.stringify(args, null, 2));

        // Input may arrive directly as { input: '...' } (document/literal wrapped),
        // or wrapped under the message part name { payload: { input: '...' } }.
        const inputVal = (args && (args.input || (args.payload && args.payload.input))) || '';

        // Create a simple mock response conforming to the schema
        // Schema expects: <processResponse><result>string</result></processResponse>
        const response = {
          result: inputVal || 'MOCK_SUCCESS'
        };

        console.log('rpBasicAuth.process responding with:', JSON.stringify(response, null, 2));
        return response;
      }
    }
  }
};


// Create HTTP server
const server = http.createServer((req, res) => {
    res.end("SOAP Server is running");
});

const options = {
    path: '/wsdl',
    services: myService,
    xml: wsdl
};

server.listen(8000);
soap.listen(server, options);

console.log('SOAP Server running at http://localhost:8000/wsdl');
console.log('WSDL: http://localhost:8000/wsdl?wsdl');