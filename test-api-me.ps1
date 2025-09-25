# Test script for /api/me endpoint
param(
    [string]$SessionData = '{"user_id":"steam-76561198001993310","email":"76561198001993310@steam.local","role":"user","expires_at":1759434913625}'
)

Write-Host "Testing /api/me endpoint with session data..."

# Encode the session data
Add-Type -AssemblyName System.Web
$encodedSession = [System.Web.HttpUtility]::UrlEncode($SessionData)
Write-Host "Encoded session: $encodedSession"

# Create and send the request
$uri = "http://localhost:3000/api/me"
$request = [System.Net.WebRequest]::Create($uri)
$request.Method = "GET"
$request.Headers.Add("Cookie", "equipgg_session=$encodedSession")

try {
    $response = $request.GetResponse()
    $reader = [System.IO.StreamReader]::new($response.GetResponseStream())
    $content = $reader.ReadToEnd()
    $reader.Close()
    $response.Close()
    
    Write-Host "Response: $content"
    
    # Parse the JSON response
    $jsonResponse = $content | ConvertFrom-Json
    if ($jsonResponse.user) {
        Write-Host "✅ SUCCESS: User authenticated as $($jsonResponse.user.displayName)"
        Write-Host "   User ID: $($jsonResponse.user.id)"
        Write-Host "   Role: $($jsonResponse.user.role)"
        Write-Host "   Steam Verified: $($jsonResponse.user.steamVerified)"
    } else {
        Write-Host "❌ FAILED: User is null"
    }
} catch {
    Write-Host "❌ ERROR: $_"
}