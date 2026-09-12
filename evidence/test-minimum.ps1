param([ValidateSet('before','after')][string]$Phase)
$ErrorActionPreference = 'Stop'
$dockerPath = Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\resources\bin\docker.exe'
function Sql([string]$Statement) {
  & $dockerPath compose -f wordpress-plugin/docker-compose.yml exec -T db mysql -u bemalearn -passessment bemalearn -e $Statement
  if ($LASTEXITCODE -ne 0) { throw 'Database command failed' }
}
$apiBase = 'http://localhost:8080/wp-json/bemalearn/v1'
$login = Invoke-RestMethod -Uri "$apiBase/auth/login" -Method Post -ContentType 'application/json' -Body '{"email":"instructor@example.test","password":"assessment123"}'
$reference = 'test_min_' + $Phase + '_' + [guid]::NewGuid().ToString('N')
$bodyPath = Join-Path $env:TEMP ($reference + '.json')
$outputPath = "evidence/task-4-minimum-$Phase.txt"
[System.IO.File]::WriteAllText($bodyPath, (@{ amountMinor = 1000; payoutReference = $reference } | ConvertTo-Json -Compress))
try {
  if ($Phase -eq 'before') {
    Sql "UPDATE wp_bl_withdrawals SET status='cancelled',cancelled_at=UTC_TIMESTAMP() WHERE id=1 AND instructor_id=2 AND status='pending';"
  }
  # Send the token over stdin to curl, without storing it in evidence or command arguments.
  $config = 'header = "Authorization: Bearer ' + $login.token + '"'
  $config | curl.exe -sS -i --max-time 20 --config - -H 'Content-Type: application/json' -H "Idempotency-Key: $reference" --data-binary "@$bodyPath" -o $outputPath "$apiBase/me/withdrawals"
  if ($LASTEXITCODE -ne 0) { throw 'HTTP request failed' }
  Get-Content $outputPath
  Add-Content evidence/task-4-curl.txt -Value "`nMinimum validation $Phase - assistant-executed curl -i. POST /me/withdrawals, amountMinor=1000, payoutReference=$reference, matching Idempotency-Key. Authorization: Bearer <redacted>"
  Get-Content $outputPath | Add-Content evidence/task-4-curl.txt
} finally {
  if ($Phase -eq 'before') {
    # Retain the test row for audit, but cancel it; restore the original pending row.
    Sql "UPDATE wp_bl_withdrawals SET status='cancelled',cancelled_at=UTC_TIMESTAMP() WHERE instructor_id=2 AND payout_reference='$reference'; UPDATE wp_bl_withdrawals SET status='pending',cancelled_at=NULL WHERE id=1 AND instructor_id=2; SELECT id,instructor_id,amount_minor,status FROM wp_bl_withdrawals;"
  }
  Remove-Item -LiteralPath $bodyPath -ErrorAction SilentlyContinue
  $login = $null
}
