# Load the Newtonsoft.Json assembly for handling JSON
Add-Type -Path 'C:\path\to\Newtonsoft.Json.dll'

# Load the json file content
$jsonContent = Get-Content -Path "C:\path\to\yourJSONfile.json" -Raw

# Convert the json content to a Powershell object
$allData = [Newtonsoft.Json.JsonConvert]::DeserializeObject($jsonContent)

# Create an array to hold the data without tracks
$indexData = @()

# Loop through each record in the dataset
foreach ($data in $allData) {
  # Copy the data object so we don't alter the original while we work
  $dataCopy = $data | ConvertTo-Json -Depth 100 | ConvertFrom-Json

  # Write the tracks to a new json file named after the mixcloudKey value
  $dataCopy.tracks | ConvertTo-Json -Depth 100 | Set-Content -Path "C:\path\to\output\folder\$($dataCopy.mixcloudKey).json"

  # Nullify the tracks property in the data copy
  $dataCopy.tracks = $null

  # Add the data copy (without tracks) to the indexData array
  $indexData += $dataCopy
}

# Write the index data to a new index JSON file
$indexData | ConvertTo-Json -Depth 100 | Set-Content -Path "C:\path\to\output\folder\index.json"
