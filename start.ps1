# Start both Next.js and Inngest dev server together
Write-Host "Starting BuildUI dev environment..." -ForegroundColor Green

# Kill anything on port 3000 first
Write-Host "Clearing port 3000..." -ForegroundColor Yellow
npx kill-port 3000 2>$null

# Start Next.js in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot'; npx next dev --port 3000" -WindowStyle Normal

# Wait for Next.js to be ready
Write-Host "Waiting for Next.js to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Start Inngest dev server in current window (auto-syncs)
Write-Host "Starting Inngest dev server..." -ForegroundColor Green
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest --no-discovery
