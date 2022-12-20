
import ethers from "ethers";
var crypto = require('crypto');

const sha256 = (input: any) => {
    const hash = crypto.createHash('sha256').update(input);
    return hash;
}

// const DIFFICULTY = 1_000_000_000;
const DIFFICULTY = 10_000_000;

let password = '123123';
let h = sha256(password);
// console.log(h);
let start = new Date().getTime();
for (let i = 0; i < DIFFICULTY; i++) {
    // console.log(h);
    h = sha256(h.digest());
}
let end = new Date().getTime();
console.log(h.digest('hex'));
console.log(`${(end-start)/1000} sec.`);