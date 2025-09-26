// Simple script to test database analysis
async function analyzeDatabase() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/migrate-database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'analyze_database' })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Database Analysis Results:');
    console.log('==========================');
    console.log(data.message);
  } catch (error) {
    console.error('Error analyzing database:', error);
  }
}

analyzeDatabase();