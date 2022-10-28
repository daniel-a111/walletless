import {Sequelize, DataTypes} from "sequelize";
import {config} from "../config";

export const sequelize = new Sequelize(config.POSTGRES_URI);

export const FeesAccount = sequelize.define("fees_account", {
    address: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    PK: {
        type: DataTypes.STRING,
    },
    walletAddress: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    }
});


// // export const Settings = sequelize.define("settings", {
// //     accountCounter: DataTypes.INTEGER
// // });

// export const Account = sequelize.define("account", {
//     address: {
//         type: DataTypes.STRING,
//         primaryKey: true
//     },
//     balance: { 
//         type: DataTypes.REAL,
//         defaultValue: 0
//     },
//     timelock: DataTypes.INTEGER,
//     cert: DataTypes.STRING,
//     nonceSize: DataTypes.INTEGER,
//     nonce: DataTypes.INTEGER,
//     rgfProvider: DataTypes.STRING,
//     activatedAt: DataTypes.DATE
// });

// export const Tx = sequelize.define("tx", {
//     from: DataTypes.STRING,
//     to: DataTypes.STRING,
//     hash: {
//         type: DataTypes.STRING,
//         unique: true
//     },
//     value: DataTypes.REAL,
// });

// export const Gateway = sequelize.define("gateway", {
//     from: {
//         type: DataTypes.STRING,
//         primaryKey: true
//     },
//     to: {
//         type: DataTypes.STRING,
//         primaryKey: true
//     },
//     allowance: DataTypes.REAL,
//     approval: {
//         type: DataTypes.REAL,
//         defaultValue: 0
//     },
// });

// export const PassGateway = sequelize.define("password", {
//     address: DataTypes.STRING,
//     certs1: DataTypes.ARRAY(DataTypes.STRING),
//     certs2: DataTypes.ARRAY(DataTypes.STRING)
// });

// export const CoinTransferApproval = sequelize.define("transfer_approvals", {
//     from: DataTypes.STRING,
//     to: DataTypes.STRING,
//     amount: DataTypes.REAL,
//     activateAt: DataTypes.DATE,
//     soft: DataTypes.BOOLEAN
// });

// export const PasswordPairApproval = sequelize.define("password_pairs", {
//     address: DataTypes.STRING,
//     cert1: DataTypes.STRING,
//     nonce1Size: DataTypes.INTEGER,
//     cert2: DataTypes.STRING,
//     nonce2Size: DataTypes.INTEGER,
//     activateAt: DataTypes.DATE,
//     soft: DataTypes.BOOLEAN,
//     cancel: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false
//     }
// });


// let synced = false;
// export const getSequelized = async () => {

//     if (synced) {
        
//     }
// }