sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"bankadmin/test/integration/pages/CustomersList",
	"bankadmin/test/integration/pages/CustomersObjectPage",
	"bankadmin/test/integration/pages/AccountsObjectPage"
], function (JourneyRunner, CustomersList, CustomersObjectPage, AccountsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('bankadmin') + '/test/flp.html#app-preview',
        pages: {
			onTheCustomersList: CustomersList,
			onTheCustomersObjectPage: CustomersObjectPage,
			onTheAccountsObjectPage: AccountsObjectPage
        },
        async: true
    });

    return runner;
});

