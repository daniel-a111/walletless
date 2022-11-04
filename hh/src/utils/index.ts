import crypto from 'crypto';

export const sha256 = (str: string) => {
    return crypto.createHash('sha256').update(str||'')
}

const keccak256 = (str: string) => {
    return crypto.createHash('keccak256').update(str||'').digest('hex')
}

export const netedHash = (password: string, depth: number) => {
    let cert: any = password;
    for (let i = 0; i < depth; i++) {
        cert = sha256(cert?.digest?cert?.digest():cert);
    }
    return cert;
}

const passwordsToCertsAndNonce = (password1: string, password2: string) => {
    let cert1: any = password1;
    let cert2: any = password2;

    for (let i = 0; i < 4000; i++) {
        cert1 = sha256(cert1?.digest?cert1?.digest():cert1);
        cert2 = sha256(cert2?.digest?cert2?.digest():cert2);
    }

    return { cert1, cert2, nonce1Size: 4000, nonce2Size: 4000 }
}


export const passwordToCertAndNonce = (password: string) => {
    let cert: any = sha256(password);
    let nonceSize = 4000;
    for (let i = 0; i < nonceSize; i++) {
        cert = sha256(cert?.digest?cert?.digest():cert);
    }
    return { cert, nonceSize }
}


export const passwordAndAddressToCertAndNonce = (password: string, address: string) => {
    let cert: any = sha256(`${password}${address}`);//.digest('hex');
    // console.log(`${cert}`);
    let nonceSize = 4000;
    for (let i = 0; i < nonceSize; i++) {
        cert = sha256(cert.digest());//.digest('hex');
    }
    cert = '0x'+cert.digest('hex');
    // console.log(`${cert.digest('hex')}`);
    return { cert, nonceSize }
}
  