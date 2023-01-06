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
    SCAA: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    },
    taken: {
        type: DataTypes.BOOLEAN
    }
});

export const SCAA = sequelize.define("SCAAs", {
    address: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    deployTime: {
        type: DataTypes.DATE
    }
});


export const SyncStatus = sequelize.define("sync_status", {
    blockNumber: {
        type: DataTypes.INTEGER
    }
});

export const CoinTransfer = sequelize.define("coin_transfers", {
    txHash: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    account: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    value: {
        type: DataTypes.STRING
    },
    coinAddress: {
        type: DataTypes.STRING,
    },
    symbol: {
        type: DataTypes.STRING
    },
    time: {
        type: DataTypes.DATE
    }
});
