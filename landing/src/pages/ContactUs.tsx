import { createRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import * as backend from "../backend";
import '../scss/contact-us.scss'
const ContactUs = () => {

    const [isSubmitReady, setSubmitReady] = useState<boolean>(false);
    const emailRef = createRef<HTMLInputElement>();
    const messageRef = createRef<HTMLTextAreaElement>();

    const [success, setSuccess] = useState<boolean>();
    const [failed, setFailed] = useState<boolean>();

    const onClickSubmit = async () => {
        try {
            let result = await backend.contact(emailRef.current?.value||'', messageRef.current?.value||'');
            setSuccess(true);
        } catch {
            setFailed(true);
        }
    }

    const onKeyUp = () => {
        if (emailRef.current?.value && messageRef.current?.value) {
            setSubmitReady(true);
        } else {
            setSubmitReady(false);
        }
    }

    return <div className="contact-us">
        <div className='nav'>
            <Link className='back-icon' to={'/'}></Link>
            <span className='logo'>Walletless</span>
            <span className='b2e-powered'>By <i className='b2e-logo' /></span>
        </div>
        {
            success &&
            <p className='receive-email-description'>
                Thank you
            </p>
        }
        {
            !success &&
            <>
                {failed &&
                    <>
                        Failed, please try again
                    </>
                }
                <p className='receive-email-description'>
                    <i className='chat-icon-dark' />
                    Leave us a message
                </p>
                <input onKeyUp={onKeyUp} ref={emailRef} placeholder='Your email address' type={'text'} />
                <textarea onKeyUp={onKeyUp} ref={messageRef} placeholder='Message'></textarea>
                <button onClick={onClickSubmit} className='btn-primary' disabled={!isSubmitReady}>Send</button>
                <div className='social'>
                    <Link className='twitter-icon' to={''} target={'_blank'} />
                    <Link className='email-icon' to={''} target={'_blank'} />
                    <Link className='telegram-icon' to={''} target={'_blank'} />
                </div>
            </>
        }
    </div>;
}
export default ContactUs;