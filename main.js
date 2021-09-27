const XLSX = require("xlsx");
const generateOcapiToken = require("./generate_ocapi_token");
const getOrderData = require("./get_order_data");
const customerMgr = require("./customer_manager");

async function main() {
    try {
        const workbook = XLSX.readFile('data.xlsx');
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        var range = XLSX.utils.decode_range(sheet['!ref']);
        var token = await generateOcapiToken(process.env.OCAPI_CLIENT_ID, process.env.OCAPI_CLIENT_PW);

        for (let rowNum = 1; rowNum <= range.e.r; rowNum++) {
            const orderIDCell = sheet[XLSX.utils.encode_cell({r: rowNum, c: 0})];
            const siteIDCell = sheet[XLSX.utils.encode_cell({r: rowNum, c: 3})];

            if (orderIDCell && orderIDCell.t == 'n' && siteIDCell && siteIDCell.t == 's') {
                var orderID = orderIDCell.v
                var siteID = siteIDCell.v

                var customerNo = await getOrderData(orderID, siteID, token)
                if (customerNo != null) {
                    var customerListID = await customerMgr.getCustomerListID(siteID, token);

                    if (customerListID != null) {
                        var upcID = await customerMgr.getCustomerNo(customerNo, customerListID, token)

                        if (upcID != null) {
                            console.log(orderID, siteID, customerNo, upcID)
                            var customerCell = { t: 's', v: customerNo}
                            var upcIDCell = { t: 's', v: upcID}
                            // XLSX.utils.sheet_add_aoa(sheet, [[customerNo]], {origin: `O${rowNum+1}`});
                            // XLSX.utils.sheet_add_aoa(sheet, [[upc_id]], {origin: `P${rowNum+1}`});
                            sheet[`O${rowNum+1}`] = customerCell;
                            sheet[`P${rowNum+1}`] = upcIDCell;
                        }
                    }
                }
            }
        }

        XLSX.writeFile(workbook, 'data2.xls');
    } catch(e) {
		console.error("ERROR:", e);
    }
}

main()