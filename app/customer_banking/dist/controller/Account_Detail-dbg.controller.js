sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/VBox",
    "sap/m/Label",
    "sap/ui/model/json/JSONModel"
], function (Controller, Dialog, Input, Button, VBox, Label, JSONModel) {
    "use strict";

    return Controller.extend("customerbanking.controller.Account_Detail", {

        onInit: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteAccountDetail")
                   .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: async function (oEvent) {
            this._accountId = oEvent.getParameter("arguments").accountId;
            this._loadAccount();
        },

        _loadAccount: async function () {
            const oModel = await this.getOwnerComponent().getModel();

            const oContextBinding = oModel.bindContext(`/Accounts(${this._accountId})`);
            try {
                const account = await oContextBinding.requestObject();
                const oProfileModel = new JSONModel(account);
                this.getView().setModel(oProfileModel, "account");

            } catch(err) {
                console.error("Failed to load account", err.message);
            }
        },

        // ── Deposit Dialog ──────────────────────────────────────────────
        onDeposit: async function () {
            this._openAmountDialog("Deposit", (amount) => {
                this._callAction("deposit", {
                    accountId: this._accountId,
                    amount:    parseFloat(amount)
                });
            });
        },

        // ── Withdraw Dialog ─────────────────────────────────────────────
        onWithdraw: async function () {
            this._openAmountDialog("Withdraw", (amount) => {
                this._callAction("withdraw", {
                    accountId: this._accountId,
                    amount:    parseFloat(amount)
                });
            });
        },

        // ── Transfer Dialog ─────────────────────────────────────────────
        onTransfer: async function () {
            const oToAccountInput = new Input({ placeholder: "Recipient Account Number", type: "Number" });
            const oToIFSCInput = new Input({ placeholder: "IFSC Code", type: "Text" });
            const oAmountInput    = new Input({ placeholder: "Amount", type: "Number" });
            const oNoteInput      = new Input({ placeholder: "Note (optional)", type: "Text" });

            const oDialog = new Dialog({
                title: "Transfer Funds",
                content: new VBox({
                    items: [
                        new Label({ text: "Recipient Account Number" }), oToAccountInput,
                        new Label({ text: "IFSC Code"}), oToIFSCInput,
                        new Label({ text: "Amount" }),        oAmountInput,
                        new Label({ text: "Note" }),          oNoteInput
                    ]
                }),
                beginButton: new Button({
                    text: "Transfer",
                    type: "Emphasized",
                    press: () => {
                        this._callAction("initiateTransfer", {
                            fromAccountId: this._accountId,
                            toAccountNo:   oToAccountInput.getValue(),
                            toIFSC: oToIFSCInput.getValue(),
                            amount:        parseFloat(oAmountInput.getValue()),
                            note:          oNoteInput.getValue()
                        });
                        oDialog.close();
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: () => oDialog.close()
                })
            });

            oDialog.open();
        },

        // ── Shared: call any action via fetch ───────────────────────────
        _callAction: async function (actionName, payload) {
            fetch(`/odata/v4/banking/${actionName}`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(() => {
                sap.m.MessageToast.show("Action completed successfully");
                this._loadAccount(); // refresh balance
            })
            .catch(err => {
                console.error(`${actionName} failed`, err);
                sap.m.MessageToast.show("Action failed");
            });
        },

        // ── Navigate to Transactions ────────────────────────────────────
        onNavToTransactions: function () {
            this.getOwnerComponent()
                .getRouter()
                .navTo("RouteTransactionList", { accountId: this._accountId });
        },

        onNavBack: function () {
            this.getOwnerComponent()
                .getRouter()
                .navTo("RouteAccountList");
        },

        // ── Helper: simple amount input dialog ──────────────────────────
        _openAmountDialog: async function (title, onConfirm) {
            const oInput = new Input({ placeholder: "Amount", type: "Number" });

            const oDialog = new Dialog({
                title,
                content: new VBox({
                    items: [ new Label({ text: "Amount" }), oInput ]
                }),
                beginButton: new Button({
                    text:  "Confirm",
                    type:  "Emphasized",
                    press: () => {
                        onConfirm(oInput.getValue());
                        oDialog.close();
                    }
                }),
                endButton: new Button({
                    text:  "Cancel",
                    press: () => oDialog.close()
                })
            });

            oDialog.open();
        }
    });
});