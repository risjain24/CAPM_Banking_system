const SELECT = require("@sap/cds/lib/ql/SELECT");
const cds = require("@sap/cds");

module.exports = (srv) => {
    const { Accounts, Transactions, Customers } = srv.entities;

    const getLoggedInCustomer = async (req) => {
        const email = req.user?.attr?.email ?? req.user?.id;
        const customer = await SELECT.one.from(Customers).where({ email });
        if (!customer) {
            req.error(403, `No customer record found for user: ${email}`);
            return null;
        }
        return customer;
    };

    const verifyAccountOwnership = async (req, accountId) => {
        const customer = await getLoggedInCustomer(req);
        if (!customer) return null;

        const account = await SELECT.one
            .from(Accounts)
            .where({ ID: accountId, customer_ID: customer.ID });

        if (!account) {
            req.error(403, "Account does not belong to the logged-in customer");
            return null;
        }
        return account;
    };

    srv.on('deposit', async (req) => {
        const { accountId, amount: amountI } = req.data;

        const amount = parseFloat(parseFloat(amountI).toFixed(2));

        if (amount <= 0) {
            req.error(400, 'Amount must be positive');
            return;
        }

        const account = await verifyAccountOwnership(req, accountId);
        if (!account) return;

        const newBalance = parseFloat((parseFloat(account.balance) + parseFloat(amount)).toFixed(2));
        await srv.run(
            UPDATE(Accounts).set({ balance: newBalance }).where({ ID: accountId })
        );

        await srv.run(
            INSERT.into(Transactions).entries({
                amount,
                type: 'DEPOSIT',
                account_ID: accountId,
                note: null,
                transferRef: null,
                toAccount_ID: null,
                fromAccount_ID: null
            })
        );

        return `Amount deposited, Updated Balance: ${newBalance}`;
    })

    srv.on('withdraw', async (req) => {
        const { accountId, amount: amountI } = req.data;

        const amount = parseFloat(parseFloat(amountI).toFixed(2));

        if (amount <= 0) {
            req.error(400, "Amount must be positive");
            return;
        }

        const account = await verifyAccountOwnership(req, accountId)
        if (!account) return;

        if (account.balance < amount) {
            req.error(400, 'Insufficient balance');
            return;
        }

        const newBalance = parseFloat((parseFloat(account.balance) - parseFloat(amount)).toFixed(2));

        await srv.run(
            UPDATE(Accounts)
                .set({ balance: newBalance })
                .where({ ID: accountId })
        );

        await srv.run(
            INSERT.into(Transactions).entries({
                amount,
                type: 'WITHDRAWAL',
                account_ID: accountId,
                note: null,
                transferRef: null,
                toAccount_ID: null,
                fromAccount_ID: null
            })
        );

        return `Amount withdrawn, Updated Balance: ${newBalance}`;
    });

    srv.on('getBalance', async (req) => {
        const { accountId } = req.data;

        const account = await verifyAccountOwnership(req, accountId);

        if (!account) {
            req.error(404, 'Account not found');
            return;
        }

        return account.balance;
    });

    srv.on('getCustomerAccounts', async (req) => {
        const customer = await getLoggedInCustomer(req);
        if (!customer) return;

        const accounts = await SELECT.from('Accounts')
            .where({ customer_ID: customer.ID });

        return accounts;
    });

    srv.on('initiateTransfer', async (req) => {
        const { fromAccountId, toAccountNo, toIFSC, note } = req.data;
        const amountf = parseFloat(req.data.amount);

        if (amountf <= 0) {
            req.error(400, "Transfer amount must be positive");
            return;
        }

        const toAccount = await SELECT.one
            .from(Accounts)
            .where({ account_no: toAccountNo, ifsc_code: toIFSC });

        if (!toAccount) {
            req.error(404, "Destination account not found");
            return;
        }

        // Basic validations
        if (fromAccountId === toAccount.ID) {
            req.error(400, "Source and destination accounts must differ");
            return;
        }

        const fromAccount = await verifyAccountOwnership(req, fromAccountId);
        if (!fromAccount) return;

        if (fromAccount.balance < amountf) {
            req.error(
                400,
                `Insufficient balance. Available: ${fromAccount.balance}`
            );
            return;
        }

        const transferRef = cds.utils.uuid();
        let updatedBalance = parseFloat((parseFloat(fromAccount.balance) - amountf).toFixed(2));

        await srv.run(
            UPDATE(Accounts)
                .set({ balance: updatedBalance })
                .where({ ID: fromAccountId })
        );

        updatedBalance = parseFloat((parseFloat(toAccount.balance) + amountf).toFixed(2));

        await srv.run(
            UPDATE(Accounts)
                .set({ balance: updatedBalance })
                .where({ ID: toAccount.ID })
        );

        await srv.run(
            INSERT.into(Transactions).entries([
                {
                    type: "TRANSFER_OUT",
                    amount: amountf,
                    note: note ?? `Transfer to account ${toAccount.ID}`,
                    transferRef,
                    account_ID: fromAccountId,
                    toAccount_ID: toAccount.ID,
                    fromAccount_ID: null,
                },
                {
                    type: "TRANSFER_IN",
                    amount: amountf,
                    note: note ?? `Transfer from account ${fromAccountId}`,
                    transferRef,
                    account_ID: toAccount.ID,
                    fromAccount_ID: fromAccountId,
                    toAccount_ID: null,
                },
            ])
        );

        return `Transfer ${transferRef} completed successfully`;
    });

    srv.on("addBeneficiary", async (req) => {
        const { accountNo, ifscCode, nickname } = req.data;
        const { Beneficiaries, Accounts } = srv.entities;

        const customer = await getLoggedInCustomer(req);
        if (!customer) return;

        if (!nickname) {
            req.error(404, "Enter a nickname");
            return;
        }

        // Check account exists
        const targetAccount = await SELECT.one
            .from(Accounts)
            .where({ account_no: accountNo, ifsc_code: ifscCode });

        if (!targetAccount) {
            req.error(404, "Account not found");
            return;
        }

        // Prevent adding own account as beneficiary
        if (targetAccount.ID === customer.ID) {
            req.error(404, "Cannot add your own account as beneficiary");
            return;
        }

        const existing = await SELECT.one
            .from(Beneficiaries)
            .where({
                customer_ID: customer.ID,
                toAccount_ID: targetAccount.ID
            });

        if (existing) {
            req.error(404, "Beneficiary already exists");
            return;
        }

        await srv.run(
            INSERT.into(Beneficiaries).entries({
                customer_ID: customer.ID,
                toAccount_ID: targetAccount.ID,
                nickname: nickname
            })
        );

        return `Beneficiary added successfully`;
    });

    srv.on("removeBeneficiary", async (req) => {
        const { beneficiaryId } = req.data;
        const { Beneficiaries } = srv.entities;

        const customer = await getLoggedInCustomer(req);
        if (!customer) return;

        // Verify beneficiary belongs to logged-in customer
        const beneficiary = await SELECT.one
            .from(Beneficiaries)
            .where({
                ID: beneficiaryId,
                customer_ID: customer.ID
            });

        if (!beneficiary) {
            req.error(404, "Beneficiary not found");
            return;
        }

        await srv.run(
            DELETE.from(Beneficiaries).where({ ID: beneficiaryId })
        );

        return `Beneficiary removed successfully`;
    });

    srv.on("updateMyProfile", async (req) => {

        const { name, phone, address } = req.data;
        const customer = await getLoggedInCustomer(req);
        if (!customer) return;

        // Validate
        if (!name || name.trim() === "") {
            req.error(400, "Name cannot be empty");
            return;
        }
        if (!phone || phone.trim() === "") {
            req.error(400, "Phone no cannot be empty");
            return;
        }

        await srv.run(
            UPDATE(Customers)
                .set({ name, phone, address })
                .where({ ID: customer.ID })
        );

        return "Profile updated successfully";
    });

    srv.before("READ", "BankingService.Beneficiaries", async (req) => {
        const customer = await getLoggedInCustomer(req);
        if (!customer) return;
        req.query.where({ customer_ID: customer.ID });
    });

    srv.before("READ", "BankingService.Customers", async (req) => {
        const email = req.user?.attr?.email ?? req.user?.id;
        req.query.where({ email });
    });

    srv.before("READ", "BankingService.Accounts", async (req) => {
        const customer = await getLoggedInCustomer(req);
        if (!customer) return;
        req.query.where({ customer_ID: customer.ID });
    });

    srv.before("READ", "BankingService.Transactions", async (req) => {
        const customer = await getLoggedInCustomer(req);
        if (!customer) return;

        const ownAccounts = await SELECT.from(Accounts)
            .columns("ID")
            .where({ customer_ID: customer.ID });

        const ids = ownAccounts.map((a) => a.ID);
        if (!ids.length) {
            req.error(403, "No accounts found for this customer");
            return;
        }

        req.query.where({ account_ID: { in: ids } });
    });

    srv.before("UPDATE", "BankingService.Customers", async (req) => {
        const customer = await getLoggedInCustomer(req);
        if (!customer) {
            req.error(403, "Customer not found");
            return;
        }

        if (req.data.ID && req.data.ID !== customer.ID) {
            req.error(403, "Cannot update another customer's profile");
            return;
        }

        req.data.ID = customer.ID;
        delete req.data.email;
    });
}