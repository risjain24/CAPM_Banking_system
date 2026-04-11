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
        const { accountId, amount } = req.data;

        if (amount <= 0) {
            req.error(400, 'Amount must be positive');
            return;
        }

        const account = await verifyAccountOwnership(req, accountId);
        if (!account) return;

        const newBalance = account.balance + amount;

        await UPDATE(Accounts).set({ balance: newBalance }).where({ ID: accountId });

        await INSERT.into(Transactions).entries({
            amount,
            type: 'DEPOSIT',
            account_ID: accountId,
            note: null,
            transferRef: null,
            toAccount_ID: null,
            fromAccount_ID: null
        });

        return newBalance;
    })

    srv.on('withdraw', async (req) => {
        const { accountId, amount } = req.data;

        if (amount <= 0) {
            req.error(400, "Amount must be positive");
            return;
        }

        const account = verifyAccountOwnership(req, accountId)
        if (!account) return;

        if (account.balance < amount) {
            req.error(400, 'Insufficient balance');
            return;
        }

        const newBalance = account.balance - amount;

        await srv.run(
            UPDATE(Accounts)
                .set({ balance: newBalance })
                .where({ ID: accountId })
        );

        await srv.run(
            INSERT.into(Transactions).entries({
                amount,
                type: 'DEBIT',
                account_ID: accountId,
                note: null,
                transferRef: null,
                toAccount_ID: null,
                fromAccount_ID: null
            })
        );

        return newBalance;
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
        const { fromAccountId, toAccountId, note } = req.data;
        const amount = parseFloat(req.data.amount);

        // Basic validations
        if (fromAccountId === toAccountId) {
            req.error(400, "Source and destination accounts must differ");
            return;
        }
        if (amount <= 0) {
            req.error(400, "Transfer amount must be positive");
            return;
        }

        const fromAccount = await verifyAccountOwnership(req, fromAccountId);
        if (!fromAccount) return;

        if (fromAccount.balance < amount) {
            req.error(
                400,
                `Insufficient balance. Available: ${fromAccount.balance}`
            );
            return;
        }

        const toAccount = await SELECT.one
            .from(Accounts)
            .where({ ID: toAccountId });

        if (!toAccount) {
            req.error(404, "Destination account not found");
            return;
        }

        const transferRef = cds.utils.uuid();
        let updatedBalance = fromAccount.balance - amount;

        await srv.run(
            UPDATE(Accounts)
                .set({ balance: updatedBalance })
                .where({ ID: fromAccountId })
        );

        updatedBalance = parseFloat(toAccount.balance) + amount;

        await srv.run(
            UPDATE(Accounts)
                .set({ balance: updatedBalance })
                .where({ ID: toAccountId })
        );

        await srv.run(
            INSERT.into(Transactions).entries([
                {
                    type: "TRANSFER_OUT",
                    amount,
                    note: note ?? `Transfer to account ${toAccountId}`,
                    transferRef,
                    account_ID: fromAccountId,
                    toAccount_ID: toAccountId,
                    fromAccount_ID: null,
                },
                {
                    type: "TRANSFER_IN",
                    amount,
                    note: note ?? `Transfer from account ${fromAccountId}`,
                    transferRef,
                    account_ID: toAccountId,
                    fromAccount_ID: fromAccountId,
                    toAccount_ID: null,
                },
            ])
        );

        return `Transfer ${transferRef} completed successfully`;
    });

    srv.before("READ", "Customers", async (req) => {
        const email = req.user?.attr?.email ?? req.user?.id;
        req.query.where({ email });
    });

    srv.before("READ", "Accounts", async (req) => {
        const customer = await getLoggedInCustomer(req);
        if (!customer) return;
        req.query.where({ customer_ID: customer.ID });
    });

    srv.before("READ", "Transactions", async (req) => {
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
}