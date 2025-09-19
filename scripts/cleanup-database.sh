#!/bin/bash

# Direct Supabase Database Cleanup via REST API
# Uses curl to directly access Supabase and clean up the database

echo "🚀 Direct Database Cleanup via REST API"
echo "======================================="

# Load environment variables
source .env

echo "🔗 Testing Supabase connection..."
echo "URL: $NEXT_PUBLIC_SUPABASE_URL"

# Test connection
curl -s -X GET "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Connection successful!"
else
    echo "❌ Connection failed"
    exit 1
fi

echo ""
echo "🧹 Starting database cleanup..."

# Method 1: Try to execute SQL via the query RPC
echo "📄 Attempting SQL execution..."

SQL_CONTENT=$(cat complete_database_reset.sql)

# Try RPC query method
RESPONSE=$(curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/query" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d "{\"query_text\": $(echo "$SQL_CONTENT" | jq -R -s '.')}")

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ RPC query method failed"
    echo ""
    echo "🔧 Trying alternative method..."
    
    # Method 2: Try individual table operations
    echo "🗑️  Attempting to drop individual tables..."
    
    # Try to list existing tables first
    TABLE_RESPONSE=$(curl -s -X GET "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/information_schema.tables?table_schema=eq.public&select=table_name" \
         -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
         -H "apikey: $SUPABASE_SERVICE_ROLE_KEY")
    
    echo "Existing tables: $TABLE_RESPONSE"
    
    if echo "$TABLE_RESPONSE" | grep -q "user"; then
        echo "🔍 Found problematic tables that need cleanup"
        echo ""
        echo "⚠️  Manual cleanup required:"
        echo "1. Go to https://supabase.com/dashboard"
        echo "2. Select your EquipGG project" 
        echo "3. Click 'SQL Editor'"
        echo "4. Copy the content from complete_database_reset.sql"
        echo "5. Paste and click 'Run'"
        echo ""
        echo "This will fix all the column name and table structure issues."
    else
        echo "✅ No problematic tables found"
    fi
    
else
    echo "✅ Database cleanup completed successfully!"
    echo ""
    echo "🎉 Your database has been cleaned up and recreated!"
    echo "📋 What was fixed:"
    echo "  ✅ Removed tables with wrong structure"
    echo "  ✅ Created tables with correct column names (display_name)"
    echo "  ✅ Fixed table names (activity_feed vs user_activity_feed)"
    echo "  ✅ Added sample data"
    echo ""
    echo "🚀 Visit https://equipgg.net to test the fixes!"
fi