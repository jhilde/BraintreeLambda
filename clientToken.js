console.log('Loading function');

var braintree = require("braintree");
var config = require('./env.json');

var gateway = braintree.connect({
        environment:  braintree.Environment.Sandbox,
        merchantId:   config.merchantId,
        publicKey:    config.publicKey,
        privateKey:   config.privateKey
    });

/**
 * Provide an event that contains the following keys:
 *
 *   - operation: one of the operations in the switch statement below
 *   - tableName: required for operations that interact with DynamoDB
 *   - payload: a parameter to pass to the operation being performed
 */
exports.handler = function(event, context) {
    var clientToken;

    console.log(gateway);
    console.log(event);


    gateway.clientToken.generate({}, function (err, response) {
        
        clientToken = response.clientToken;

        console.log(response);
        context.succeed(clientToken);
    });

    //console.log('Looks like the transaction should have gone through');
    //context.succeed(clientToken);
}