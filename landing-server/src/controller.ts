import { Request, Response, NextFunction } from 'express';
import { Contact, Subscription } from './models';


export const contact = async (req: Request, res: Response, next: NextFunction) => {
    let { email, message } = req.body;
    let contact = Contact.build({email, message});
    await contact.save();
    return res.status(200).json({
        success: true,
        message: 'Contact recorded'
    });
}

export const subscription = async (req: Request, res: Response, next: NextFunction) => {
    let { email } = req.body;
    let contact = Subscription.build({email});
    await contact.save();
    return res.status(200).json({
        success: true,
        message: 'Contact recorded'
    });
}
