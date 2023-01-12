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

export const GasStop = sequelize.define("logs_gas_stop", {
    logIndex: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    txHash: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    blockNumber: {
        type: DataTypes.INTEGER,
    },
    account: {
        type: DataTypes.STRING,
        // primaryKey: true
    },
    time: {
        type: DataTypes.DATE
    },
});

export const ResetCert = sequelize.define("logs_reset_cert", {
    logIndex: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    txHash: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    blockNumber: {
        type: DataTypes.INTEGER,
    },
    account: {
        type: DataTypes.STRING,
        // primaryKey: true
    },
    time: {
        type: DataTypes.DATE
    },
    certCounter: {
        type: DataTypes.INTEGER
    },
    oldCert: {
        type: DataTypes.INTEGER
    },
    newCert: {
        type: DataTypes.INTEGER
    }
});

export const Skip = sequelize.define("logs_skip", {
    logIndex: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    txHash: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    blockNumber: {
        type: DataTypes.INTEGER,
    },
    account: {
        type: DataTypes.STRING,
        // primaryKey: true
    },
    time: {
        type: DataTypes.DATE
    },
    cert: {
        type: DataTypes.STRING(64)
    }
});

export const NoneMatches = sequelize.define("logs_non_matches", {
    logIndex: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    txHash: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    blockNumber: {
        type: DataTypes.INTEGER,
    },
    account: {
        type: DataTypes.STRING,
        // primaryKey: true
    },
    time: {
        type: DataTypes.DATE
    },
    cert: {
        type: DataTypes.STRING(64)
    }
});



export const TxDone = sequelize.define("logs_tx_done", {
    logIndex: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    txHash: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    blockNumber: {
        type: DataTypes.INTEGER,
    },
    account: {
        type: DataTypes.STRING,
        // primaryKey: true
    },
    time: {
        type: DataTypes.DATE
    },
    nonce: {
        type: DataTypes.STRING(66),
        // primaryKey: true
    },
    to: {
        type: DataTypes.STRING(42)
    },
    from: {
        type: DataTypes.STRING(42)
    },
    value: {
        type: DataTypes.STRING
    },
    data: {
        type: DataTypes.STRING
    }
});


export const TxReverted = sequelize.define("logs_tx_revert", {
    logIndex: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    txHash: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    blockNumber: {
        type: DataTypes.INTEGER,
    },
    account: {
        type: DataTypes.STRING,
        // primaryKey: true
    },
    time: {
        type: DataTypes.DATE
    },
    cert: {
        type: DataTypes.STRING(66)
    },
    to: {
        type: DataTypes.STRING(42)
    },
    from: {
        type: DataTypes.STRING(42)
    },
    value: {
        type: DataTypes.STRING
    },
    data: {
        type: DataTypes.STRING
    },
    message: {
        type: DataTypes.STRING
    }
});

export const logEvents = (name: string, data: any) => {
    return {
        'Skip': Skip.build(data),
        'NoneMatches': NoneMatches.build(data),
        'TxDone': TxDone.build(data),
        'TxReverted': TxReverted.build(data),
        'GasStop': GasStop.build(data),
        'ResetCert': ResetCert.build(data)
    }[name];
}