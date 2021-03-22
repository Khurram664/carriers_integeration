const Sequelize = require('sequelize');
const sequelize = new Sequelize(process.env.POSTGRES_CONN_STRING, {
    dialect: 'postgres'
});
sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

const User = sequelize.define('user', {
    // attributes
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },

    email: {
        type: Sequelize.STRING,
        allowNull: false
    },
    role: {
        type: Sequelize.STRING,
        allowNull: false
    },
    createdAt: {
        field: 'created_at',
        type: Sequelize.DATE,
    },
    updatedAt: {
        field: 'updated_at',
        type: Sequelize.DATE,
    },
}, {
        // options
    });


const Customer = sequelize.define('customer', {
    // attributes
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },

    email: {
        type: Sequelize.STRING,
        allowNull: false
    },
    location: {
        type: Sequelize.STRING,
        allowNull: true
    },
    dbserver: {
        type: Sequelize.STRING,
        allowNull: true
    },
    dbuser: {
        type: Sequelize.STRING,
        allowNull: true
    },
    dbpass: {
        type: Sequelize.STRING,
        allowNull: true
    },
    company_name: {
        type: Sequelize.STRING,
        allowNull: true
    },
    contact_name: {
        type: Sequelize.STRING,
        allowNull: true
    },
    contact_number: {
        type: Sequelize.STRING,
        allowNull: true
    },
    contact_email: {
        type: Sequelize.STRING,
        allowNull: true
    },
    vicidial_domain: {
        type: Sequelize.STRING,
        allowNull: true
    },
    traffic_order: {
        type: Sequelize.STRING,
        allowNull: true
    },

    number: {
        type: Sequelize.STRING,
        allowNull: true
    },

    localrate: {
        type: Sequelize.FLOAT,
        allowNull: true
    },
    tfnrate: {
        type: Sequelize.FLOAT,
        allowNull: true
    },
    internalrate: {
        type: Sequelize.FLOAT,
        allowNull: true
    },
    localmrc: {
        type: Sequelize.FLOAT,
        allowNull: true
    },
    tfnmrc: {
        type: Sequelize.FLOAT,
        allowNull: true
    },
    internalmrc: {
        type: Sequelize.FLOAT,
        allowNull: true
    },
    createdAt: {
        field: 'created_at',
        type: Sequelize.DATE,
    },
    updatedAt: {
        field: 'updated_at',
        type: Sequelize.DATE,
    },
}, {
        // options
    });


const Destination = sequelize.define('destination', {
    // attributes
    customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    destination_ip: {
        type: Sequelize.STRING,
        allowNull: false
    },

    createdAt: {
        field: 'created_at',
        type: Sequelize.DATE,
    },
    updatedAt: {
        field: 'updated_at',
        type: Sequelize.DATE,
    },
}, {
        // options
    });

const Areacode = sequelize.define('areacodes', {
    // attributes
    number: {
        type: Sequelize.STRING,
        allowNull: false
    },
    nearby: {
        type: Sequelize.STRING,
        allowNull: false
    },
    state: {
        type: Sequelize.STRING,
        allowNull: false
    },
    createdAt: {
        field: 'created_at',
        type: Sequelize.DATE,
    },
    updatedAt: {
        field: 'updated_at',
        type: Sequelize.DATE,
    },
}, {
        // options
    });

const OutboundCarrier = sequelize.define('outbound_carriers', {
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    ip1: {
        type: Sequelize.STRING,
        allowNull: true
    },
    ip2: {
        type: Sequelize.STRING,
        allowNull: true
    },
    ip3: {
        type: Sequelize.STRING,
        allowNull: true
    },
    ip4: {
        type: Sequelize.STRING,
        allowNull: true
    },
    createdAt: {
        field: 'created_at',
        type: Sequelize.DATE,
    },
    updatedAt: {
        field: 'updated_at',
        type: Sequelize.DATE,
    },

}, {
        freezeTableName: true,
    });

const History = sequelize.define('history', {
    text: {
        type: Sequelize.STRING,
        allowNull: false
    },
    number: {
        type: Sequelize.STRING,
        allowNull: true
    },
    createdAt: {
        field: 'created_at',
        type: Sequelize.DATE,
    },
    updatedAt: {
        field: 'updated_at',
        type: Sequelize.DATE,
    },

}, {
        freezeTableName: true,
    });


const DID_Group = sequelize.define('number_group', {
    // attributes
    group_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },

    campaign: {
        type: Sequelize.STRING,
        allowNull: false
    },

    description: {
        type: Sequelize.STRING,
        allowNull: false
    },

    did_route: {
        type: Sequelize.STRING,
        allowNull: false
    },

    list_id: {
        type: Sequelize.STRING,
        allowNull: true
    },

    did_location: {
        type: Sequelize.STRING,
        allowNull: false
    },

    call_handle_method: {
        type: Sequelize.STRING,
        allowNull: false
    },

    filter_inbound_number: {
        type: Sequelize.STRING,
        allowNull: false
    },

    filter_phone_group_id: {
        type: Sequelize.STRING,
        allowNull: false
    },

    filter_url: {
        type: Sequelize.STRING,
        allowNull: true
    },

    server_ip: {
        type: Sequelize.STRING,
        allowNull: true
    },

    phone: {
        type: Sequelize.STRING,
        allowNull: true
    },

    voicemail: {
        type: Sequelize.STRING,
        allowNull: true
    },

    asterisk: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },

    dbdid: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },

    accid: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },

    last_assigned: {
        type: Sequelize.STRING,
        allowNull: true
    },

    areafill: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },

    active: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },

    total_number: {
        type: Sequelize.INTEGER,
        allowNull: true
    },

    createdAt: {
        field: 'created_at',
        type: Sequelize.DATE,
    },

    updatedAt: {
        field: 'updated_at',
        type: Sequelize.DATE,
    },
}, {
        freezeTableName: true,
    });

const Number_Inventory = sequelize.define('number_inventory', {
    // attributes
    number: {
        type: Sequelize.STRING,
        allowNull: false
    },
    carrier_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    customer_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    calls_yesterday: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    score1: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    score2: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    score3: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    group_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    status: {
        type: Sequelize.STRING,
        allowNull: false
    },
    date_acquired: {
        type: Sequelize.DATE,
        allowNull: true
    },
    date_last_assigned: {
        type: Sequelize.DATE,
        allowNull: true
    },
    date_last_unassigned: {
        type: Sequelize.DATE,
        allowNull: true
    },
    date_returned: {
        type: Sequelize.DATE,
        allowNull: true
    },

    date_removed: {
        type: Sequelize.DATE,
        allowNull: true
    },

    order_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },

    group_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },

    reputation_level: {
        type: Sequelize.INTEGER,
        allowNull: true
    },

    reputation_score_volume: {
        type: Sequelize.INTEGER,
        allowNull: true
    },

    reputation_type: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    reputation_category: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    assigned: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },
    routed: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },
    deleted: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },
    vicidid: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },
    viciaccid: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },
    route_to_sip_uri: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },
    route_to_mobile: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },
    createdAt: {
        field: 'created_at',
        type: Sequelize.DATE,
    },
    updatedAt: {
        field: 'updated_at',
        type: Sequelize.DATE,
    },
}, {
        freezeTableName: true,
    });

const Carrier = sequelize.define('carriers', {
    // attributes
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    ip1: {
        type: Sequelize.STRING,
        allowNull: false
    },
    createdAt: {
        field: 'created_at',
        type: Sequelize.DATE,
    },
    updatedAt: {
        field: 'updated_at',
        type: Sequelize.DATE,
    },
}, {
        freezeTableName: true,
    });

const sequelize2 = new Sequelize(process.env.POSTGRES_CONN_STRING2, {
    dialect: 'postgres'
});
sequelize2
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully2.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });


const Dr_gateway = sequelize2.define('dr_gateways', {
    // attributes
    gwid: {
        type: Sequelize.STRING,
        allowNull: false
    },
    type: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    address: {
        type: Sequelize.STRING,
        allowNull: false
    },
    description: {
        type: Sequelize.STRING,
        allowNull: true
    },
    strip: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    socket: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    pri_prefix: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    attrs: {
        type: Sequelize.STRING,
        allowNull: true
    },
    customer_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },

    createdAt: {
        field: 'created_at',
        type: Sequelize.DATE,
    },
    updatedAt: {
        field: 'updated_at',
        type: Sequelize.DATE,
    },
}, {
        // options
    });

const Dr_rules = sequelize2.define('dr_rules', {
    // attributes
    // gwid: {
    //     type: Sequelize.STRING,
    //     allowNull: true
    // },
    groupid: {
        type: Sequelize.STRING,
        allowNull: true
    },
    prefix: {
        type: Sequelize.STRING,
        allowNull: false
    },
    timerec: {
        type: Sequelize.STRING,
        allowNull: true
    },
    priority: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    routeid: {
        type: Sequelize.STRING,
        allowNull: true
    },
    gwlist: {
        type: Sequelize.STRING,
        allowNull: false
    },
    sort_alg: {
        type: Sequelize.STRING,
        allowNull: true
    },
    sort_profile: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    attrs: {
        type: Sequelize.STRING,
        allowNull: false
    },
    description: {
        type: Sequelize.STRING,
        allowNull: true
    },
    createdAt: {
        field: 'created_at',
        type: Sequelize.DATE,
    },
    updatedAt: {
        field: 'updated_at',
        type: Sequelize.DATE,
    },
}, {
        // options
    });


const Dialplan = sequelize2.define('dialplan', {
    dpid: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    pr: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    match_op: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    match_exp: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    match_flags: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    subst_exp: {
        type: Sequelize.STRING,
        allowNull: true
    },
    repl_exp: {
        type: Sequelize.STRING,
        allowNull: true
    },
    timerec: {
        type: Sequelize.STRING,
        allowNull: true
    },
    disabled: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    attrs: {
        type: Sequelize.STRING,
        allowNull: false
    },
}, {
        freezeTableName: true,
        timestamps: false
    });


DID_Group.belongsTo(Customer, { foreignKey: 'customer_id' });
Customer.hasMany(DID_Group, { foreignKey: 'id' });

Number_Inventory.hasMany(History, { foreignKey: 'number' });
History.belongsTo(Number_Inventory, { foreignKey: 'number' });

Number_Inventory.belongsTo(Customer, { foreignKey: 'customer_id' });
Customer.hasMany(Number_Inventory, { foreignKey: 'id' });

Number_Inventory.belongsTo(Carrier, { foreignKey: 'carrier_id' });
Carrier.hasMany(Number_Inventory, { foreignKey: 'id' });

Customer.sync();
DID_Group.sync();
Number_Inventory.sync();
Carrier.sync();



module.exports = {
    User: User,
    Customer: Customer,
    Destination: Destination,
    Areacode: Areacode,
    Dr_gateway: Dr_gateway,
    Dr_rules: Dr_rules,
    Number_Inventory: Number_Inventory,
    DID_Group: DID_Group,
    Carrier: Carrier,
    Dialplan: Dialplan,
    OutboundCarrier: OutboundCarrier,
    History: History
};