sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("customerbanking.controller.Account_List", {

        onInit: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteAccountList").attachPatternMatched(this._onRouteMatched, this);

            const oList = this.byId("accountList");
            oList.bindItems({
                path: "/Accounts",
                template: new sap.m.StandardListItem({
                    title: "Account Number: {account_no}",
                    description: "Type: {type}",
                    type: "Navigation"
                })
            });
        },

        _onRouteMatched: function () {
            const oList = this.byId("accountList");
            const oBinding = oList.getBinding("items");
            
            if(oBinding) {
                oBinding.refresh();
            }
        },

        onAccountSelected: function (oEvent) {
            const oItem = oEvent.getParameter("listItem");
            const oCtx  = oItem.getBindingContext();
            const accountId = oCtx.getProperty("ID");

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