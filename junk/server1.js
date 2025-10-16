const express = require('express');
const soap = require('soap');
const fs = require('fs');

const app = express();
const port = 8001;

const myService = {
  MyService: {
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
}
};

const xml1 = fs.readFileSync('rpBasicAuth.wsdl', 'utf8');

const server = app.listen(port, function() {
  console.log(`Server listening on http://localhost:${port}`);

  // Register the first SOAP service
  const wsdlPath1 = '/MyService';
  soap.listen(server, wsdlPath1, myService, xml1, function() {
    console.log(`SOAP endpoint for MyService is listening at http://localhost:${port}${wsdlPath1}?wsdl`);
  });
});
