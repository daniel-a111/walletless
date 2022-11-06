import express from 'express';
import controller from './controller'

const router = express.Router();
router.get('/api/reciept', controller.receipt);
router.get('/api/tx', controller.tx);
router.post('/api/signup', controller.signup);
router.post('/api/init', controller.initAccount);
router.post('/api/transact/preset', controller.transactPreset);
router.post('/api/transact/expose', controller.expose);
router.post('/api/transact/expose/cont', controller.exposeCont);
router.get('/api/account', controller.getAccount);
router.get('/api/account/RGF', controller.manualRGFProviderView);
router.post('/api/fees-account', controller.getGasFeeAccount);

router.get('/api/tx/status/singup', controller.signupTxStatus);
router.get('/api/tx/status/init', controller.initTxStatus);
router.get('/api/gas', controller.gasMarketView);

export = router;
