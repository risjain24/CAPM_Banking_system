using {
  cuid,
  managed,
// sap.common.CodeList
} from '@sap/cds/common';

namespace my.banking;

entity Customers : cuid, managed {
  name     : String;
  email    : String;
  phone    : String;
  rm       : Association to RelationshipManagers;
  accounts : Composition of many Accounts
               on accounts.customer = $self;
}

entity RelationshipManagers : cuid, managed {
  name      : String;
  email     : String;
  customers : Association to many Customers
                on customers.rm = $self;
}

entity Admins : cuid, managed {
  name  : String;
  email : String;
}

entity Accounts : cuid, managed {
  type         : String;
  balance      : Decimal(15, 2);
  account_no   : Decimal(8,0);
  ifsc_code    : String;
  customer     : Association to Customers;
  transactions : Composition of many Transactions
                   on transactions.account = $self;
}

entity Transactions : cuid, managed {
  amount      : Decimal(15, 2);
  type        : String enum {
    DEPOSIT;
    WITHDRAWAL;
    TRANSFER_OUT;
    TRANSFER_IN;
  };
  account     : Association to Accounts;
  note        : String;
  transferRef : UUID;
  toAccount   : Association to Accounts;
  fromAccount : Association to Accounts;
}
