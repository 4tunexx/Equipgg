import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from "../../../../lib/auth-utils";
import { supabase } from "../../../../lib/supabase";
import { v4 as uuidv4 } from 'uuid';

// Process a deposit
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
      paymentData // Contains method-specific data (card details, crypto address, etc.)
    } = await request.json();

    if (!amount || !paymentMethod || amount <= 0) {
      return NextResponse.json({ 
        error: 'Amount and payment method are required' 
      }, { status: 400 });
    }

    // Validate payment method
    const validMethods = ['card', 'bitcoin', 'ethereum', 'paypal', 'bank_transfer'];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    // Check deposit limits
    const dailyLimit = 2500;
    const today = new Date().toISOString().split('T')[0];
    
    const { data: todayDeposits } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', session.user_id)
      .eq('type', 'deposit')
      .eq('status', 'completed')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    const todayTotal = todayDeposits?.reduce((sum, t) => sum + t.amount, 0) || 0;
    
    if (todayTotal + amount > dailyLimit) {
      return NextResponse.json({ 
        error: `Daily deposit limit of $${dailyLimit} would be exceeded` 
      }, { status: 400 });
    }

    // Create transaction record
    const transactionId = uuidv4();
    const fee = calculateDepositFee(amount, paymentMethod);
    
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        id: transactionId,
        user_id: session.user_id,
        type: 'deposit',
        amount,
        currency,
        fee,
        payment_method: paymentMethod,
        status: 'pending',
        payment_data: paymentData ? JSON.stringify(paymentData) : null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Failed to create transaction:', transactionError);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    // Process payment based on method
    let paymentResult;
    try {
      switch (paymentMethod) {
        case 'card':
          paymentResult = await processCardPayment(transactionId, amount, paymentData);
          break;
        case 'bitcoin':
        case 'ethereum':
          paymentResult = await processCryptoPayment(transactionId, amount, paymentMethod, paymentData);
          break;
        case 'paypal':
          paymentResult = await processPayPalPayment(transactionId, amount, paymentData);
          break;
        default:
          throw new Error('Payment method not implemented');
      }

      // Update transaction with payment result
      await supabase
        .from('transactions')
        .update({
          status: paymentResult.success ? 'processing' : 'failed',
          payment_reference: paymentResult.reference,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (paymentResult.success) {
        // For instant methods like cards, complete the transaction immediately
        if (paymentMethod === 'card' && paymentResult.instant) {
          await completeDeposit(session.user_id, transactionId, amount);
        }

        return NextResponse.json({
          success: true,
          message: 'Deposit initiated successfully',
          transaction: {
            id: transactionId,
            amount,
            fee,
            status: paymentResult.instant ? 'completed' : 'processing',
            paymentReference: paymentResult.reference
          }
        });
      } else {
        return NextResponse.json({ 
          error: paymentResult.error || 'Payment processing failed' 
        }, { status: 400 });
      }

    } catch (paymentError) {
      console.error('Payment processing error:', paymentError);
      
      // Mark transaction as failed
      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          error_message: paymentError instanceof Error ? paymentError.message : 'Payment failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      return NextResponse.json({ 
        error: 'Payment processing failed' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Deposit error:', error);
    return NextResponse.json({ error: 'Deposit processing failed' }, { status: 500 });
  }
}

// Helper functions for payment processing
function calculateDepositFee(amount: number, method: string): number {
  switch (method) {
    case 'card':
      return Math.round((amount * 0.035 + 0.30) * 100) / 100; // 3.5% + $0.30
    case 'paypal':
      return Math.round((amount * 0.029 + 0.30) * 100) / 100; // 2.9% + $0.30
    case 'bank_transfer':
      return 5.00; // $5 flat fee
    case 'bitcoin':
    case 'ethereum':
      return 0; // Network fees paid by user
    default:
      return 0;
  }
}

async function processCardPayment(transactionId: string, amount: number, paymentData: any) {
  // Mock card processing - integrate with Stripe, Square, etc.
  return new Promise<{ success: boolean; instant: boolean; reference: string; error?: string }>((resolve) => {
    setTimeout(() => {
      // Mock success/failure
      const success = Math.random() > 0.1; // 90% success rate
      resolve({
        success,
        instant: true,
        reference: `card_${Date.now()}`,
        error: success ? undefined : 'Card declined'
      });
    }, 2000);
  });
}

async function processCryptoPayment(transactionId: string, amount: number, method: string, paymentData: any) {
  // Mock crypto processing - integrate with crypto payment providers
  return new Promise<{ success: boolean; instant: boolean; reference: string }>((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        instant: false, // Requires confirmations
        reference: `${method}_${Date.now()}`
      });
    }, 1000);
  });
}

async function processPayPalPayment(transactionId: string, amount: number, paymentData: any) {
  // Mock PayPal processing - integrate with PayPal API
  return new Promise<{ success: boolean; instant: boolean; reference: string }>((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        instant: false, // Requires processing time
        reference: `paypal_${Date.now()}`
      });
    }, 1500);
  });
}

async function completeDeposit(userId: string, transactionId: string, amount: number) {
  try {
    // Update user balance
    await supabase.rpc('add_user_balance', {
      user_id: userId,
      amount: amount,
      currency: 'USD'
    });

    // Mark transaction as completed
    await supabase
      .from('transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    console.log(`Deposit completed: User ${userId} received $${amount}`);
  } catch (error) {
    console.error('Failed to complete deposit:', error);
  }
}