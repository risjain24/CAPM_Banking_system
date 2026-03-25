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
  balance  : Decimal(15, 2);
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
  customer     : Association to Customers;
  transactions : Composition of many Transactions
                   on transactions.account = $self;
}

entity Transactions : cuid, managed {
  amount  : Decimal(15, 2);
  type    : String;
  account : Association to Accounts;
}
