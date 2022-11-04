import { BigNumber, ethers } from "ethers";
import moment from "moment";
import sha256 from 'crypto-js/sha256';

export const copyToClipboard = (e: any) => {
    /* Copy the text inside the text field */
    if (navigator.clipboard) {
        navigator.clipboard.writeText(e.target.getAttribute('data-copy'));
    } else {
        let input = document.createElement('input');
        input.value = e.target.getAttribute('data-copy');
        e.target.parentNode.appendChild(input);
        input.focus();
        input.select();
        document.execCommand('copy');
        input.remove();
    }
    let text = e.target.innerText;
    e.target.innerText = text + ' copied!';
    setTimeout(() => {
            e.target.innerText = text;
    }, 1000);
 }

const FORMAT_LENGTH = 10;
const FORMAT_START = 8;
const FORMAT_ENDS = 6;
 
export const formatAddress = (address: string) => {
    if (!address) return address;

    if (address.startsWith('0x')) {
        address = address.substring(2);
    }

    if (address.length <= FORMAT_LENGTH) {
        return address;
    }

    return `${address.substring(0, FORMAT_START)}...${address.substring(address.length - FORMAT_ENDS)}`;
}
 
export const formatDate = (timestamp: number) => {
    return moment(new Date(timestamp * 1000)).fromNow()
}

export const formatAmount = (amount: string, decimals: number) => {
    try {
        let a = BigNumber.from(amount);
        return ethers.utils.formatUnits(a, decimals);            
    } catch {
        return '';
    }
}
const BALANCE_FORMAT_LENGTH = 10;

export const formatBalance = (balance: BigNumber) => {
    if (!balance) return '0.0';

    let balanceStr = ethers.utils.formatEther(balance);

    if (balanceStr.length <= BALANCE_FORMAT_LENGTH) {
        return balanceStr;
    }

    let floatPointPos = balanceStr.indexOf('.');
    if (floatPointPos < balanceStr.length - 3) {
        balanceStr = balanceStr.substring(0, floatPointPos + 2);
    }

    let fb = parseFloat(balanceStr);
    const K = 1000;
    const M = 1000 * K;
    const B = 1000 * M;
    const T = 1000 * B;
    if (fb >= T) {
        fb /= T;
        return `${fb.toFixed(2)}T`;
    }
    if (fb >= B) {
        fb /= B;
        return `${fb.toFixed(2)}B`;
    }
    if (fb >= M) {
        fb /= M;
        return `${fb.toFixed(2)}M`;
    }
    if (fb >= K) {
        fb /= K;
        return `${fb.toFixed(2)}K`;
    }
    return `${balance}`;
}

export const formatBalancePrimitive = (fb: number) => {
    const K = 1000;
    const M = 1000 * K;
    const B = 1000 * M;
    const T = 1000 * B;
    if (fb >= T) {
        fb /= T;
        return `${fb.toFixed(2)}T`;
    }
    if (fb >= B) {
        fb /= B;
        return `${fb.toFixed(2)}B`;
    }
    if (fb >= M) {
        fb /= M;
        return `${fb.toFixed(2)}M`;
    }
    if (fb >= K) {
        fb /= K;
        return `${fb.toFixed(2)}K`;
    }

    return fb.toFixed(2);
}

export const secToTime = (timestamp: number) => {
    return `${moment(new Date(timestamp * 1000)).from(new Date(0))}`.substring(3);
}

export const passwordsToCertsAndNonceAndAddress = (password: string, address: string) => {
    let cert: any = sha256(`${password}${address}`);
    for (let i = 0; i < 4000; i++) {
        cert = sha256(cert);
    }
    return { cert: '0x'+cert.toString(), nonceSize: 4000 }
}

export const passwordsAndAddressAndCertAndNonceToProof = (password: string, address: string, cert: string, nonce: number, nonceSize: number) => {
    let p1: any = sha256(`${password}${address}`);
    for (let i = nonce+1; i < nonceSize; i++) {
        p1 = sha256(p1);
    }
    let h1 = '0x'+sha256(p1).toString();
    if (h1 === cert) {
        return p1.toString();
    }
    return undefined;
}
