declare module 'paystack-node' {
  export default class Paystack {
    constructor(secretKey: string);
    
    // Transactions
    transaction: {
      initialize: (params: {
        amount: number;
        email: string;
        reference?: string;
        callback_url?: string;
        metadata?: any;
      }) => Promise<any>;
      verify: (reference: string) => Promise<any>;
      list: (params?: any) => Promise<any>;
    };
    
    // Transfers
    transfer: {
      initiate: (params: {
        source: string;
        amount: number;
        recipient: string;
        reason?: string;
        reference?: string;
      }) => Promise<any>;
      list: (params?: any) => Promise<any>;
      verify: (reference: string) => Promise<any>;
    };
    
    // Transfer Recipients
    transferrecipient: {
      create: (params: {
        type: string;
        name: string;
        account_number: string;
        bank_code: string;
        currency?: string;
        description?: string;
        metadata?: any;
      }) => Promise<any>;
    };
    
    // Banks
    bank: {
      list: (params?: any) => Promise<any>;
      resolve: (params: {
        account_number: string;
        bank_code: string;
      }) => Promise<any>;
    };
  }
}