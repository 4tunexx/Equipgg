import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from '../../../../lib/auth-utils';
import { supabase } from "../../../../lib/supabase";

// Create Stripe payment intent
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, currency = 'usd', paymentType, metadata = {} } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ 
        error: 'Valid amount is required' 
      }, { status: 400 });
    }

    if (!paymentType) {
      return NextResponse.json({ 
        error: 'Payment type is required (deposit, vip, etc.)' 
      }, { status: 400 });
    }

    // Validate payment types and amounts
    const validPaymentTypes = ['deposit', 'vip', 'premium_case', 'custom'];
    if (!validPaymentTypes.includes(paymentType)) {
      return NextResponse.json({ 
        error: 'Invalid payment type' 
      }, { status: 400 });
    }

    // Amount limits based on payment type
    const limits = {
      deposit: { min: 5, max: 500 },
      vip: { min: 10, max: 100 },
      premium_case: { min: 1, max: 50 },
      custom: { min: 1, max: 1000 }
    };

    const typeLimit = limits[paymentType as keyof typeof limits];
    if (amount < typeLimit.min || amount > typeLimit.max) {
      return NextResponse.json({ 
        error: `Amount must be between $${typeLimit.min} and $${typeLimit.max} for ${paymentType}` 
      }, { status: 400 });
    }

    // For now, simulate Stripe integration (replace with actual Stripe when ready)
    const paymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = `${paymentIntentId}_secret_mock`;

    // Create payment record in database
    const paymentRecord = {
      user_id: session.user_id,
      stripe_payment_intent_id: paymentIntentId,
      amount: amount * 100, // Store in cents
      currency,
      payment_type: paymentType,
      status: 'pending',
      metadata: JSON.stringify(metadata),
      created_at: new Date().toISOString()
    };

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([paymentRecord])
      .select()
      .single();

    if (paymentError) {
      if (paymentError.code === 'PGRST116') {
        // Table doesn't exist, return mock success
        return NextResponse.json({
          success: true,
          payment_intent_id: paymentIntentId,
          client_secret: clientSecret,
          amount: amount * 100,
          currency,
          status: 'requires_payment_method',
          message: 'Payment system in development - using mock data'
        });
      }
      console.error('Error creating payment record:', paymentError);
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }

    // TODO: Replace with actual Stripe integration
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: amount * 100,
    //   currency,
    //   metadata: {
    //     user_id: session.user_id,
    //     payment_type: paymentType,
    //     ...metadata
    //   }
    // });

    return NextResponse.json({
      success: true,
      payment_intent_id: paymentIntentId,
      client_secret: clientSecret,
      amount: amount * 100,
      currency,
      status: 'requires_payment_method',
      payment_record_id: payment.id
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get payment status
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent_id');
    const userId = searchParams.get('user_id');

    if (paymentIntentId) {
      // Get specific payment by Stripe payment intent ID
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .eq('user_id', session.user_id)
        .single();

      if (paymentError) {
        if (paymentError.code === 'PGRST116') {
          return NextResponse.json({
            success: true,
            payment: {
              id: paymentIntentId,
              amount: 1000,
              currency: 'usd',
              status: 'succeeded',
              payment_type: 'deposit',
              created_at: new Date().toISOString()
            },
            message: 'Payment system in development'
          });
        }
        console.error('Error fetching payment:', paymentError);
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        payment
      });

    } else {
      // Get user's payment history
      const limit = parseInt(searchParams.get('limit') || '10');
      const offset = parseInt(searchParams.get('offset') || '0');

      // Check if user is admin and requesting another user's payments
      let targetUserId = session.user_id;
      if (userId && userId !== session.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user_id)
          .single();

        if (userData?.role !== 'admin') {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        targetUserId = userId;
      }

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (paymentsError) {
        if (paymentsError.code === 'PGRST116') {
          return NextResponse.json({
            success: true,
            payments: [
              {
                id: '1',
                stripe_payment_intent_id: 'pi_mock_example',
                amount: 2000,
                currency: 'usd',
                payment_type: 'deposit',
                status: 'succeeded',
                created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
              }
            ],
            total: 1,
            message: 'Payment system in development'
          });
        }
        console.error('Error fetching payments:', paymentsError);
        return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        payments,
        total: payments?.length || 0
      });
    }

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update payment status (webhook handler)
export async function PUT(request: NextRequest) {
  try {
    const { paymentIntentId, status, stripeSignature } = await request.json();

    // TODO: Verify Stripe webhook signature
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    // stripe.webhooks.constructEvent(request.body, stripeSignature, endpointSecret);

    if (!paymentIntentId || !status) {
      return NextResponse.json({ 
        error: 'Payment intent ID and status are required' 
      }, { status: 400 });
    }

    // Update payment status
    const { data: payment, error: updateError } = await supabase
      .from('payments')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntentId)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          message: 'Payment webhook processed (development mode)'
        });
      }
      console.error('Error updating payment status:', updateError);
      return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
    }

    // If payment succeeded, credit user account
    if (status === 'succeeded') {
      const coinsToAdd = Math.floor(payment.amount / 100); // $1 = 1 coin

      // Get current balance first
      const { data: currentUser, error: getUserError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', payment.user_id)
        .single();

      if (getUserError && getUserError.code !== 'PGRST116') {
        console.error('Error getting user balance:', getUserError);
      }

      const currentBalance = currentUser?.balance || 0;
      const newBalance = currentBalance + coinsToAdd;

      const { error: balanceError } = await supabase
        .from('users')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.user_id);

      if (balanceError && balanceError.code !== 'PGRST116') {
        console.error('Error updating user balance:', balanceError);
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          user_id: payment.user_id,
          type: 'deposit',
          amount: coinsToAdd,
          description: `Stripe payment: ${paymentIntentId}`,
          payment_id: payment.id,
          created_at: new Date().toISOString()
        }]);

      if (transactionError && transactionError.code !== 'PGRST116') {
        console.error('Error recording transaction:', transactionError);
      }
    }

    return NextResponse.json({
      success: true,
      payment
    });

  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
