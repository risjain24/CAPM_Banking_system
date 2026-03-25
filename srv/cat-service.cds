using my.banking as db from '../db/schema';

service BankingService {
    entity Customers as projection on db.Customers;
    entity Accounts as projection on db.Accounts;
    entity Transactions as projection on db.Transactions;
    entity RelationshipManagers as projection on db.RelationshipManagers;

    action deposit(accountId: UUID, amount: Decimal) returns Decimal;
    action withdraw(accountId: UUID, amount: Decimal) returns Decimal;
    action UpdateCustomerDetail(customerId: UUID, name: String, phone: String);

    function getBalance(accountId: UUID) returns Decimal;
    function getCustomerAccounts(customerId: UUID) returns many Accounts;
}

annotate BankingService with @(requires: 'authenticated-user');

annotate BankingService.Customers with @(restrict: [
    { grant: '*', to: 'AdminRole'}
]);
