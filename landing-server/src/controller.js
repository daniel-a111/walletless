"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscription = exports.contact = void 0;
const models_1 = require("./models");
const contact = async (req, res, next) => {
    let { email, message } = req.body;
    let contact = models_1.Contact.build({ email, message });
    await contact.save();
    return res.status(200).json({
        success: true,
        message: 'Contact recorded'
    });
};
exports.contact = contact;
const subscription = async (req, res, next) => {
    let { email } = req.body;
    let contact = models_1.Subscription.build({ email });
    await contact.save();
    return res.status(200).json({
        success: true,
        message: 'Contact recorded'
    });
};
exports.subscription = subscription;
