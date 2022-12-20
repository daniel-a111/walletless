"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordAndAddressToCertAndNonce = exports.passwordToCertAndNonce = exports.netedHash = exports.sha256 = void 0;
const crypto_1 = __importDefault(require("crypto"));
const sha256 = (str) => {
    return crypto_1.default.createHash('sha256').update(str || '');
};
exports.sha256 = sha256;
const keccak256 = (str) => {
    return crypto_1.default.createHash('keccak256').update(str || '').digest('hex');
};
const netedHash = (password, depth) => {
    let cert = password;
    for (let i = 0; i < depth; i++) {
        cert = (0, exports.sha256)(cert?.digest ? cert?.digest() : cert);
    }
    return cert;
};
exports.netedHash = netedHash;
const passwordsToCertsAndNonce = (password1, password2) => {
    let cert1 = password1;
    let cert2 = password2;
    for (let i = 0; i < 4000; i++) {
        cert1 = (0, exports.sha256)(cert1?.digest ? cert1?.digest() : cert1);
        cert2 = (0, exports.sha256)(cert2?.digest ? cert2?.digest() : cert2);
    }
    return { cert1, cert2, nonce1Size: 4000, nonce2Size: 4000 };
};
const passwordToCertAndNonce = (password) => {
    let cert = (0, exports.sha256)(password);
    let nonceSize = 4000;
    for (let i = 0; i < nonceSize; i++) {
        cert = (0, exports.sha256)(cert?.digest ? cert?.digest() : cert);
    }
    return { cert, nonceSize };
};
exports.passwordToCertAndNonce = passwordToCertAndNonce;
const passwordAndAddressToCertAndNonce = (password, address) => {
    let cert = (0, exports.sha256)(`${password}${address}`); //.digest('hex');
    // console.log(`${cert}`);
    let nonceSize = 4000;
    for (let i = 0; i < nonceSize; i++) {
        cert = (0, exports.sha256)(cert.digest()); //.digest('hex');
    }
    cert = '0x' + cert.digest('hex');
    // console.log(`${cert.digest('hex')}`);
    return { cert, nonceSize };
};
exports.passwordAndAddressToCertAndNonce = passwordAndAddressToCertAndNonce;
