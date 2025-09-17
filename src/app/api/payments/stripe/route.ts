import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-utils';
import { getDb, getOne, run } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// POST - Create Stripe payment intent
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { packageId, amount, currency = 'USD' } = body;

    await getDb();

    // Get payment settings
    const paymentSettings = await getOne(`
      SELECT * FROM payment_settings WHERE id = 1
    `);

    if (!paymentSettings?.enabled || !paymentSettings?.stripeSecretKey) {
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 400 });
    }

    // Get gem package details
    const gemPackage = await getOne(`
      SELECT * FROM gem_packages WHERE id = ? AND enabled = 1
    `, [packageId]);

    if (!gemPackage) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    // Create payment intent (mock implementation - replace with real Stripe)
    const paymentIntentId = `pi_${uuidv4().replace(/-/g, '')}`;
    const clientSecret = `pi_${uuidv4().replace(/-/g, '')}_secret_${uuidv4().replace(/-/g, '')}`;

    // Store payment intent in database
    await run(`
      INSERT INTO payment_intents (
        id, user_id, package_id, amount, currency, status, 
        stripe_payment_intent_id, client_secret, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(),
      session.user_id,
      packageId,
      gemPackage.price,
      currency,
      'requires_payment_method',
      paymentIntentId,
      clientSecret,
      new Date().toISOString()
    ]);

    return NextResponse.json({
      success: true,
      clientSecret,
      paymentIntentId,
      amount: gemPackage.price,
      currency,
      gems: gemPackage.gems
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Confirm payment
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentIntentId } = body;

    await getDb();

    // Get payment intent
    const paymentIntent = await getOne(`
      SELECT * FROM payment_intents 
      WHERE stripe_payment_intent_id = ? AND user_id = ?
    `, [paymentIntentId, session.user_id]);

    if (!paymentIntent) {
      return NextResponse.json({ error: 'Payment intent not found' }, { status: 404 });
    }

    // Get gem package
    const gemPackage = await getOne(`
      SELECT * FROM gem_packages WHERE id = ?
    `, [paymentIntent.package_id]);

    if (!gemPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Update payment status (mock - in real implementation, verify with Stripe webhook)
    await run(`
      UPDATE payment_intents 
      SET status = ?, updated_at = ?
      WHERE stripe_payment_intent_id = ?
    `, ['succeeded', new Date().toISOString(), paymentIntentId]);

    // Add gems to user account
    await run(`
      UPDATE users 
      SET gems = gems + ?
      WHERE id = ?
    `, [gemPackage.gems, session.user_id]);

    // Record transaction
    await run(`
      INSERT INTO gem_transactions (
        id, user_id, type, amount, currency, description, gems_paid, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(),
      session.user_id,
      'purchase',
      gemPackage.gems,
      'gems',
      `Purchased ${gemPackage.gems} gems for $${gemPackage.price} (${gemPackage.name})`,
      gemPackage.price,
      new Date().toISOString()
    ]);

    // Get updated user balance
    const user = await getOne(`
      SELECT gems FROM users WHERE id = ?
    `, [session.user_id]);

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${gemPackage.gems} gems!`,
      newBalance: {
        gems: user.gems
      }
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
