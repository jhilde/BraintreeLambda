console.log('Loading function');

var braintree = require("braintree");
var sendgrid = require("sendgrid")("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");
var accounting = require("accounting");   

var config = require('./env.json');

var gateway = braintree.connect({
        environment:        braintree.Environment.Sandbox,
        merchantId:         config.merchantId,
        publicKey:          config.publicKey,
        privateKey:         config.privateKey,
        merchantAccountId:  config.merchantAccountId 
    });

var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
});

var docClient = new AWS.DynamoDB.DocumentClient();


function Sale(n) {
    this.amount = n.amount;
    this.orderId = n.orderId;
    this.merchantAccountId = n.merchantAccountId;
    this.paymentMethodNonce = n.paymentMethodNonce;

    if(n.customer) {
        this.customer = {};
        this.customer.firstName = n.customer.firstName;
        console.log("There's a cust first name: " + this.customer.firstName);
        this.customer.lastName = n.customer.lastName;
        this.customer.company = n.customer.company;
        this.customer.phone = n.customer.phone;
        this.customer.fax = n.customer.fax;
        this.customer.website = n.customer.website;
        this.customer.email = n.customer.email;
    }

    if(n.billing) {
        this.billing = {};
        this.billing.firstName = n.billing.firstName;
        this.billing.lastName = n.billing.lastName;
        this.billing.company = n.billing.company;
        this.billing.streetAddress = n.billing.streetAddress;
        this.billing.extendedAddress = n.billing.extendedAddress;
        this.billing.locality = n.billing.locality;
        this.billing.region = n.billing.region;
        this.billing.postalCode = n.billing.postalCode;
        this.billing.countryCodeAlpha2 = n.countryCodeAlpha2;
    }

    if(n.shipping) {
        this.shipping = {};
        this.shipping.firstName = n.shipping.firstName;
        this.shipping.lastName = n.shipping.lastName;
        this.shipping.company = n.shipping.company;
        this.shipping.streetAddress = n.shipping.streetAddress;
        this.shipping.extendedAddress = n.shipping.extendedAddress;
        this.shipping.locality = n.shipping.locality;
        this.shipping.region = n.shipping.region;
        this.shipping.postalCode = n.shipping.postalCode;
        this.shipping.countryCodeAlpha2 = n.shipping.countryCodeAlpha2;
    }

    this.options = { "submitForSettlement" : "true" };
   
}


exports.handler = function(event, context) {
    console.log(gateway);
    console.log(event);

    var braintreeSale = new Sale(event.braintreeSale);

    var donationAmount = event.amount;
    var donorFirst = event.donor_first;
    var donorLast = event.donor_last;
    var nonce = event.nonce;

    console.log(braintreeSale.amount);


    gateway.transaction.sale(braintreeSale, function (err, result) {
        console.log("I'm in the sale!");
        if (result.success) {
            // Add to database
            var table = "Donations";
            braintreeSale.transactionId = result.transaction.id;

            var params = {
                TableName: table,
                Item: braintreeSale
            }

            console.log("Adding a new item..." + JSON.stringify(params));
            docClient.put(params, function(err, data) {
                if (err) {
                  console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                  console.log("Added item:", JSON.stringify(data, null, 2));
                }
            });


            var email = new sendgrid.Email();

            email.addTo("jhilde@gmail.com");
            email.setFrom("justin@freedomconnexion.org");
            email.setSubject("Thanks for donating " + donorFirst);
            email.setHtml("You are way too <b>awesome!</b>");
            email.addFilter('templates', 'template_id', '13892749-bb1f-4dc7-9df3-da561a5eb8bf');
            email.addSubstitution('DONOR_FIRST', donorFirst);
            email.addSubstitution('TRANSACTION_ID', result.transaction.id);
            email.addSubstitution('AMOUNT', accounting.formatMoney(donationAmount));

            



            sendgrid.send(email, function(err, json){
                if(err) { 
                    console.log("Error!");
                    console.log(err); 
                }
                else {
                    console.log("Success");
                    console.log(json);
                    context.succeed(result.transaction.id);
                }
            });
        }
        else {
            context.fail(result.err);
        }
    });

    //gateway.clientToken.generate({}, function (err, response) {
        
    //    console.log(response);
      //  context.succeed(response.clientToken);
    //});

    //console.log('Looks like the transaction should have gone through');
    //context.succeed(clientToken);
}