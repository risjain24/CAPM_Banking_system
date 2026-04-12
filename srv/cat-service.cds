using my.banking as db from '../db/schema';

service BankingService {
    entity Customers            as projection on db.Customers;

    @cds.redirection.target: true
    entity Accounts             as projection on db.Accounts;

    entity Transactions         as projection on db.Transactions;
    entity RelationshipManagers as projection on db.RelationshipManagers;

    @readonly
    entity TransferTargets      as
        select from db.Accounts {
            ID,
            type,
            customer.name as holderName : String
        };

    action   initiateTransfer(fromAccountId: UUID,
                              toAccountNo: Decimal(8,0),
                              toIFSC: String,
                              amount: Decimal(15, 2),
                              note: String)             returns String;

    action   deposit(accountId: UUID, amount: Decimal)  returns Decimal;
    action   withdraw(accountId: UUID, amount: Decimal) returns Decimal;

    function getBalance(accountId: UUID)                returns Decimal;
    function getCustomerAccounts(customerId: UUID)      returns many Accounts;
}

annotate BankingService with @(requires: 'authenticated-user');

// annotate BankingService.Customers with @(restrict: [{
//     grant: '*',
//     to   : 'Admin'
// }]);
