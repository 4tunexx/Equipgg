// Test flash sales API endpoint
async function testFlashSales() {
  try {
    console.log('Testing flash sales endpoint...');
    const response = await fetch('http://localhost:3000/api/landing/flash-sales');
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.status === 200) {
      console.log('✅ Flash sales API working correctly!');
    } else {
      console.log('❌ Flash sales API returned error status');
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Wait for server to start
setTimeout(testFlashSales, 5000);