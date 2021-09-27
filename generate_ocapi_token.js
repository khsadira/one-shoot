const fetch = require("node-fetch")

/**
 * @param {String} clientID - Client id used to generate ocapi bearer token.
 * @param {String} clientPW - Client password used to generate ocapi bearer token.
 * @return {String} - OCAPI bearer token.
 */
async function generateOcapiToken(clientID, clientPW) {
    const authorizationToken = new Buffer.from(clientID + ":" + clientPW).toString('base64');

    const url = 'https://account.demandware.com/dwsso/oauth2/access_token?grant_type=client_credentials';
    const options = {
        method: 'post',
        headers: {
            "Authorization": "Basic " + authorizationToken,
            "Content-type": "application/x-www-form-urlencoded"
        }
    };

    console.log("generateOcapiToken: https post request parameters:\nHOSTNAME: account.demandware.com\nPATH: /dwsso/oauth2/access_token?grant_type=client_credentials" + "\nCLIENT_ID: " + clientID + '\n');

    const res = await fetch(url, options);

    if (!res.ok) {
        throw new Error("generateOcapiToken: https post request failed with response status: " + res.statusText);
    }

    const json = await res.json();
    return json.access_token;
}

module.exports = generateOcapiToken;