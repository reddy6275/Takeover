Add-Type -AssemblyName System.Security
$encryptedBase64 = $env:IGCCSVC_DB
if (-not $encryptedBase64) {
    Write-Error "IGCCSVC_DB environment variable is not defined"
    exit 1
}
$bytes = [System.Convert]::FromBase64String($encryptedBase64)
$decryptedBytes = [System.Security.Cryptography.ProtectedData]::Unprotect(
    $bytes, 
    $null, 
    [System.Security.Cryptography.DataProtectionScope]::LocalMachine
)
$decryptedText = [System.Text.Encoding]::UTF8.GetString($decryptedBytes)
Write-Output "DECRYPTED_CONNECTION_STRING:$decryptedText"
