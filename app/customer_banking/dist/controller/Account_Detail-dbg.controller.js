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

            } catch (err) {
                console.error("Failed to load account", err.message);
            }
        },

        // ── Deposit Dialog ──────────────────────────────────────────────
        onDeposit: async function () {
            this._openAmountDialog("Deposit", (amount) => {
                this._callAction("deposit", {
                    accountId: this._accountId,
                    amount: parseFloat(amount)
                });
            });
        },

        // ── Withdraw Dialog ─────────────────────────────────────────────
        onWithdraw: async function () {
            this._openAmountDialog("Withdraw", (amount) => {
                this._callAction("withdraw", {
                    accountId: this._accountId,
                    amount: parseFloat(amount)
                });
            });
        },

        // ── Transfer Dialog ─────────────────────────────────────────────
        onTransfer: async function () {

            const oModel = this.getView().getModel();

            const oListBinding = oModel.bindList("/Beneficiaries", null, null, null, { "$expand": "toAccount" });
            oListBinding.requestContexts().then((aContexts) => {
                const aBeneficiaries = aContexts.map(oContext => oContext.getObject());

                this._openTransferDialog(aBeneficiaries);
            }).catch((oError) => {
                this._openTransferDialog([]);
            });

        },

        _openTransferDialog: function (beneficiaries) {
            const oSelect = new sap.m.Select({ width: "100%" });
            const oAmountInput = new Input({ placeholder: "Amount", type: "Number" });
            const oNoteInput = new Input({ placeholder: "Note (optional)" });
            const oToAccountInput = new Input({ placeholder: "Recipient Account Number" });
            const oToIFSCInput = new Input({ placeholder: "IFSC Code" });

            oSelect.addItem(new sap.ui.core.Item({
                key: "manual",
                text: "Enter details manually"
            }));

            beneficiaries.forEach(b => {
                oSelect.addItem(new sap.ui.core.Item({
                    key: b.ID,
                    text: b.nickname ?? b.toAccount_ID
                }));
            });

            // Container for manual input fields — shown/hidden based on selection
            const oManualFields = new VBox({
                items: [
                    new Label({ text: "Recipient Account Number" }),
                    oToAccountInput,
                    new Label({ text: "IFSC Code" }),
                    oToIFSCInput
                ],
                visible: true  // visible by default since "manual" is selected first
            });

            // When beneficiary selected — prefill and hide manual fields
            oSelect.attachChange(() => {
                const selectedKey = oSelect.getSelectedKey();

                if (selectedKey === "manual") {
                    // Clear fields and let user type
                    oToAccountInput.setValue("");
                    oToIFSCInput.setValue("");
                    oManualFields.setVisible(true);
                } else {
                    // Find selected beneficiary and prefill
                    const selected = beneficiaries.find(b => b.ID === selectedKey);
                    if (selected) {
                        oToAccountInput.setValue(selected.toAccount.account_no ?? "");
                        oToIFSCInput.setValue(selected.toAccount.ifsc_code ?? "");
                    }
                    // Hide manual fields — prefilled from beneficiary
                    oManualFields.setVisible(false);
                }
            });

            const oDialog = new Dialog({
                title: "Transfer Funds",
                content: new VBox({
                    class: "sapUiSmallMargin",
                    items: [
                        new Label({ text: "Select Beneficiary" }),
                        oSelect,
                        oManualFields,          // ← contains account + IFSC inputs
                        new Label({ text: "Amount" }),
                        oAmountInput,
                        new Label({ text: "Note" }),
                        oNoteInput
                    ]
                }),
                beginButton: new Button({
                    text: "Transfer",
                    type: "Emphasized",
                    press: () => {
                        const toAccountNo = oToAccountInput.getValue().trim();
                        const toIFSC = oToIFSCInput.getValue().trim();
                        const amount = parseFloat(oAmountInput.getValue());

                        // Validation
                        if (!toAccountNo) {
                            sap.m.MessageToast.show("Please enter recipient account number");
                            return;
                        }
                        if (!toIFSC) {
                            sap.m.MessageToast.show("Please enter IFSC code");
                            return;
                        }
                        if (!amount || amount <= 0) {
                            sap.m.MessageToast.show("Please enter a valid amount");
                            return;
                        }

                        this._callAction("initiateTransfer", {
                            fromAccountId: this._accountId,
                            toAccountNo,
                            toIFSC,
                            amount,
                            note: oNoteInput.getValue()
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
            const oModel = this.getView().getModel();
            const oAction = oModel.bindContext(`/` + actionName + `(...)`);
            if (payload) {
                for (let key in payload) {
                    oAction.setParameter(key, payload[key]);
                }
            }

            try {
                await oAction.execute();
                const oActionContext = oAction.getBoundContext();
                const oMessage = oActionContext?.getProperty("value");
                sap.m.MessageToast.show( oMessage || "Action completed successfully");

                this._loadAccount;
            } catch (oError) {
                console.error(`${actionName} failed`, oError);
                const sMsg = oError.message || "Action failed";
                sap.m.MessageToast.show(sMsg);
                throw oError;
            }
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
                    items: [new Label({ text: "Amount" }), oInput]
                }),
                beginButton: new Button({
                    text: "Confirm",
                    type: "Emphasized",
                    press: () => {
                        onConfirm(oInput.getValue());
                        oDialog.close();
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: () => oDialog.close()
                })
            });

            oDialog.open();
        }
    });
});