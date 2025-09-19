import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "../../../../lib/auth-utils";
import { supabase } from "../../../../lib/supabase";
import { v4 as uuidv4 } from 'uuid';

// Process a withdrawal
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      amount, 
      paymentMethod, 
      currency = 'USD',
      withdrawalData // Contains method-specific data (PayPal email, crypto address, etc.)
    } = await request.json();

    if (!amount || !paymentMethod || amount <= 0) {
      return NextResponse.json({ 
        error: 'Amount and payment method are required' 
      }, { status: 400 });
    }

    // Get user's current balance
    const { data: userBalance, error: balanceError } = await supabase
      .from('user_balances')
      .select('*')
      .eq('user_id', session.user_id)
      .single();

    if (balanceError || !userBalance) {
      return NextResponse.json({ error: 'Unable to fetch balance' }, { status: 500 });
    }

    const availableBalance = userBalance.coins || 0; // Convert coins to USD (1:1 for simplicity)
    
    if (amount > availableBalance) {
      return NextResponse.json({ 
        error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}` 
      }, { status: 400 });
    }

    // Check withdrawal limits
    const dailyLimit = 2500;
    const today = new Date().toISOString().split('T')[0];
    
    const { data: todayWithdrawals } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', session.user_id)
      .eq('type', 'withdrawal')
      .in('status', ['completed', 'processing'])
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    const todayTotal = todayWithdrawals?.reduce((sum, t) => sum + t.amount, 0) || 0;
    
    if (todayTotal + amount > dailyLimit) {
      return NextResponse.json({ 
        error: `Daily withdrawal limit of $${dailyLimit} would be exceeded` 
      }, { status: 400 });
    }

    // Check minimum withdrawal amounts
    const minimums = {
      paypal: 10,
      bitcoin: 10,
      ethereum: 5,
      bank_transfer: 50
    };

    if (amount < (minimums[paymentMethod as keyof typeof minimums] || 10)) {
      return NextResponse.json({ 
        error: `Minimum withdrawal for ${paymentMethod} is $${minimums[paymentMethod as keyof typeof minimums]}` 
      }, { status: 400 });
    }

    // Calculate fees
    const fee = calculateWithdrawalFee(amount, paymentMethod);
    const netAmount = amount - fee;

    if (netAmount <= 0) {
      return NextResponse.json({ 
        error: 'Amount too small after fees' 
      }, { status: 400 });
    }

    // Create transaction record
    const transactionId = uuidv4();
    
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        id: transactionId,
        user_id: session.user_id,
        type: 'withdrawal',
        amount,
        currency,
        fee,
        net_amount: netAmount,
        payment_method: paymentMethod,
        status: 'pending',
        withdrawal_data: withdrawalData ? JSON.stringify(withdrawalData) : null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Failed to create transaction:', transactionError);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    // Deduct amount from user balance immediately (hold it)
    const { error: balanceUpdateError } = await supabase
      .from('user_balances')
      .update({
        coins: availableBalance - amount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', session.user_id);

    if (balanceUpdateError) {
      console.error('Failed to update balance:', balanceUpdateError);
      return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 });
    }

    // Process withdrawal based on method
    try {
      let withdrawalResult;
      
      switch (paymentMethod) {
        case 'paypal':
          withdrawalResult = await processPayPalWithdrawal(transactionId, netAmount, withdrawalData);
          break;
        case 'bitcoin':
        case 'ethereum':
          withdrawalResult = await processCryptoWithdrawal(transactionId, netAmount, paymentMethod, withdrawalData);
          break;
        case 'bank_transfer':
          withdrawalResult = await processBankWithdrawal(transactionId, netAmount, withdrawalData);
          break;
        default:
          throw new Error('Withdrawal method not implemented');
      }

      // Update transaction with processing result
      await supabase
        .from('transactions')
        .update({
          status: withdrawalResult.success ? 'processing' : 'failed',
          payment_reference: withdrawalResult.reference,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (!withdrawalResult.success) {
        // Refund the amount if withdrawal failed
        await supabase
          .from('user_balances')
          .update({
            coins: availableBalance, // Restore original balance
            updated_at: new Date().toISOString()
          })
          .eq('user_id', session.user_id);

        return NextResponse.json({ 
          error: withdrawalResult.error || 'Withdrawal processing failed' 
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Withdrawal initiated successfully',
        transaction: {
          id: transactionId,
          amount,
          fee,
          netAmount,
          status: 'processing',
          estimatedCompletion: getEstimatedCompletion(paymentMethod),
          paymentReference: withdrawalResult.reference
        }
      });

    } catch (withdrawalError) {
      console.error('Withdrawal processing error:', withdrawalError);
      
      // Refund the amount and mark transaction as failed
      await Promise.all([
        supabase
          .from('user_balances')
          .update({
            coins: availableBalance, // Restore original balance
            updated_at: new Date().toISOString()
          })
          .eq('user_id', session.user_id),
        
        supabase
          .from('transactions')
          .update({
            status: 'failed',
            error_message: withdrawalError instanceof Error ? withdrawalError.message : 'Withdrawal failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', transactionId)
      ]);

      return NextResponse.json({ 
        error: 'Withdrawal processing failed' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json({ error: 'Withdrawal processing failed' }, { status: 500 });
  }
}

// Helper functions for withdrawal processing
function calculateWithdrawalFee(amount: number, method: string): number {
  switch (method) {
    case 'paypal':
      return Math.round((amount * 0.029 + 0.30) * 100) / 100; // 2.9% + $0.30
    case 'bank_transfer':
      return 5.00; // $5 flat fee
    case 'bitcoin':
      return 2.00; // $2 network fee
    case 'ethereum':
      return 1.50; // $1.50 network fee
    default:
      return 1.00;
  }
}

function getEstimatedCompletion(method: string): string {
  switch (method) {
    case 'paypal':
      return '1-3 business days';
    case 'bitcoin':
      return '10-60 minutes';
    case 'ethereum':
      return '5-30 minutes';
    case 'bank_transfer':
      return '3-5 business days';
    default:
      return '1-2 business days';
  }
}

async function processPayPalWithdrawal(transactionId: string, amount: number, withdrawalData: any) {
  // Mock PayPal withdrawal processing - integrate with PayPal Payouts API
  return new Promise<{ success: boolean; reference: string; error?: string }>((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.05; // 95% success rate
      resolve({
        success,
        reference: `paypal_payout_${Date.now()}`,
        error: success ? undefined : 'PayPal account verification failed'
      });
    }, 1500);
  });
}

async function processCryptoWithdrawal(transactionId: string, amount: number, method: string, withdrawalData: any) {
  // Mock crypto withdrawal processing - integrate with crypto wallet services
  return new Promise<{ success: boolean; reference: string; error?: string }>((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.02; // 98% success rate
      resolve({
        success,
        reference: `${method}_tx_${Date.now()}`,
        error: success ? undefined : 'Invalid wallet address'
      });
    }, 2000);
  });
}

async function processBankWithdrawal(transactionId: string, amount: number, withdrawalData: any) {
  // Mock bank transfer processing - integrate with banking APIs
  return new Promise<{ success: boolean; reference: string; error?: string }>((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.03; // 97% success rate
      resolve({
        success,
        reference: `bank_transfer_${Date.now()}`,
        error: success ? undefined : 'Bank account verification failed'
      });
    }, 1000);
  });
}