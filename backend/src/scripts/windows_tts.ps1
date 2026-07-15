param(
  [Parameter(Mandatory = $true)]
  [string]$OutputPath,

  [Parameter(Mandatory = $true)]
  [string]$Text,

  [string]$Voice = "en_GB-alan-medium"
)

Add-Type -AssemblyName System.Speech

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$installedVoices = $synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo }

if (-not $installedVoices -or $installedVoices.Count -eq 0) {
  throw "No system voices are installed."
}

$preferredVoice = $installedVoices | Where-Object {
  $_.Culture.Name -match '^en-GB' -and $_.Name -match 'George|Ryan|Male|David|Brian|Arthur'
} | Select-Object -First 1

if (-not $preferredVoice) {
  $preferredVoice = $installedVoices | Where-Object { $_.Culture.Name -match '^en-GB' } | Select-Object -First 1
}

if (-not $preferredVoice) {
  $preferredVoice = $installedVoices | Where-Object { $_.Culture.Name -match '^en' } | Select-Object -First 1
}

if (-not $preferredVoice) {
  $preferredVoice = $installedVoices | Select-Object -First 1
}

$directory = Split-Path -Path $OutputPath -Parent

if ($directory -and -not (Test-Path -LiteralPath $directory)) {
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
}

$synth.SelectVoice($preferredVoice.Name)
$synth.SetOutputToWaveFile($OutputPath)
$synth.Speak($Text)
$synth.SetOutputToDefaultAudioDevice()
$synth.Dispose()
