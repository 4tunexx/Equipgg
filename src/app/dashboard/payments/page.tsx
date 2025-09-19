'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Label } from "../../../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group";
import { useAuth } from "../../../hooks/use-auth";
import { useToast } from "../../../hooks/use-toast";
import { 
  CreditCard, 
  DollarSign, 
  Bitcoin, 
  Smartphone,
  ArrowUp, 
  ArrowDown, 
  Clock, 
  Check, 
  X,
  Shield,
  AlertTriangle,
  Eye,
  Copy,
  QrCode,
  History,
  Plus,
  Wallet,
  Download
} from 'lucide-react';
import { cn } from "../../../lib/utils";
import { formatDistanceToNow } from 'date-fns';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'crypto' | 'digital_wallet' | 'bank';
  icon: React.ReactNode;
  minAmount: number;
  maxAmount: number;
  processingTime: string;
  fees: string;
  isEnabled: boolean;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  fee: number;
  txHash?: string;
  note?: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    type: 'card',
    icon: <CreditCard className="w-5 h-5" />,
    minAmount: 5,
    maxAmount: 1000,
    processingTime: 'Instant',
    fees: '3.5% + $0.30',
    isEnabled: true
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    type: 'crypto',
    icon: <Bitcoin className="w-5 h-5 text-orange-500" />,
    minAmount: 10,
    maxAmount: 10000,
    processingTime: '10-60 minutes',
    fees: 'Network fees only',
    isEnabled: true
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    type: 'crypto',
    icon: <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">Ξ</div>,
    minAmount: 5,
    maxAmount: 5000,
    processingTime: '5-30 minutes',
    fees: 'Network fees only',
    isEnabled: true
  },
  {
    id: 'paypal',
    name: 'PayPal',
    type: 'digital_wallet',
    icon: <Wallet className="w-5 h-5 text-blue-600" />,
    minAmount: 10,
    maxAmount: 2000,
    processingTime: '1-3 business days',
    fees: '2.9% + $0.30',
    isEnabled: true
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    type: 'bank',
    icon: <DollarSign className="w-5 h-5" />,
    minAmount: 50,
    maxAmount: 5000,
    processingTime: '3-5 business days',
    fees: '$5 flat fee',
    isEnabled: false
  }
];

export default function PaymentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('deposit');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Card details for card payments
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  // Crypto payment details
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cryptoQR, setCryptoQR] = useState('');

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Mock transaction data for now
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'deposit',
          amount: 100,
          currency: 'USD',
          method: 'Credit Card',
          status: 'completed',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          fee: 3.8
        },
        {
          id: '2',
          type: 'withdrawal',
          amount: 50,
          currency: 'USD',
          method: 'PayPal',
          status: 'pending',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          fee: 1.75
        },
        {
          id: '3',
          type: 'deposit',
          amount: 0.002,
          currency: 'BTC',
          method: 'Bitcoin',
          status: 'processing',
          createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          fee: 0,
          txHash: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
        }
      ];
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!selectedMethod || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please select a payment method and enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    const method = paymentMethods.find(m => m.id === selectedMethod);
    if (!method) {
      toast({
        title: "Error",
        description: "Invalid payment method selected",
        variant: "destructive"
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum < method.minAmount || amountNum > method.maxAmount) {
      toast({
        title: "Error",
        description: `Amount must be between $${method.minAmount} and $${method.maxAmount}`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Info",
        description: "Payment processing is not yet implemented. This is a preview of the payment interface.",
      });

      // Reset form
      setAmount('');
      setSelectedMethod('');
      setCardDetails({ number: '', expiry: '', cvv: '', name: '' });

    } catch (error) {
      toast({
        title: "Error",
        description: "Payment processing failed",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!selectedMethod || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please select a withdrawal method and enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Mock withdrawal processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Info",
        description: "Withdrawal processing is not yet implemented. This is a preview of the withdrawal interface.",
      });

      setAmount('');
      setSelectedMethod('');

    } catch (error) {
      toast({
        title: "Error",
        description: "Withdrawal processing failed",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'failed': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'cancelled': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return <Check className="w-3 h-3" />;
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'processing': return <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />;
      case 'failed': return <X className="w-3 h-3" />;
      case 'cancelled': return <X className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Manage your deposits and withdrawals</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg">
          <Wallet className="h-5 w-5 text-green-500" />
          <span className="font-bold">$1,247.89</span>
          <span className="text-muted-foreground">Available Balance</span>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deposit">
            <ArrowDown className="w-4 h-4 mr-2" />
            Deposit
          </TabsTrigger>
          <TabsTrigger value="withdraw">
            <ArrowUp className="w-4 h-4 mr-2" />
            Withdraw
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Deposit Tab */}
        <TabsContent value="deposit" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Add Funds</CardTitle>
                  <CardDescription>Choose a payment method to deposit funds</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Payment Methods */}
                  <div>
                    <Label className="text-sm font-medium">Payment Method</Label>
                    <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                      {paymentMethods.filter(m => m.isEnabled).map((method) => (
                        <div key={method.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                          <RadioGroupItem value={method.id} id={method.id} />
                          <label htmlFor={method.id} className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {method.icon}
                                <div>
                                  <p className="font-medium">{method.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    ${method.minAmount} - ${method.maxAmount} • {method.processingTime}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">{method.fees}</p>
                              </div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <Label htmlFor="amount">Amount (USD)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min={selectedMethod ? paymentMethods.find(m => m.id === selectedMethod)?.minAmount : 0}
                      max={selectedMethod ? paymentMethods.find(m => m.id === selectedMethod)?.maxAmount : 10000}
                    />
                    {selectedMethod && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Min: ${paymentMethods.find(m => m.id === selectedMethod)?.minAmount} • 
                        Max: ${paymentMethods.find(m => m.id === selectedMethod)?.maxAmount}
                      </p>
                    )}
                  </div>

                  {/* Payment Details */}
                  {selectedMethod === 'card' && (
                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium">Card Details</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input
                            id="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            value={cardDetails.number}
                            onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiry">Expiry</Label>
                            <Input
                              id="expiry"
                              placeholder="MM/YY"
                              value={cardDetails.expiry}
                              onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              placeholder="123"
                              value={cardDetails.cvv}
                              onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="cardName">Cardholder Name</Label>
                          <Input
                            id="cardName"
                            placeholder="John Doe"
                            value={cardDetails.name}
                            onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {(selectedMethod === 'bitcoin' || selectedMethod === 'ethereum') && (
                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium">Crypto Payment</h4>
                      <div className="text-center space-y-4">
                        <div className="w-32 h-32 bg-white p-4 rounded-lg mx-auto">
                          <QrCode className="w-full h-full text-black" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Send payment to:</p>
                          <div className="flex items-center gap-2 bg-background border rounded p-2">
                            <code className="flex-1 text-sm">bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq</code>
                            <Button size="icon" variant="outline" className="h-8 w-8">
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleDeposit} 
                    disabled={isProcessing || !selectedMethod || !amount}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Deposit ${amount || '0'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Deposit Info */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    Security Notice
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• All transactions are encrypted and secure</p>
                  <p>• We never store your payment information</p>
                  <p>• Deposits are typically processed instantly</p>
                  <p>• 24/7 fraud monitoring and protection</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    Important
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• Minimum deposit varies by payment method</p>
                  <p>• Fees may apply depending on payment method</p>
                  <p>• Crypto transactions require network confirmations</p>
                  <p>• Contact support if you encounter any issues</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Withdraw Tab */}
        <TabsContent value="withdraw" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Withdraw Funds</CardTitle>
                  <CardDescription>Choose a method to withdraw your funds</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Withdrawal Methods */}
                  <div>
                    <Label className="text-sm font-medium">Withdrawal Method</Label>
                    <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                      {paymentMethods.filter(m => m.isEnabled && m.id !== 'card').map((method) => (
                        <div key={method.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                          <RadioGroupItem value={method.id} id={`withdraw-${method.id}`} />
                          <label htmlFor={`withdraw-${method.id}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {method.icon}
                                <div>
                                  <p className="font-medium">{method.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    ${method.minAmount} - ${method.maxAmount} • {method.processingTime}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <Label htmlFor="withdrawAmount">Amount (USD)</Label>
                    <Input
                      id="withdrawAmount"
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min={selectedMethod ? paymentMethods.find(m => m.id === selectedMethod)?.minAmount : 0}
                      max={1247.89} // Available balance
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Available: $1,247.89
                    </p>
                  </div>

                  <Button 
                    onClick={handleWithdrawal} 
                    disabled={isProcessing || !selectedMethod || !amount}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Withdraw ${amount || '0'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Withdrawal Info */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Withdrawal Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Daily Limit:</span>
                    <span className="font-medium">$2,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekly Limit:</span>
                    <span className="font-medium">$10,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Limit:</span>
                    <span className="font-medium">$25,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Today Used:</span>
                    <span className="font-medium">$0</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Processing Times</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>PayPal:</span>
                    <span>1-3 business days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bitcoin:</span>
                    <span>10-60 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ethereum:</span>
                    <span>5-30 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bank Transfer:</span>
                    <span>3-5 business days</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>View all your deposits and withdrawals</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-full",
                          transaction.type === 'deposit' ? "bg-green-500/10" : "bg-blue-500/10"
                        )}>
                          {transaction.type === 'deposit' ? 
                            <ArrowDown className="w-4 h-4 text-green-500" /> : 
                            <ArrowUp className="w-4 h-4 text-blue-500" />
                          }
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{transaction.type}</span>
                            <Badge className={getStatusColor(transaction.status)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(transaction.status)}
                                {transaction.status}
                              </span>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {transaction.method} • {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                          </p>
                          {transaction.txHash && (
                            <p className="text-xs text-muted-foreground font-mono">
                              TX: {transaction.txHash}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {transaction.type === 'deposit' ? '+' : '-'}
                          ${transaction.amount.toFixed(2)}
                        </p>
                        {transaction.fee > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Fee: ${transaction.fee.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}