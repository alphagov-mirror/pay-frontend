var luhn = require('luhn');
var ukPostcode = require("uk-postcode");
var creditCardType = require('credit-card-type');
var cards = require('../models/card').allowed;

module.exports.creditCardType = creditCardType;
module.exports.allowedCards = cards;
module.exports.requiredFormFields = [
"cardholderName",
"cardNo",
"cvc",
"expiryMonth",
"expiryYear",
"addressLine1",
"addressCity",
"addressPostcode"
];


/*
 These are customs validaitons for each field,
 fucntion should be named the same as the input name,
 and will receive two arguments, one is the field,
 second is allfields in case ti is needed for vlaidation.
*/

module.exports.fieldValidations = {
  cardNo:  function(cardNo) {
    'use strict';

    if (!cardNo) return "message"; // default message
    cardNo        = cardNo.replace(/\D/g,'');
    var cardType  = creditCardType(cardNo);
    var valid     = luhn.validate(cardNo);

    if (!cardNo ||  cardNo.length < 12 || cardNo.length > 16) return 'number_incorrect_length';
    if (!valid) return "luhn_invalid";
    if(!cardType[0] || cards.indexOf(cardType[0].type) === -1) return "card_not_supported";

    return true;
  },


  expiryMonth:  function(expiryMonth, allFields) {
    'use strict';

    var expiryYear = allFields.expiryYear;
    if (expiryMonth === undefined || expiryMonth === "") return "message";
    if (expiryYear  === undefined || expiryYear === "") return "message";

    // month is zero indexed
    expiryMonth = expiryMonth -1;
    var isValidMonth = /^\d+$/.test(expiryMonth) && expiryMonth >= 0 && expiryMonth <= 11;
    if (!isValidMonth) return "invalid_month";

    var cardDate = new Date("20" + allFields.expiryYear,expiryMonth);
    var currentDate = new Date();
    if (currentDate.getFullYear() > cardDate.getFullYear()) return "in_the_past";
    if (currentDate.getFullYear() === cardDate.getFullYear() &&
        currentDate.getMonth() > cardDate.getMonth()) return "in_the_past";

    return true;
  },

  cvc: function(code) {
    'use strict';

    if(code === undefined) return "invalid_length";
    code = code.replace(/\D/g,'');
    if (code.length === 3 || code.length === 4) {
        return true;
    }
    return "invalid_length";
  },

  addressPostcode: function(AddressPostcode){
    'use strict';

    var postCode = ukPostcode.fromString(AddressPostcode);
    if (postCode.isComplete()) { return true; }
    return "message";
  },
  creditCardType: creditCardType
};
