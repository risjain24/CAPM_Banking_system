using AdminService as service from '../../srv/admin-service';

annotate service.Customers with @(
    UI.LineItem                : [
        {
            $Type: 'UI.DataField',
            Label: 'name',
            Value: name,
        },
        {
            $Type: 'UI.DataField',
            Label: 'email',
            Value: email,
        },
        {
            $Type: 'UI.DataField',
            Label: 'phone',
            Value: phone,
        },
        {
            $Type: 'UI.DataField',
            Label: 'address',
            Value: address,
        },
    ],

    UI.HeaderInfo              : {
        TypeName      : 'Customer',
        TypeNamePlural: 'Customers',
        Title         : {Value: name},
        Description   : {Value: email}
    },

    UI.FieldGroup #CustomerInfo: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Label: 'Name',
                Value: name
            },
            {
                $Type: 'UI.DataField',
                Label: 'Email',
                Value: email
            },
            {
                $Type: 'UI.DataField',
                Label: 'Phone',
                Value: phone
            },
            {
                $Type: 'UI.DataField',
                Label: 'Address',
                Value: address
            },
        ],
    },

    UI.Facets                  : [
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'CustomerInfoFacet',
            Label : 'Personal Details',
            Target: '@UI.FieldGroup#CustomerInfo',
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'AccountsFacet',
            Label : 'Accounts',
            Target: 'accounts/@UI.LineItem',
        },
    ],

    Capabilities               : {
        Insertable: true,
        Updatable : true,
        Deletable : true
    }
);

annotate service.Accounts with @(

    UI.LineItem: [
        { $Type: 'UI.DataField', Label: 'Account Number', Value: account_no },
        { $Type: 'UI.DataField', Label: 'IFSC_Code',      Value: ifsc_code  },
        { $Type: 'UI.DataField', Label: 'Type',           Value: type       },
        { $Type: 'UI.DataField', Label: 'Balance',        Value: balance    },
    ],

    UI.HeaderInfo: {
        TypeName:       'Account',
        TypeNamePlural: 'Accounts',
        Title:          { Value: account_no },
        Description:    { Value: type }
    },

    UI.FieldGroup #AccountInfo: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Label: 'Account Number', Value: account_no },
            { $Type: 'UI.DataField', Label: 'IFSC Code',      Value: ifsc_code  },
            { $Type: 'UI.DataField', Label: 'Type',           Value: type       },
            { $Type: 'UI.DataField', Label: 'Balance',        Value: balance    },
        ],
    },

    UI.Facets: [{
        $Type:  'UI.ReferenceFacet',
        ID:     'AccountInfoFacet',
        Label:  'Account Details',
        Target: '@UI.FieldGroup#AccountInfo',
    }],

    Capabilities: {
        Insertable: true,
        Updatable:  true,
        Deletable:  true
    }
);