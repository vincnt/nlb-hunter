/* eslint-disable new-cap */
/* eslint-disable valid-jsdoc */
/* eslint-disable no-throw-literal */
/* eslint-disable max-len */
/* eslint-disable no-tabs */


// Code from https://github.com/hueyy/nlb

const functions = require("firebase-functions");

const soap = require("strong-soap").soap;
const url = "https://openweb.nlb.gov.sg/OWS/CatalogueService.svc?wsdl";
const apiKey = functions.config().nlb.key;

console.log("API KEY", apiKey);

/**
 * @description Main
 */
function nlb() {}

// /**
//  * @description sets the NLB API key. run before any operations
//  * @param {string} _apiKey - NLB API key
//  */
// nlb.prototype.setApiKey = function(_apiKey) {
//   apiKey = _apiKey;
// };

/**
 * @description search NLB's database. wrapper for CatalogueService.Search
 * @param {Object} params
 * @param {String} params.field - Keywords, Author, Title or Subject
 * @param {string} params.terms
 * @return {Promise} containing array of matching books
 */
nlb.prototype.search = function(params) {
  return new Promise((resolve, reject) => {
    const searchArgs = {
		  SearchRequest: {
		  	APIKey: "REVWLVZhbmVzc2FUYW46bmxiIUAjVmFuZXNzYQ==",
		  	SearchItems: {
		  		SearchItem: {
		  			SearchField: params.field,
		  			SearchTerms: params.terms,
          },
        },
		  	Modifiers: {
          SortSchema: "",
          StartRecordPosition: 0,
          MaximumRecords: 100,
        },
		  },
    };
    console.log("search args", JSON.stringify(searchArgs));
    soap.createClient(url, {}, (err, client) => {
      client["CatalogueService"]["BasicHttpBinding_ICatalogueService"]["Search"](searchArgs, (err, res, envelope) => {
        console.log("Envelope", envelope);
        console.log("last request: ", client.lastRequest);
        console.log("res", res);
        if (err) {
          console.log("eer1", err);
          reject(err)
          ;
        }
        if (res.Status === "OK") {
          if (res.Titles) {
            resolve(res.Titles.Title);
          } else {
            resolve([]);
          }
        } else {
          console.log("eer2", err);
          reject(res.ErrorMessage);
        }
      });
    });
  });
};

/**
 * @description get more information about a book. wrapper for CatalogueService.GetTitleDetails
 * @param {Object} params - either .BID or .ISBN must be set
 * @param {String} BID
 * @param {String} ISBN
 * @return {Promise} containing object with matching book
 */
nlb.prototype.getTitleDetails = function(params) {
  /*
    params.BID OR params.ISBN
    */
  if (typeof params.BID === "undefined") {
    params.BID = ""
    ;
  }
  if (typeof params.ISBN === "undefined") {
    params.ISBN = ""
    ;
  }
  if (typeof params.BID === "undefined" && typeof params.ISBN === "undefined") {
    throw "Error: Must define either BID or ISBN for GetTitleDetails";
  }
  return new Promise((resolve, reject) => {
    const searchArgs = {
		  GetTitleDetailsRequest: {
		  	APIKey: apiKey,
		  	BID: params.BID,
		  	ISBN: params.ISBN,
		  },
    };
    soap.createClient(url, {}, (err, client) => {
      client["CatalogueService"]["BasicHttpBinding_ICatalogueService"]["GetTitleDetails"](searchArgs, (err, res, envelope) => {
        console.log("Envelope", envelope);
        console.log("last request: ", client.lastRequest);
        console.log("res", res);
        if (err) {
          reject(err)
          ;
        }
        if (res.Status === "OK") {
          resolve(res.TitleDetail);
        } else {
          reject(res.ErrorMessage);
        }
      });
    });
  });
};

/**
 * @description check if/where a book is available. wrapper for CatalogueService.GetAvailabilityInfo
 * @param {Object} params - either .BID or .ISBN must be set
 * @param {String} BID
 * @param {String} ISBN
 */
nlb.prototype.getAvailabilityInfo = function(params) {
  if (typeof params.BID === "undefined") {
    params.BID = ""
    ;
  }
  if (typeof params.ISBN === "undefined") {
    params.ISBN = ""
    ;
  }
  if (typeof params.BID === "undefined" && typeof params.ISBN === "undefined") {
    throw "Error: Must define either BID or ISBN for GetAvailabilityInfo";
  }
  return new Promise((resolve, reject) => {
    const searchArgs = {
		  GetAvailabilityInfoRequest: {
		  	APIKey: apiKey,
		  	BID: params.BID,
		  	ISBN: params.ISBN,
		  	Modifiers: {},
		  },
    };
    soap.createClient(url, {}, (err, client) => {
      client["CatalogueService"]["BasicHttpBinding_ICatalogueService"]["GetAvailabilityInfo"](searchArgs, (err, res) => {
        if (err) {
          reject(err)
          ;
        }
        if (res.Status === "OK" && "Items" in res && "Item" in res.Items && res.Items.Item) {
          resolve(res.Items.Item);
        } else if (res.Status === "OK" && !("ErrorMessage" in res)) {
          resolve([]);
        } else {
          reject(res.ErrorMessage);
        }
      });
    });
  });
};

// eslint-disable-next-line new-cap
module.exports = new nlb();
