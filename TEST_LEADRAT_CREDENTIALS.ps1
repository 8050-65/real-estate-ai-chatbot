# ============================================================================
# LEADRAT CREDENTIALS TEST SCRIPT
# ============================================================================
# Tests Leadrat API connectivity with real credentials (dubait11 tenant)

# Credentials
$API_KEY = "Zjg2N2JiNjItODBmOC00YzBjLTlkMmMtMjk5OGRiZjBmMDU3OmR1YmFpdDEx"
$SECRET_KEY = "a3Ay5UKLYjm6sZ_TXCXGzqmIdB3zgM8Y"
$TENANT = "dubait11"
$AUTH_URL = "https://connect.leadrat.com/api/v1/authentication/token"
$API_URL = "https://connect.leadrat.info/api/v1"

# ============================================================================
# TEST 1 - Get Leadrat Token
# ============================================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST 1: Get Leadrat Authentication Token" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$authBody = @{
    apiKey = $API_KEY
    secretKey = $SECRET_KEY
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod `
        -Uri $AUTH_URL `
        -Method POST `
        -Headers @{
            "tenant" = $TENANT
            "Content-Type" = "application/json"
        } `
        -Body $authBody `
        -TimeoutSec 10

    if ($authResponse.token) {
        $token = $authResponse.token
        Write-Host "✅ SUCCESS - Token received" -ForegroundColor Green
        Write-Host "Token preview: $($token.Substring(0, 40))..." -ForegroundColor Green
        if ($authResponse.tokenType) {
            Write-Host "Token type: $($authResponse.tokenType)" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ FAILED - No token in response" -ForegroundColor Red
        Write-Host "Response: $($authResponse | ConvertTo-Json)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ FAILED - Token retrieval error" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ============================================================================
# TEST 2 - Get Leads from Leadrat
# ============================================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST 2: Fetch Leads from Leadrat API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

try {
    $leadsResponse = Invoke-RestMethod `
        -Uri "$API_URL/lead?PageNumber=1&PageSize=5" `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Accept" = "application/json"
        } `
        -TimeoutSec 10

    if ($leadsResponse.data -or $leadsResponse[0]) {
        if ($leadsResponse.data) {
            $leads = $leadsResponse.data
        } else {
            $leads = $leadsResponse
        }
        Write-Host "✅ SUCCESS - Leads received" -ForegroundColor Green
        Write-Host "Total leads: $($leads.Count)" -ForegroundColor Green

        if ($leads.Count -gt 0) {
            Write-Host "`nFirst 3 leads:" -ForegroundColor Yellow
            $leads | Select-Object -First 3 | ForEach-Object {
                $leadName = if ($_.name) { $_.name } else { 'N/A' }
                $leadPhone = if ($_.contactNo) { $_.contactNo } else { 'N/A' }
                Write-Host "  • $leadName — $leadPhone" -ForegroundColor White
            }
        }
    } else {
        Write-Host "⚠️  WARNING - Empty leads response" -ForegroundColor Yellow
        Write-Host "Response: $($leadsResponse | ConvertTo-Json)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ FAILED - Leads API error" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure token is still valid" -ForegroundColor Yellow
}

# ============================================================================
# TEST 3 - Get Properties from Leadrat
# ============================================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST 3: Fetch Properties from Leadrat API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

try {
    $propsResponse = Invoke-RestMethod `
        -Uri "$API_URL/property?PageNumber=1&PageSize=5" `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Accept" = "application/json"
        } `
        -TimeoutSec 10

    if ($propsResponse.data -or $propsResponse[0]) {
        if ($propsResponse.data) {
            $props = $propsResponse.data
        } else {
            $props = $propsResponse
        }
        Write-Host "✅ SUCCESS - Properties received" -ForegroundColor Green
        Write-Host "Total properties: $($props.Count)" -ForegroundColor Green

        if ($props.Count -gt 0) {
            Write-Host "`nFirst 3 properties:" -ForegroundColor Yellow
            $props | Select-Object -First 3 | ForEach-Object {
                $propTitle = if ($_.title) { $_.title } else { 'N/A' }
                $propBhk = if ($_.bhkType) { $_.bhkType } else { 'N/A' }
                Write-Host "  • $propTitle — BHK: $propBhk" -ForegroundColor White
            }
        }
    } else {
        Write-Host "⚠️  WARNING - Empty properties response" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ FAILED - Properties API error" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================================================
# TEST 4 - Test Spring Boot Integration
# ============================================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST 4: Spring Boot Login & Leads Fetch" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$loginBody = @{
    email = "admin@crm-cbt.com"
    password = "Admin@123!"
} | ConvertTo-Json

try {
    Write-Host "Logging in to Spring Boot..." -ForegroundColor White
    $loginResp = Invoke-RestMethod `
        -Uri "http://localhost:8080/api/v1/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -TimeoutSec 10

    $jwtToken = $loginResp.data.accessToken
    Write-Host "✅ Login successful" -ForegroundColor Green
    Write-Host "JWT preview: $($jwtToken.Substring(0, 40))..." -ForegroundColor Green

    # Now fetch leads via Spring Boot
    Write-Host "`nFetching leads via Spring Boot..." -ForegroundColor White
    $springLeads = Invoke-RestMethod `
        -Uri "http://localhost:8080/api/v1/leads?page=0&size=5" `
        -Headers @{ "Authorization" = "Bearer $jwtToken" } `
        -TimeoutSec 10

    Write-Host "✅ Leads fetched from Spring Boot" -ForegroundColor Green
    if ($springLeads.content.Count) {
        $leadCount = $springLeads.content.Count
    } elseif ($springLeads.data.Count) {
        $leadCount = $springLeads.data.Count
    } else {
        $leadCount = 0
    }
    Write-Host "Leads count: $leadCount" -ForegroundColor Green

    if ($leadCount -gt 0) {
        Write-Host "`nFirst lead from Spring Boot:" -ForegroundColor Yellow
        if ($springLeads.content) {
            $firstLead = $springLeads.content[0]
        } else {
            $firstLead = $springLeads.data[0]
        }
        $firstName = if ($firstLead.name) { $firstLead.name } else { 'N/A' }
        $firstPhone = if ($firstLead.contactNo) { $firstLead.contactNo } else { 'N/A' }
        Write-Host "  Name: $firstName" -ForegroundColor White
        Write-Host "  Phone: $firstPhone" -ForegroundColor White
    }
} catch {
    Write-Host "❌ FAILED - Spring Boot integration error" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nMake sure:" -ForegroundColor Yellow
    Write-Host "  • Spring Boot is running on http://localhost:8080" -ForegroundColor Yellow
    Write-Host "  • Database is up" -ForegroundColor Yellow
    Write-Host "  • Credentials are correct" -ForegroundColor Yellow
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "If all tests passed (✅), your Leadrat credentials are working!" -ForegroundColor Green
Write-Host "Next: Test the chatbot at http://localhost:3000/ai-assistant" -ForegroundColor Green
Write-Host "`nExpected chatbot response to 'show me leads':" -ForegroundColor Yellow
Write-Host "  Real lead names from Leadrat (not error message)" -ForegroundColor Yellow
