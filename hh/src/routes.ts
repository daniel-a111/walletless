import express from 'express';
import * as controllers from './controllers'

const router = express.Router();

router.post('/api/auth/login', controllers.provider.login);
router.get('/api/account', controllers.network.getAccount);
router.get('/api/account/state', controllers.network.getAccountState);
router.post('/api/account/state', controllers.network.getAccountState);
router.get('/api/reciept', controllers.network.receipt);
router.get('/api/tx', controllers.network.tx);
router.get('/api/account/RGF', controllers.network.manualRGFProviderView);

router.post('/api/providers', controllers.provider.createGasFeeAccount);
router.post('/api/fees-account/create', controllers.provider.createGasFeeAccount);
router.post('/api/fees-account', controllers.provider.getGasFeeAccount);
// router.post('/api/signup', controllers.provider.signup);
router.post('/api/init', controllers.provider.initAccount);
router.post('/api/transact/preset', controllers.provider.transactPreset);
router.post('/api/transact/expose', controllers.provider.expose);
router.post('/api/transact/expose/cont', controllers.provider.exposeCont);
// router.get('/api/tx/status/singup', controllers.provider.signupTxStatus);
router.get('/api/tx/status/init', controllers.provider.initTxStatus);
router.get('/api/gas', controllers.provider.gasMarketView);

router.get('/api/coins', controllers.provider.getCoins);
router.get('/api/address/history', controllers.provider.history);
router.get('/api/address/activities', controllers.provider.activities);

router.get('/api/address/balances', controllers.provider.getCoins)
export = router;
