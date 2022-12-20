import {Sequelize, DataTypes} from "sequelize";
import {config} from "../config";

export const sequelize = new Sequelize(config.POSTGRES_URI);

export const Contact = sequelize.define("contact", {
    email: {
        type: DataTypes.STRING,
    },
    message: {
        type: DataTypes.STRING,
    },
});

export const Subscription = sequelize.define("subscription", {
    email: {
        type: DataTypes.STRING,
    },
});
