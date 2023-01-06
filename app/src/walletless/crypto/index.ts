import sha256 from "crypto-js/sha256";
import { PreImageAccess } from "./types";

export function preImageChain(a: string, size: number) {
    let hash: any = sha256(`${a}`);
    for (let i = 0; i < size; i++) {
        hash = sha256(hash);
    }
    return '0x'+hash.toString()
}

export function authPreImageChain(password: string, chain: string, difficulty: number): boolean {
    if (!chain) throw "image must be string";
    let hash: any = sha256(`${hexStringToByteArray(password)}`);
    for (let i = 0; i < difficulty; i++) {
        hash = sha256(hash);
        if (hash === chain) {
            return true;
        }
    }
    return false;
}

export function preImageAccess(account: string, password: string, cert: string, difficulty: number): PreImageAccess|undefined{
    console.log({ difficulty })
    let hash: any = sha256(`${account}${password}`);
    let proof: any = "";
    let proofProof: any = "";
    // let certInBytes = hexStringToByteArray(cert);
    let stack = [];
    console.log({difficulty})
    
    for (let i = -2; i < difficulty; i++) {
        // console.log(i);
        hash = sha256(hash);
        // console.log({hash})
        // console.log(hash.toString())
        if ('0x'+hash.toString() === cert) {
            return {
                cert: cert.toString(), 
                proofProof: stack.pop().toString(),
                proof: stack.pop().toString()
            };
        }

        stack.push(hash);
        if (stack.length>2) {
            // console.log(stack)
            stack.splice(0, 1);
        }
        // proof = proofProof;
        // proofProof = hash.toString();
    }
}

export function passwordToProof(account: string, password: string, cert: string, difficulty: number, isViewProof: boolean) {
    let hash: any = sha256(`${account}${password}`);
    let prevHash: string|undefined;
    let prevPrevHash: string|undefined;
    for (let i = 0; i < difficulty; i++) {
        hash = sha256(hash);
        if (hash === cert) {
            return isViewProof ? prevHash : prevPrevHash;
        }
        prevPrevHash = prevHash;
        prevHash = hash;
    }
}

function hexStringToByteArray(hexString: string) {
    if (hexString.length % 2 !== 0) {
        throw "Must have an even number of hex digits to convert to bytes";
    }/* w w w.  jav  a2 s .  c o  m*/
    var numBytes = hexString.length / 2;
    var byteArray = new Uint8Array(numBytes);
    for (var i=0; i<numBytes; i++) {
        byteArray[i] = parseInt(hexString.substr(i*2, 2), 16);
    }
    return byteArray;
}
