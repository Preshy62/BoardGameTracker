import { Router, Request, Response } from 'express';
import { getBanks, verifyBankAccount } from '../utils/paystack';
import { log } from '../vite';

const router = Router();

// Get list of banks
router.get('/banks', async (req: Request, res: Response) => {
  try {
    const banks = await getBanks();
    res.json({
      success: true,
      banks
    });
  } catch (error) {
    log(`Error in /payment/banks: ${error instanceof Error ? error.message : String(error)}`, 'payment');
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch banks'
    });
  }
});

// Verify bank account
router.post('/verify-account', async (req: Request, res: Response) => {
  try {
    const { bankCode, accountNumber } = req.body;

    if (!bankCode || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Bank code and account number are required'
      });
    }

    const accountDetails = await verifyBankAccount(accountNumber, bankCode);
    
    res.json({
      success: true,
      accountName: accountDetails.accountName
    });
  } catch (error) {
    log(`Error in /payment/verify-account: ${error instanceof Error ? error.message : String(error)}`, 'payment');
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to verify account'
    });
  }
});

export default router;