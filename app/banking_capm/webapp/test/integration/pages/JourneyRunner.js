sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"bankingcapm/test/integration/pages/CustomersList",
	"bankingcapm/test/integration/pages/CustomersObjectPage",
	"bankingcapm/test/integration/pages/AccountsObjectPage"
], function (JourneyRunner, CustomersList, CustomersObjectPage, AccountsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('bankingcapm') + '/test/flp.html#app-preview',
        pages: {
			onTheCustomersList: CustomersList,
			onTheCustomersObjectPage: CustomersObjectPage,
			onTheAccountsObjectPage: AccountsObjectPage
        },
        async: true
    });

    return runner;
});

