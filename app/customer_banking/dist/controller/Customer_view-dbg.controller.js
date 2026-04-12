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

        onEdit: function () {
            this.byId("customerName").setEditable(true);
            this.byId("customerPhone").setEditable(true);
            this.byId("customerAddress").setEditable(true);

            this.byId("editBtn").setVisible(false);
            this.byId("saveBtn").setVisible(true);
        },

        onSave: async function () {
            const oModel = this.getView().getModel();
            const oProfileData = this.getView().getModel("profile").getData();
            const oAction = oModel.bindContext("/updateMyProfile(...)");

            oAction.setParameter("name", oProfileData.name.trim());
            oAction.setParameter("phone", oProfileData.phone.trim());
            oAction.setParameter("address", oProfileData.address?.trim() ?? "");

            oAction.execute().then(() => {
                sap.m.MessageToast.show("Profile updated successfully!");
                // Disable inputs again
                this.byId("customerName").setEditable(false);
                this.byId("customerPhone").setEditable(false);
                this.byId("customerAddress").setEditable(false);

                // Swap buttons back
                this.byId("editBtn").setVisible(true);
                this.byId("saveBtn").setVisible(false);
                oModel.refresh();
            }).catch(function (oError) {
                sap.m.MessageBox.error("Update failed: " + oError.getMessage());
            });
        },

        onAddBeneficiary: function () {
            const oAccountNoInput = new sap.m.Input({ placeholder: "Recipient Account No" });
            const oAccountifscInput = new sap.m.Input({ placeholder: "Recipient IFSC Code" });
            const oNicknameInput = new sap.m.Input({ placeholder: "e.g. Mom's Savings" });

            const oDialog = new sap.m.Dialog({
                title: "Add Beneficiary",
                content: new sap.m.VBox({
                    class: "sapUiSmallMargin",
                    items: [
                        new sap.m.Label({ text: "Account No" }),
                        oAccountNoInput,
                        new sap.m.Label({ text: "IFSC Code" }),
                        oAccountifscInput,
                        new sap.m.Label({ text: "Nickname" }),
                        oNicknameInput
                    ]
                }),
                beginButton: new sap.m.Button({
                    text: "Add",
                    type: "Emphasized",
                    press: () => {
                        const accountNo = oAccountNoInput.getValue().trim();
                        const ifscCode = oAccountifscInput.getValue().trim();
                        const nickname = oNicknameInput.getValue().trim();

                        if (!accountNo || !ifscCode) {
                            sap.m.MessageToast.show("Please enter Recipient Account Details");
                            return;
                        }

                        const oModel = this.getView().getModel();
                        const oAction = oModel.bindContext("/addBeneficiary(...)");

                        oAction.setParameter("accountNo", accountNo);
                        oAction.setParameter("ifscCode", ifscCode);
                        oAction.setParameter("nickname", nickname);

                        oAction.execute().then(() => {
                            sap.m.MessageToast.show("Beneficiary added successfully");

                            if (oDialog) {
                                oDialog.close();
                            }

                            oModel.refresh();

                        }).catch((oError) => {
                            const sMsg = oError.message || "Failed to add beneficiary";
                            sap.m.MessageToast.show(sMsg);
                        });
                    }
                }),
                endButton: new sap.m.Button({
                    text: "Cancel",
                    press: () => oDialog.close()
                })
            });

            oDialog.open();
        },

        onNavToAccounts: async function () {
            let routes = await this.getOwnerComponent().getRouter();

            routes.navTo("RouteAccountList");
        }
    });
});