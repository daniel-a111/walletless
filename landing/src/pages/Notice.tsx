import { createRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as backend from '../backend';
import { useNavigate } from 'react-router-dom';
import '../scss/notice.scss'
const Notice = () => {
    
    const [isSubmitReady, setSubmitReady] = useState<boolean>(false);
    const emailRef = createRef<HTMLInputElement>();

    const [success, setSuccess] = useState<boolean>();
    const [failed, setFailed] = useState<boolean>();

    const onClickSubmit = async () => {
        try {
            let result = await backend.subscribe(emailRef.current?.value||'');
            setSuccess(true);
        } catch {
            setFailed(true);
        }
    }


    const onKeyUp = () => {
        if (emailRef.current?.value) {
            setSubmitReady(true);
        } else {
            setSubmitReady(false);
        }
    }

    const onClickTakeSurvey = () => {
        window.open('https://docs.google.com/forms/d/e/1FAIpQLSfbVOFWHq4UhzbqIabYL_vclHtoOgK_c-WJd1FUNLmCK5Rd_w/viewform');
    }

    return <div className="notice">
        <Link className='back-icon' to={'/'}></Link>
        <div className='bell-big-icon'></div>
        {
            success &&
            <>
                <p className='receive-email-description'>Thank you</p>
            </>
        }
        {
            !success &&
            <>
                {failed &&
                    <>
                        Failed, please try again
                    </>
                }
                <p className='receive-email-description'>Receive a launch update email notification</p>
                <input onKeyUp={onKeyUp} placeholder='Your email address' type={'text'} />
                <button onClick={onClickSubmit} className='btn-primary' disabled={isSubmitReady}>Okay</button>
                <div className='privacy-email-description'>
                    <i className='privacy-email-icon' />
                    Your email address will never be used for any other purpose.
                </div>
            </>
        }
    </div>;
}
export default Notice;