/**
 * COMPLETE STRIPE PAYMENT PROCESSING SERVICE
 * Full production-ready payment system with webhooks, refunds, and fraud detection
 */

import Stripe from 'stripe';
import { createServerSupabaseClient } from '../supabase';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
  metadata: any;
}

export interface GemPackage {
  id: string;
  name: string;
  gems: number;
  price: number;
  bonus_gems: number;
  popular?: boolean;
  discount_percentage?: number;
}

export class StripePaymentService {
  private webhookSecret: string;

  constructor() {
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  /**
   * Get available gem packages
   */
  async getGemPackages(): Promise<GemPackage[]> {
    return [
      {
        id: 'starter',
        name: 'Starter Pack',
        gems: 100,
        price: 4.99,
        bonus_gems: 0,
      },
      {
        id: 'bronze',
        name: 'Bronze Pack',
        gems: 500,
        price: 19.99,
        bonus_gems: 50,
      },
      {
        id: 'silver',
        name: 'Silver Pack',
        gems: 1200,
        price: 49.99,
        bonus_gems: 200,
        popular: true,
      },
      {
        id: 'gold',
        name: 'Gold Pack',
        gems: 2500,
        price: 99.99,
        bonus_gems: 500,
      },
      {
        id: 'platinum',
        name: 'Platinum Pack',
        gems: 6000,
        price: 199.99,
        bonus_gems: 1500,
        discount_percentage: 20,
      },
      {
        id: 'diamond',
        name: 'Diamond Pack',
        gems: 15000,
        price: 399.99,
        bonus_gems: 5000,
        discount_percentage: 25,
      },
    ];
  }

  /**
   * Create payment intent for gem purchase
   */
  async createPaymentIntent(
    userId: string,
    packageId: string,
    userEmail?: string
  ): Promise<PaymentIntent> {
    const packages = await this.getGemPackages();
    const gemPackage = packages.find(p => p.id === packageId);

    if (!gemPackage) {
      throw new Error('Invalid package selected');
    }

    // Check for user's purchase history for fraud detection
    const supabase = createServerSupabaseClient();
    const { data: recentPurchases } = await supabase
      .from('gem_transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    // Fraud detection: limit daily purchases
    if (recentPurchases && recentPurchases.length >= 5) {
      throw new Error('Daily purchase limit reached. Please try again tomorrow.');
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(gemPackage.price * 100), // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: userId,
        package_id: packageId,
        gems: gemPackage.gems,
        bonus_gems: gemPackage.bonus_gems,
        total_gems: gemPackage.gems + gemPackage.bonus_gems,
      },
      receipt_email: userEmail,
      description: `EquipGG ${gemPackage.name} - ${gemPackage.gems + gemPackage.bonus_gems} Gems`,
    });

    // Store payment intent in database
    await supabase.from('payment_intents').insert({
      id: paymentIntent.id,
      user_id: userId,
      package_id: packageId,
      amount: gemPackage.price,
      gems: gemPackage.gems + gemPackage.bonus_gems,
      status: 'pending',
      stripe_payment_intent_id: paymentIntent.id,
    });

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret!,
      metadata: paymentIntent.metadata,
    };
  }

  /**
   * Handle webhook events from Stripe
   */
  async handleWebhook(body: string, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, this.webhookSecret);
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err}`);
    }

    const supabase = createServerSupabaseClient();

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentSuccess(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentFailed(failedPayment);
        break;

      case 'charge.dispute.created':
        const dispute = event.data.object as Stripe.Dispute;
        await this.handleDispute(dispute);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdate(subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const supabase = createServerSupabaseClient();
    
    const userId = paymentIntent.metadata.user_id;
    const gems = parseInt(paymentIntent.metadata.total_gems);

    // Update payment intent status
    await supabase
      .from('payment_intents')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    // Add gems to user account
    const { data: user } = await supabase
      .from('users')
      .select('gems')
      .eq('id', userId)
      .single();

    if (user) {
      await supabase
        .from('users')
        .update({
          gems: (user.gems || 0) + gems,
        })
        .eq('id', userId);

      // Create transaction record
      await supabase.from('gem_transactions').insert({
        user_id: userId,
        type: 'purchase',
        amount: gems,
        payment_intent_id: paymentIntent.id,
        status: 'completed',
        description: `Purchased ${gems} gems`,
      });

      // Create notification
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Payment Successful! 💎',
        message: `Your purchase of ${gems} gems has been completed.`,
        type: 'payment',
        read: false,
      });

      console.log(`✅ Payment successful: User ${userId} received ${gems} gems`);
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const supabase = createServerSupabaseClient();
    
    await supabase
      .from('payment_intents')
      .update({
        status: 'failed',
        error_message: paymentIntent.last_payment_error?.message,
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    // Notify user
    const userId = paymentIntent.metadata.user_id;
    if (userId) {
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Payment Failed',
        message: 'Your payment could not be processed. Please try again or use a different payment method.',
        type: 'payment',
        read: false,
      });
    }
  }

  /**
   * Handle dispute/chargeback
   */
  private async handleDispute(dispute: Stripe.Dispute): Promise<void> {
    const supabase = createServerSupabaseClient();
    
    // Find the payment intent
    const paymentIntentId = dispute.payment_intent as string;
    const { data: paymentRecord } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (paymentRecord) {
      // Remove gems from user account
      const { data: user } = await supabase
        .from('users')
        .select('gems')
        .eq('id', paymentRecord.user_id)
        .single();

      if (user) {
        await supabase
          .from('users')
          .update({
            gems: Math.max(0, user.gems - paymentRecord.gems),
            account_status: 'suspended', // Suspend account for chargeback
          })
          .eq('id', paymentRecord.user_id);

        // Log the dispute
        await supabase.from('admin_logs').insert({
          action: 'dispute_created',
          target_id: paymentRecord.user_id,
          details: {
            dispute_id: dispute.id,
            amount: dispute.amount,
            reason: dispute.reason,
          },
        });

        console.log(`⚠️ Dispute created: User ${paymentRecord.user_id} account suspended`);
      }
    }
  }

  /**
   * Handle subscription updates
   */
  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const supabase = createServerSupabaseClient();
    const userId = subscription.metadata.user_id;

    if (!userId) return;

    const status = subscription.status;
    const isActive = status === 'active' || status === 'trialing';

    // Update user's VIP status
    await supabase
      .from('users')
      .update({
        vip_status: isActive ? 'premium' : 'free',
        vip_expires_at: isActive ? new Date(subscription.current_period_end * 1000).toISOString() : null,
      })
      .eq('id', userId);

    // Apply VIP benefits
    if (isActive) {
      await this.applyVIPBenefits(userId);
    } else {
      await this.removeVIPBenefits(userId);
    }
  }

  /**
   * Apply VIP benefits to user
   */
  private async applyVIPBenefits(userId: string): Promise<void> {
    const supabase = createServerSupabaseClient();

    // Add VIP perks
    await supabase.from('user_perks').insert([
      {
        user_id: userId,
        perk_id: 1, // 2x XP boost
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: userId,
        perk_id: 2, // Daily free crate key
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);

    // Add VIP badge
    await supabase.from('user_badges').insert({
      user_id: userId,
      badge_id: 100, // VIP badge
    });
  }

  /**
   * Remove VIP benefits from user
   */
  private async removeVIPBenefits(userId: string): Promise<void> {
    const supabase = createServerSupabaseClient();

    // Remove VIP perks
    await supabase
      .from('user_perks')
      .delete()
      .eq('user_id', userId)
      .in('perk_id', [1, 2]);

    // Remove VIP badge
    await supabase
      .from('user_badges')
      .delete()
      .eq('user_id', userId)
      .eq('badge_id', 100);
  }

  /**
   * Process refund
   */
  async processRefund(paymentIntentId: string, reason?: string): Promise<boolean> {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: reason as any || 'requested_by_customer',
      });

      const supabase = createServerSupabaseClient();
      
      // Get payment details
      const { data: payment } = await supabase
        .from('payment_intents')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (payment) {
        // Remove gems from user
        const { data: user } = await supabase
          .from('users')
          .select('gems')
          .eq('id', payment.user_id)
          .single();

        if (user) {
          await supabase
            .from('users')
            .update({
              gems: Math.max(0, user.gems - payment.gems),
            })
            .eq('id', payment.user_id);

          // Log refund
          await supabase.from('gem_transactions').insert({
            user_id: payment.user_id,
            type: 'refund',
            amount: -payment.gems,
            payment_intent_id: paymentIntentId,
            status: 'completed',
            description: `Refund for ${payment.gems} gems`,
          });
        }

        // Update payment intent status
        await supabase
          .from('payment_intents')
          .update({
            status: 'refunded',
            refunded_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntentId);
      }

      return refund.status === 'succeeded';
    } catch (error) {
      console.error('Refund failed:', error);
      return false;
    }
  }

  /**
   * Get user's payment history
   */
  async getUserPaymentHistory(userId: string) {
    const supabase = createServerSupabaseClient();
    
    const { data } = await supabase
      .from('payment_intents')
      .select('*, gem_transactions(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return data || [];
  }

  /**
   * Create checkout session for subscription
   */
  async createSubscriptionCheckout(userId: string, priceId: string): Promise<string> {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments/cancel`,
      metadata: {
        user_id: userId,
      },
    });

    return session.url!;
  }
}

// Export singleton
export const stripeService = new StripePaymentService();
