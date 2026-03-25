const SELECT = require("@sap/cds/lib/ql/SELECT");

module.exports = (srv) => {
    const { Accounts, Transactions } = srv.entities;

    srv.on('deposit', async (req) => {
        const { accountId, amount } = req.data;
        if (amount < 0) {
            req.error(400, 'Invalid amount');
            return;
        }

        let account = await SELECT.one.from(Accounts).where({ ID: accountId });
        if (!account) {
            req.error(404, 'Account not found');
            return;
        }

        await UPDATE(Accounts).set({ balance: account.balance + amount }).where({ ID: accountId });

        await INSERT.into(Transactions).entries({
            amount, type: 'CREDIT', account_ID: accountId
        });

        return account.balance + amount;
    })

    srv.on('withdraw', async (req) => {
        const { accountId, amount } = req.data;

        let account = await SELECT.one.from(Accounts).where({ ID: accountId });

        if (account.balance < amount) {
            req.error(400, 'Insufficient balance');
            return;
        }

        await UPDATE(Accounts).set({ balance: account.balance - amount }).where({ ID: accountId });

        await INSERT.into(Transactions).entries({
            amount, type: 'DEBIT', account_ID: accountId
        });

        return account.balance - amount;
    });

    srv.on('getBalance', async (req) => {
        const { accountId } = req.data;

        const account = await SELECT.one.from(Accounts)
            .where({ ID: accountId });

        if (!account) {
            req.error(404, 'Account not found');
            return;
        }

        return account.balance;
    });

    srv.on('getCustomerAccounts', async (req) => {
        const { customerId } = req.data;

        const accounts = await SELECT.from('Accounts')
            .where({ customer_ID: customerId });

        return accounts;
    });
}