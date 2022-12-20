"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = exports.Contact = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const config_1 = require("../config");
exports.sequelize = new sequelize_1.Sequelize(config_1.config.POSTGRES_URI);
exports.Contact = exports.sequelize.define("contact", {
    email: {
        type: sequelize_1.DataTypes.STRING,
    },
    message: {
        type: sequelize_1.DataTypes.STRING,
    },
});
exports.Subscription = exports.sequelize.define("subscription", {
    email: {
        type: sequelize_1.DataTypes.STRING,
    },
});
