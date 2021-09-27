const fetch = require("node-fetch")

async function getOrderData(orderID, siteID, token) {
	try {
		const url = "https://" + process.env.SFCC_HOSTNAME + "/s/" + siteID + "/dw/shop/" + process.env.OCAPI_VERSION + "/order_search";
		console.log(url)
		const options = {
			method: 'post',
			headers: {
				"Authorization": "Bearer " + token,
				"Content-type": "application/json"
			},
			body: JSON.stringify({
				"query" : {
					"text_query": {
						"fields": [
							"order_no"
						],
						"search_phrase": "\"" + orderID + "\""
					}
				},
				"select" : "(**)"
			})
		};

		const res = await fetch(url, options);

		if (!res.ok) {
			throw new Error("getOrderData: https post request failed with response status: " + res.statusText);
		}

		const json = await res.json();

		if (json.count) {
			return json.hits[0].data.customer_info.customer_no
		}
	} catch (e) {
		console.error("ERROR:", e);
	}
	return null
}


module.exports = getOrderData;