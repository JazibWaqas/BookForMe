# Auto-detect and update local IP for Expo development
# Run this whenever you change networks

Write-Host "🔍 Detecting current IP address..." -ForegroundColor Cyan

# Get the active IPv4 address
$ip = (Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*"} | 
    Select-Object -First 1).IPAddress

if ($ip) {
    Write-Host "✅ Found IP: $ip" -ForegroundColor Green
    
    # Update .env file
    $envPath = ".\.env"
    if (Test-Path $envPath) {
        $content = Get-Content $envPath
        $updated = $content -replace 'EXPO_PUBLIC_API_URL=http://[\d\.]+:8000', "EXPO_PUBLIC_API_URL=http://${ip}:8000"
        $updated | Set-Content $envPath
        
        Write-Host "✅ Updated .env file with new IP" -ForegroundColor Green
        Write-Host "📱 New API URL: http://${ip}:8000" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "🚀 Restart Expo to apply changes:" -ForegroundColor Cyan
        Write-Host "   npx expo start --clear" -ForegroundColor White
    } else {
        Write-Host "❌ .env file not found" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Could not detect IP address" -ForegroundColor Red
}
