import express from 'express';
import controller from './controller'

const router = express.Router();
router.get('/api/reciept', controller.reciept);
router.post('/api/signup', controller.signup);
router.post('/api/init', controller.initAccount);
router.post('/api/transact/preset', controller.transactPreset);
router.post('/api/transact/expose', controller.expose);
router.post('/api/transact', controller.transact);
router.get('/api/account', controller.getAccount);
router.post('/api/fees-account', controller.getGasFeeAccount);

router.get('/api/tx/status/singup', controller.signupTxStatus);
router.get('/api/tx/status/init', controller.initTxStatus);

export = router;
