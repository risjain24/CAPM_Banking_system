using my.banking as db from '../db/schema';

@path: '/admin'
service AdminService @(requires: 'Admin') {
    @odata.draft.enabled
    entity Customers            as projection on db.Customers;
    entity Accounts             as projection on db.Accounts;
}