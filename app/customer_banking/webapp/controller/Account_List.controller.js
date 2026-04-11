sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("customer.banking.controller.AccountList", {

        onInit: async function () {
            const oList = this.byId("accountList");
            await oList.bindItems({
                path: "/Accounts",
                template: new sap.m.StandardListItem({
                    title: "{type}",
                    description: "Balance: {balance}",
                    type: "Navigation"
                })
            });
        },

        onAccountSelected: function (oEvent) {
            const oItem = oEvent.getParameter("listItem");
            const oCtx  = oItem.getBindingContext();
            const accountId = oCtx.getProperty("ID");

            // Store selected account ID in component model for other views
            this.getOwnerComponent()
                .getModel("state")
                .setProperty("/selectedAccountId", accountId);

            this.getOwnerComponent()
                .getRouter()
                .navTo("RouteAccountDetail", { accountId });
        },

        onNavBack: function () {
            this.getOwnerComponent()
                .getRouter()
                .navTo("RouteCustomer_view");
        }
    });
});