/* eslint-disable new-cap */
const functions = require("firebase-functions");
const express = require("express");
const nlb = require("./nlb");

const app = express();

const cors = require("cors")({origin: true});
app.use(cors);

exports.helloWorld = functions.https.onCall((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  return "Hello";
});

exports.availability = functions.https.onCall((request, response) => {
  functions.logger.info("availability", {structuredData: true});
  console.log("request bid", request.bid);
  return nlb.getAvailabilityInfo(
      {BID: request.bid ? request.bid : "9789814266727"})
      .then((results) => {
        console.log("availability results", results);
        return {results};
      }).catch((err)=>{
        console.log("err", err);
        return {err};
      }
      );
});

// request should be {BID: ..., ISBN:..} either bid or isbn
exports.getTitleDetails = functions.https.onCall((request, response) => {
  functions.logger.info("availability", {structuredData: true});
  console.log("[getTitleDetails] request", request);
  return nlb.getTitleDetails(
      request)
      .then((results) => {
        console.log("[getTitleDetails] results", results);
        return {results};
      }).catch((err)=>{
        console.log("err", err);
        return {err};
      }
      );
});

exports.search = functions.https.onCall((request, response) => {
  functions.logger.info("Hello nlb!", {structuredData: true});
  console.log("request", request);
  return nlb.search(
      // SearchType: Title Keywords Author Subject
      {field: request.searchType ? request.searchType : "Title",
        terms: request.searchValue ? request.searchValue : "Value"})
      .then((results) => {
        // console.log("results", results);
        return {results};
      }).catch((err)=>{
        console.log("erroooor", err);
        return {err};
      }
      );
});

exports.app = functions.https.onRequest(app);
