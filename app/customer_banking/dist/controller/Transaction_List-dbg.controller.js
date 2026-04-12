sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("customerbanking.controller.Transaction_List", {

        onInit: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteTransactionList")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            const accountId = oEvent.getParameter("arguments").accountId;

            // Bind transaction list filtered to this account
            this.byId("transactionList").bindItems({
                path: "/Transactions",
                filters: [new sap.ui.model.Filter(
                    "account_ID", sap.ui.model.FilterOperator.EQ, accountId
                )],
                template: new sap.m.StandardListItem({
                    title: "{type}",
                    description: "Amount: {amount} | {note}",
                    info: "{createdAt}"
                })
            });
        },

        onNavBack: function () {
            const oHistory = sap.ui.core.routing.History.getInstance();
            const sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                // The user has a previous step within the app
                window.history.go(-1);
            } else {
                // No history found (e.g., direct link), force go to the home list
                this.getOwnerComponent().getRouter().navTo("RouteAccountList", {}, true);
            }
        }
    });
});