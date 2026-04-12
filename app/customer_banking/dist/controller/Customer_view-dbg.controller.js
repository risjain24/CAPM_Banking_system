sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("customerbanking.controller.Customer_view", {
        onInit: function () {
            this._loadProfile();
        },

        _loadProfile: async function () {
            const oModel = this.getOwnerComponent().getModel();
            oModel.bindList("/Customers")
                .requestContexts(0, 100)
                .then((aContexts) => {
                    console.log("Contexts received:", aContexts.length);

                    if (!aContexts.length) {
                        console.error("No profile found");
                        return;
                    }

                    const customer = aContexts[0].getObject();
                    console.log("Customer data:", customer);

                    const oProfileModel = new JSONModel(customer);
                    this.getView().setModel(oProfileModel, "profile");
                })
                .catch((err) => {
                    console.error("Failed to load profile", err.message);
                });
        },

        onNavToAccounts: async function () {
            let routes = await this.getOwnerComponent().getRouter();

            routes.navTo("RouteAccountList");
        }
    });
});