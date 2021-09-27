const fetch = require('node-fetch');
const logData = require('../log_data');

/**
 * @desc - Generate a body used to make an ocapi request with a given query.
 * @param {Object} query
 * @param previousDate
 * @param currentDate
 * @return {Object}
 */
async function generateBody(query, previousDate, currentDate) {
    var body = {
        "query": {
            "filtered_query": {
                "query": query,
                "filter": {
                    "range_filter": {
                        "field": "last_modified",
                        "from": previousDate,
                        "to": currentDate,
                        "from_inclusive": false
                    }
                }
            }
        },
        "select":"(total)"
    };

    return body;
}

/**
 * @param {String[]} status -- Array of string used for the body request.
 * @param {Boolean} isSubOrder -- If the parameter isOdOrder is set to false, then it is a sub order.
 * @param {String[]} paymentStatus
 * @return {Object}
 */
async function generateBodyQuery(status, isSubOrder, paymentStatus) {
    var odOrderOperator = isSubOrder ? "is" : "not_in";
    var bodyQuery = {
        "bool_query": {
           "must": [
               { term_query: { fields: ["status"], operator: "one_of", values: status}},
               { term_query: { fields: ["c_isOdOrder"], operator: odOrderOperator, values: [false]}},
               { term_query: { fields: ["payment_status"], operator: "one_of", values: paymentStatus}}
           ]
       }
    };

    return bodyQuery;
}

/**
 * @param {Object} envLog 
 * @param {Object} metaData 
 * @param {string} url 
 * @param {Object} options 
 * @param {Object} body 
 * @param {String} siteID 
 * @param {String} orderType 
 * @param {String} orderStatus 
 * @returns 
 */
async function SendLastOrdersBySite(envLog, metaData, url, options, body, siteID, orderType, orderStatus) {
    options.body = JSON.stringify(body);
    var res = await fetch(url, options);

    if (res.ok) {
        const json = await res.json();

        if (json.total != 0) {
            var ordersData = {
                type: orderType,
                status: orderStatus,
                site: siteID,
                value: json.total
            };
            
            await logData(envLog, metaData, ordersData);
        }

    } else {
        console.log(url + " post request failed with response status:" + res.statusText);
    }

    return ;
}

/**
 * @param {Object} envLog
 * @param {Object} metaData
 * @param {String} hostname
 * @param {String} ocapiVersion
 * @param {String[]} siteIDs
 * @param {String} authorizationToken
 * @param {Date} previousDate
 * @param {Date} currentDate
 * @return {{Object} | null}
 */
async function sendLastOrders(envLog, metaData, hostname, ocapiVersion, siteIDs, authorizationToken, previousDate, currentDate) {
    var options = {
        method: 'POST',
        body: null,
        headers: {
            "Authorization": "Bearer " + authorizationToken,
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    };
    
    var successStatus = ["new", "open", "completed"];
    var newStatus = ["new"];
    var createdStatus = ["created"];
    var failedStatus = ["failed", "cancelled"];

    var paidPaymentStatus = ["paid"];
    var notpaidPaymentstatus = ["not_paid"];
    var allPaymentStatus = ["paid", "not_paid"];

    /*
    **  Create store queries.
    */
    const bodyQuerySuccess = await generateBodyQuery(successStatus, false, allPaymentStatus);
    const bodyQueryCreated = await generateBodyQuery(createdStatus, false, allPaymentStatus);
    const bodyQueryFailed = await generateBodyQuery(failedStatus, false, allPaymentStatus);

    const bodySuccess = await generateBody(bodyQuerySuccess, previousDate, currentDate);
    const bodyCreated = await generateBody(bodyQueryCreated, previousDate, currentDate);
    const bodyFailed = await generateBody(bodyQueryFailed, previousDate, currentDate);

    /*
    **  Create subscription queries.
    */
    const subPaidBodyQuerySuccess = await generateBodyQuery(newStatus, true, paidPaymentStatus);
    const subNotPaidBodyQuerySuccess = await generateBodyQuery(newStatus, true, notpaidPaymentstatus);

    const subPaidBody = await generateBody(subPaidBodyQuerySuccess, previousDate, currentDate);
    const subNotPaidBody = await generateBody(subNotPaidBodyQuerySuccess, previousDate, currentDate);
    

    var promises = [];

    for (let siteID of siteIDs) {
        if (siteID.indexOf("south_park") == -1) {
            var url = "https://" + hostname + "/s/" + siteID + "/dw/shop/" + ocapiVersion + "/order_search";

            promises.push(SendLastOrdersBySite(envLog, metaData, url, options, bodySuccess, siteID, "store", "success"));
            promises.push(SendLastOrdersBySite(envLog, metaData, url, options, bodyCreated, siteID, "store", "created"));
            promises.push(SendLastOrdersBySite(envLog, metaData, url, options, bodyFailed, siteID, "store", "failed"));
            promises.push(SendLastOrdersBySite(envLog, metaData, url, options, subPaidBody, siteID, "sub", "paid"));
            promises.push(SendLastOrdersBySite(envLog, metaData, url, options, subNotPaidBody, siteID, "sub", "not_paid"));
        }
    }

    await Promise.all(promises);
    return ;
}

module.exports = sendLastOrders;