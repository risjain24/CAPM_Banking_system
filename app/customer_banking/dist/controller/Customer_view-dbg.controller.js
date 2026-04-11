sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("customerbanking.controller.Customer_view", {
        onInit: function () {
            const oModel = this.getOwnerComponent().getModel();
            const oBinding = oModel.bindList("/Customers");
            oBinding.requestContexts().then((aContexts) => {
                if (!aContexts.length) {
                    console.error("No profile found");
                    return;
                }

                // Get the data object from first context
                const customer = aContexts[0].getObject();

                // Set into JSONModel and bind to view
                const oProfileModel = new JSONModel(customer);
                this.getView().setModel(oProfileModel, "profile");

            }).catch((err) => {
                console.error("Failed to load profile", err);
            });
        },

        onNavToAccounts: function () {
            this.getOwnerComponent().getRouter().navTo("Account_List");
        }
    });
});