
import "@ethersproject/shims"
import { Link } from "react-router-dom";

const SECOND = 1;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;

export const NETWORK_ETH = '0x1';
export const NETWORK_MATIC = '0x89';
export const NETWORK_AWS = '0x37fd';

const Intro = () => {


    return <>
        <div className="content">
            <div style={{ float: 'left', width: '500px' }}>
                <h1>The future of wallet protection</h1>
                <h2>A simple yet genius way to protect and manage your assets, 
eliminating the stress involved in private key protection.</h2>
                <img src={process.env.PUBLIC_URL + '/b2e-develop.png'}></img>
                <a className="btn-launch-app btn-launch-app-lg">timeLOCK dApp</a>
            </div>
            <div style={{ float: 'right', width: '600px'}}>
                <div style={{ float: 'left', backgroundImage: 'url(/timelock/new-activity-banner.png)', width: '443px',
    height: '569px' }}>
                </div>
            </div>
            <div className="clear"></div>
        </div>
        <div style={{ backgroundImage: 'url(/bg-break.png)', height: '200px' }}></div>
        <div style={{ backgroundColor: '#fff' }}>
            <div style={{ width: '800px' }}>
                <img
                    style={{ 
                        display: 'inline-block',
                        marginTop: '-24px',
                        float: 'left',
                        width: '570.6px',
                     }}
                    src={process.env.PUBLIC_URL + '/banners/time-shield-vector.png'}></img>
                <img
                    style={{
                        display: 'inline-block',
                        // marginLeft: '-75px',
                        width: '222px',
                        height: '313px',
                        marginLeft: '-152px',
                        marginTop: '116px'
                    }}
                    src={process.env.PUBLIC_URL + '/banners/time-shield.png'}></img>
            </div>
            <div>
                <h2>How timeLOCK works</h2>
                <p>With timelock, in cases where private keys have been lost or stolen, wallet assets may be easily rerouted to safety.</p>
            </div>
        </div>
        {/* </div> */}
        {/* <img style={{float: 'left', height: '86px'}} src={process.env.PUBLIC_URL + '/logo.jpeg'} />
        <div className="clear"></div>
        <h1>timeLOCK
            <span className="tag-version">ALPHA</span>
            <Link className="btn-launch-app" to={'/app'}>Launch App</Link><br />
            <a style={{}} className="btn-whitepaper" href={process.env.PUBLIC_URL + '/whitepaper-timelock.pdf'}>White Paper</a>
        </h1>
        <h2 style={{marginBottom: '69px'}}>Prevent wallet theft using two-factor transaction protection</h2>
        <div className="tooltip-fees">
            <span className="tooltip-fees-value">0.6%</span><br />
            <span>transaction fee</span>
        </div>
        <Link className="btn-launch-app-mobile" to={'/app'}>Launch App</Link><br />
        <a style={{}} className="btn-whitepaper-mobile" href={process.env.PUBLIC_URL + '/whitepaper-timelock.pdf'}>White Paper</a>
        <div className="box-supported-intro">
            Supported platforms:
            <div style={{

            }}>
                <img src={process.env.PUBLIC_URL + '/supported/metamask.png'} /> <br />
                <img src={process.env.PUBLIC_URL + '/supported/eth.png'} /> <br />
                <img src={process.env.PUBLIC_URL + '/supported/polygon.png'} /> <br />
                <img src={process.env.PUBLIC_URL + '/supported/wbitcoin.png'} /> <br />
                <img src={process.env.PUBLIC_URL + '/supported/usdc.png'} /> <br />
                <img src={process.env.PUBLIC_URL + '/supported/usdt.png'} /> 
                <span className="clear"></span>
            </div>
        </div>

        <div className="info-content">
            <h4>How it works</h4>
            <p>
                Using our contract wallets,
                transactions may only be completed
                after the user makes two withdrawal
                requests, seperated by a customized
                time interval.
            </p>
        </div>
        <div className="info-content ">
            <h4>How does this mechanism actually protect your wallet?</h4>
            <p>
                An <i>attacker</i>, having aquired your
                key, may complete the first 
                withdrawal request. However, they
                must now wait the configured time
                interval in order to complete the
                second stage of the transaction.
            </p>
            <p>
            The <i>owner</i> on the other hand, would
have already set up the first request
to a backup wallet and may now
simply complete the transaction with
one click. The time interval still
exists, but would end before the
attacker’s.
            </p>
            <p>
            The time interval essentially give
the <i>owner</i> a time advantage to
detect a foreign request and then
act on it to save the contents of
the wallet
            </p>
        </div>
        <img style={{float: 'right', height: '86px'}} src={process.env.PUBLIC_URL + '/logo-white.jpeg'} />
        <div className="clear"></div> */}
    </>;
}
export default Intro;