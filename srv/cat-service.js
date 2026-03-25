const SELECT = require("@sap/cds/lib/ql/SELECT");

module.exports = (srv) => {
    const { Accounts, Transactions} = srv.entities;

    srv.on('deposit',async (req) => {
        const { accountId, amount} = req.data;
        if(amount < 0) req.error(400, 'Invalid amount');

        let account = await SELECT.one.from(Accounts).where({ ID: accountId});
        if(!account) req.error(404, 'Account not found');

        await UPDATE(Accounts).set({ balance: account.balance + amount }).where({ID: accountId});

        await INSERT.into(Transactions).entries({
            amount,type: 'CREDIT', account_ID: accountId
        });

        return account.balance + amount;
    })

    srv.on('Withdraw', async (req) => {
    });
}