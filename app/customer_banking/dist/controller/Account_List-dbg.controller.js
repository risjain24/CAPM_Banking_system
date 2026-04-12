sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("customerbanking.controller.Account_List", {

        onInit: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteAccountList").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._loadAccounts();
        },

        _loadAccounts: async function () {
            const oModel = await this.getOwnerComponent().getModel();

            oModel.bindList("/Accounts")
                .requestContexts(0, 100)
                .then((aContexts) => {
                    const accounts = aContexts.map(c => c.getObject());
                    console.log("Accounts loaded:", accounts);

                    // Set into local JSONModel — rebinds list fresh every time
                    const oLocalModel = new JSONModel({ accounts });
                    this.getView().setModel(oLocalModel, "accountsModel");
                })
                .catch((err) => {
                    console.error("Failed to load accounts", err.message);
                });
        },

        onAccountSelected: function (oEvent) {
            const oItem = oEvent.getParameter("listItem");
            const oCtx  = oItem.getBindingContext("accountsModel");
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