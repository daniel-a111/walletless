import { createRef, useState } from "react";
import { loadAccountAddress } from "../account/storage";
const PaymentForm = () => {
    const [accountAddress, setAccountAddress] = useState<string|undefined>(loadAccountAddress());
    const topupRef = createRef<HTMLInputElement>();
    const [paymentGateway, setPaymentGateway] = useState<string>();
    const onClickCreatePaymentGateway = async () => {
        setPaymentGateway(`${process.env.PUBLIC_URL}/#/app/gateway?address=${accountAddress}&amount=${topupRef.current?.value||'0.0'}`);
    }
    return <>
        topup <input type={'number'} ref={topupRef} />
        <button onClick={onClickCreatePaymentGateway}>create payment gateway</button>

        {
            paymentGateway &&
            <>
                <br /><br />
                <input type={'text'} value={paymentGateway} />
                <a href={paymentGateway}>go to</a>
            </>
        }
    </>;
}
export default PaymentForm;