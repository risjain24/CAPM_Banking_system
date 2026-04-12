using my.banking as db from '../db/schema';

service BankingService {
  entity Customers            as projection on db.Customers;

  @cds.redirection.target: true
  entity Accounts             as projection on db.Accounts;

  entity Transactions         as projection on db.Transactions;
  entity RelationshipManagers as projection on db.RelationshipManagers;
  entity Beneficiaries        as projection on db.Beneficiaries;

  action   initiateTransfer(fromAccountId: UUID,
                            toAccountNo: Decimal(8, 0),
                            toIFSC: String,
                            amount: Decimal(15, 2),
                            note: String)                                               returns String;

  action   deposit(accountId: UUID, amount: Decimal)                                    returns Decimal;
  action   withdraw(accountId: UUID, amount: Decimal)                                   returns Decimal;
  action   addBeneficiary(accountNo: Decimal(8, 0), ifscCode: String, nickname: String) returns String;
  action   removeBeneficiary(accountId: UUID, nickname: String)                         returns String;
  action   updateMyProfile(name: String, phone: String, address: String)                returns String;

  function getBalance(accountId: UUID)                                                  returns Decimal;
  function getCustomerAccounts(customerId: UUID)                                        returns many Accounts;
}

annotate BankingService with @(requires: 'authenticated-user');

annotate BankingService.Customers with @(restrict: [
  {
    grant: '*',
    to   : 'Admin'
  },
  {
    grant: 'READ',
    to   : 'Customer'
  }
]);

annotate BankingService.Accounts with @(restrict: [
  {
    grant: '*',
    to   : 'Admin'
  },
  {
    grant: 'READ',
    to   : 'Customer'
  }
]);

annotate BankingService.Transactions with @(restrict: [
  {
    grant: '*',
    to   : 'Admin'
  },
  {
    grant: 'READ',
    to   : 'Customer'
  }
]);

annotate BankingService.Beneficiaries with @(restrict: [
  {
    grant: '*',
    to   : 'Customer'
  }
]);

annotate BankingService.Customers with @(Capabilities: {UpdateRestrictions: {
  Updatable             : true,
  NonUpdatableProperties: [email] // ← email cannot be changed
}});

annotate BankingService.initiateTransfer with @(requires: 'Customer');
annotate BankingService.deposit with @(requires: 'Customer');
annotate BankingService.withdraw with @(requires: 'Customer');
annotate BankingService.addBeneficiary with @(requires: 'Customer');
annotate BankingService.removeBeneficiary with @(requires: 'Customer');
annotate BankingService.updateMyProfile with @(requires: 'Customer');

annotate BankingService.getBalance with @(requires: 'Customer');
annotate BankingService.getCustomerAccounts with @(requires: 'Customer');
