import { sha256 } from "../../utils";
import { PreImageAccess } from "./types";
export * as types from './types';
import {ethers,} from 'hardhat';
import {BigNumber} from 'ethers';

export function preImageChain(a: string, size: number) {
    let hash: any = ethers.utils.sha256('0x'+sha256(`${a}`).digest('hex'));
    for (let i = 0; i < size; i++) {
        hash = ethers.utils.sha256(hash);
    }
    return hash;
}

export function authPreImageChain(a: string, chain: string, difficulty: number): boolean {
    if (!chain) throw "image must be string";
    let hash: any = ethers.utils.sha256('0x'+sha256(`${a}`).digest('hex'));
    for (let i = 0; i < difficulty; i++) {
        hash = ethers.utils.sha256(hash);
        if (hash === chain) {
            return true;
        }
    }
    return false;
}

export function preImageAccess(account: string, password: string, cert: string, difficulty: number): PreImageAccess|undefined{
    let hash: any = ethers.utils.sha256('0x'+sha256(`${account}${password}`).digest('hex'));
    let stack = [];
    for (let i = -2; i < difficulty; i++) {
        hash = ethers.utils.sha256(hash);
        if (hash === cert) {
            return {
                cert: cert.toString(), 
                proofProof: stack.pop().toString(),
                proof: stack.pop().toString()
            };
        }

        stack.push(hash);
        if (stack.length>2) {
            stack.splice(0, 1);
        }
    }
}

export function passwordToProof(account: string, password: string, cert: string, difficulty: number, isViewProof: boolean) {
    let hash: any = ethers.utils.sha256(`${account}${password}`);
    let prevHash: string|undefined;
    let prevPrevHash: string|undefined;
    for (let i = 0; i < difficulty; i++) {
        hash = ethers.utils.sha256(hash);
        if (hash === cert) {
            return isViewProof ? prevHash : prevPrevHash;
        }
        prevPrevHash = prevHash;
        prevHash = hash;
    }
}

export function presetCert(to: string, value: BigNumber, data: string, proof: string) {
    let valueHex = value.toHexString().substring(2);
    for (let i = valueHex.length; i < 64; i++) {
        valueHex = '0'+valueHex;
    }
    data = data.substring(2);
    proof = proof.substring(2);

    let preimage = to+valueHex+data+proof;
    return ethers.utils.sha256(`${preimage}`);
}
