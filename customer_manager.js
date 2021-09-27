const fetch = require("node-fetch")

async function getCustomerListID(siteID, token) {
	var body = {
		"query": {
			"text_query": {
				"fields":
					["id"],
				"search_phrase": siteID
			}
		},
		"select": "(**)",
		"count": 200
	};
	var url = "https://" + process.env.SFCC_HOSTNAME + "/s/-/dw/data/" + process.env.OCAPI_VERSION + "/site_search";
	var options = {
		method: 'POST',
		body: JSON.stringify(body),
		headers: {
			"Authorization": "Bearer " + token,
			"Content-Type": "application/json"
		}
	};
	const res = await fetch(url, options);

	if (!res.ok) {
		throw new Error("getCustomerListID: https post request failed with response status: " + res.statusText);
	}

	const json = await res.json();

	if (json.count) {
		return json.hits[0].customer_list_link.customer_list_id
	}
}

async function getCustomerNo(customerNo, customerListID, token) {
	var body =
	{
		"query" : {
		   "text_query": { "fields": ["customer_no"], "search_phrase": customerNo }
		},
		"select":"(**)"
   };
	var url = "https://" + process.env.SFCC_HOSTNAME + "/s/-/dw/data/" + process.env.OCAPI_VERSION + "/customer_lists/" + customerListID + "/customer_search";
	var options = {
		method: 'POST',
		body: JSON.stringify(body),
		headers: {
			"Authorization": "Bearer " + token,
			"Content-Type": "application/json"
		}
	};
	const res = await fetch(url, options);

	if (!res.ok) {
		throw new Error("getCustomerListID: https post request failed with response status: " + res.statusText);
	}

	const json = await res.json();

	if (json.count) {
		return json.hits[0].data.c_upc_user_ticket
	}
}

exports.getCustomerListID = getCustomerListID;
exports.getCustomerNo = getCustomerNo;