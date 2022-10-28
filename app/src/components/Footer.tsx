
const Footer = () => {

    return <footer style={{
        marginTop: '40px', borderTop: '2px solid', padding: '60px 0 60px 0',
        boxShadow: '-10px -6px 26px rgb(89 70 156 / 30%)',
        }}>
        <div style={{width: '800px', margin: '0 auto'}}>
            <img style={{float: 'right', height: '86px'}} src={process.env.PUBLIC_URL + '/logo-white.jpeg'} />
            <div style={{float: 'left'}}>
                Social & Contacts<br />
                <a style={{marginTop: '10px', fontSize: '10px', lineHeight: '24px', display: 'inline-block', width: '100px'}}><img style={{float: 'left', marginTop: '2px', maxWidth: '20px', maxHeight: '20px'}} src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Twitter-logo.svg/292px-Twitter-logo.svg.png" /> Twitter </a><br />
                <a style={{marginTop: '10px', fontSize: '10px', lineHeight: '24px', display: 'inline-block', width: '100px'}}><img style={{float: 'left', marginTop: '2px', maxWidth: '20px', maxHeight: '20px'}} src="data:image/png;base64,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" /> Telegram</a><br />
                <a style={{marginTop: '10px', fontSize: '10px', lineHeight: '24px', display: 'inline-block', width: '100px'}}><img style={{float: 'left', marginTop: '2px', maxWidth: '20px', maxHeight: '20px'}} src="https://cdn-icons-png.flaticon.com/512/2111/2111370.png" /> Discord</a><br />
                <a style={{marginTop: '10px', fontSize: '10px', lineHeight: '24px', display: 'inline-block', width: '100px'}}><img style={{float: 'left', marginTop: '2px', maxWidth: '20px', maxHeight: '20px'}} src="https://icon-library.com/images/email-icon-for-website/email-icon-for-website-14.jpg" />E-Mail</a>
            </div>
            <div style={{ float: 'left', marginLeft: '95px' }}>
                Subscribe now
                <div style={{marginTop: '10px', marginBottom: '10px'}}>
                    <label><span style={{display: 'inline-block', textAlign: 'right', paddingRight: '10px', width: '100px', fontSize: '14px'}}>Name</span>
                    <input type={'text'} style={{width: '200px', height: '30px', fontSize: '14px'}} /></label><br />
                    <label><span style={{display: 'inline-block', textAlign: 'right', paddingRight: '10px', width: '100px', fontSize: '14px'}}>Email</span>
                    <input type={'text'} style={{width: '200px', height: '30px', fontSize: '14px'}} /></label>
                </div>
                <div style={{textAlign: 'center'}}>
                    <label style={{fontSize: '10px'}}><input type={'checkbox'} style={{marginTop: '-10px', display: 'inline-block'}} /><span>dApp Tester</span></label>
                    <label style={{fontSize: '10px'}}><input type={'checkbox'} style={{marginTop: '-10px', display: 'inline-block'}} /><span>Updates</span></label><br />
                </div>
                <button style={{
                        float: 'right',
                        width: '73px',
                        marginTop: '-21px',
                        fontSize: '11px',
                        padding: '4px 10px',
                        background: '#5e6eb3',
                        border: 'solid 1px',
                        borderRadius: '10px',
                        fontWeight: '100',
                        color: '#fff',
                }}>Subscribe</button>
            </div>
            <div className="clear"></div>
        </div>
    </footer>;
}
export default Footer;