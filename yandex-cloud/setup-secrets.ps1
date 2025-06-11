# PowerShell script for automated GitHub Secrets setup for Yandex Cloud
# Usage: .\setup-secrets.ps1 -GitHubOwner YOUR_GITHUB_USERNAME -GitHubRepo YOUR_REPO_NAME

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubOwner,
    
    [Parameter(Mandatory=$true)]
    [string]$GitHubRepo
)

# Colors for output
function Write-ColorOutput($ForegroundColor, $Message) {
    $originalColor = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $host.UI.RawUI.ForegroundColor = $originalColor
}

Write-ColorOutput Blue "Starting GitHub Secrets setup for Yandex Cloud"
Write-Output ""

Write-ColorOutput Yellow "Repository: $GitHubOwner/$GitHubRepo"
Write-Output ""

# Check for GitHub CLI
if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-ColorOutput Red "GitHub CLI is not installed."
    Write-Output "Please install: https://cli.github.com/"
    exit 1
}

# Check for Yandex Cloud CLI
if (!(Get-Command yc -ErrorAction SilentlyContinue)) {
    Write-ColorOutput Red "Yandex Cloud CLI is not installed."
    Write-Output "Please install: https://cloud.yandex.ru/docs/cli/quickstart"
    exit 1
}

# Authenticate GitHub CLI
try {
    gh auth status | Out-Null
    Write-ColorOutput Green "GitHub CLI authenticated."
} catch {
    Write-ColorOutput Yellow "Authenticating GitHub CLI..."
    gh auth login
}

# Get data from Yandex Cloud
Write-ColorOutput Blue "Getting data from Yandex Cloud..."

$YcCloudId = yc config get cloud-id
$YcFolderId = yc config get folder-id

if ([string]::IsNullOrEmpty($YcCloudId) -or [string]::IsNullOrEmpty($YcFolderId)) {
    Write-ColorOutput Red "Yandex Cloud CLI is not configured."
    Write-Output "Please run: yc init"
    exit 1
}

Write-ColorOutput Green "Cloud ID: $YcCloudId"
Write-ColorOutput Green "Folder ID: $YcFolderId"

# Create Service Account for GitHub Actions
Write-ColorOutput Blue "Creating Service Account..."

$SaName = "github-actions-sa"

# Check if service account already exists
try {
    yc iam service-account get $SaName | Out-Null
    Write-ColorOutput Yellow "Service account $SaName already exists."
} catch {
    yc iam service-account create --name $SaName --description "Service Account for GitHub Actions"
    Write-ColorOutput Green "Service account created."
}

# Get Service Account ID
$SaId = (yc iam service-account get $SaName --format json | ConvertFrom-Json).id

# Assign roles
Write-ColorOutput Blue "Assigning roles..."
yc resource-manager folder add-access-binding $YcFolderId --role admin --subject "serviceAccount:$SaId"

Write-ColorOutput Green "Roles assigned."

# Create Service Account Key
Write-ColorOutput Blue "Creating Service Account key..."
$SaKeyFile = "sa-key.json"
yc iam key create --service-account-name $SaName --output $SaKeyFile

Write-ColorOutput Green "Key created: $SaKeyFile"

# Create Static Access Key for Object Storage
Write-ColorOutput Blue "Creating static access key..."
$AccessKeyOutput = yc iam access-key create --service-account-name $SaName --format json | ConvertFrom-Json
$YcStorageAccessKey = $AccessKeyOutput.access_key.key_id
$YcStorageSecretKey = $AccessKeyOutput.secret

Write-ColorOutput Green "Static access key created."

# Request bucket name
Write-Output ""
Write-ColorOutput Yellow "Enter bucket name (e.g., yourdomain.ru):"
$YcBucketName = Read-Host "Bucket name"

if ([string]::IsNullOrEmpty($YcBucketName)) {
    Write-ColorOutput Red "Bucket name cannot be empty."
    exit 1
}

# Setup GitHub Secrets
Write-Output ""
Write-ColorOutput Blue "Setting up GitHub Secrets..."

# Read Service Account Key content
$SaKeyContent = Get-Content $SaKeyFile -Raw

# Set secrets
Write-ColorOutput Yellow "Setting YC_SERVICE_ACCOUNT_KEY..."
$SaKeyContent | gh secret set YC_SERVICE_ACCOUNT_KEY --repo "$GitHubOwner/$GitHubRepo"

Write-ColorOutput Yellow "Setting YC_CLOUD_ID..."
$YcCloudId | gh secret set YC_CLOUD_ID --repo "$GitHubOwner/$GitHubRepo"

Write-ColorOutput Yellow "Setting YC_FOLDER_ID..."
$YcFolderId | gh secret set YC_FOLDER_ID --repo "$GitHubOwner/$GitHubRepo"

Write-ColorOutput Yellow "Setting YC_STORAGE_ACCESS_KEY..."
$YcStorageAccessKey | gh secret set YC_STORAGE_ACCESS_KEY --repo "$GitHubOwner/$GitHubRepo"

Write-ColorOutput Yellow "Setting YC_STORAGE_SECRET_KEY..."
$YcStorageSecretKey | gh secret set YC_STORAGE_SECRET_KEY --repo "$GitHubOwner/$GitHubRepo"

Write-ColorOutput Yellow "Setting YC_BUCKET_NAME..."
$YcBucketName | gh secret set YC_BUCKET_NAME --repo "$GitHubOwner/$GitHubRepo"

Write-ColorOutput Green "All GitHub Secrets configured!"

# Create bucket
Write-Output ""
Write-ColorOutput Blue "Creating Object Storage bucket..."

# Check for AWS CLI
if (!(Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-ColorOutput Yellow "AWS CLI is not installed. Bucket must be created manually."
    Write-Output "Please install AWS CLI: https://aws.amazon.com/cli/"
} else {
    # Configure AWS CLI for Yandex Object Storage
    aws configure set aws_access_key_id $YcStorageAccessKey --profile yandex
    aws configure set aws_secret_access_key $YcStorageSecretKey --profile yandex
    aws configure set region ru-central1 --profile yandex

    # Create bucket
    try {
        aws s3 mb "s3://$YcBucketName" --profile yandex --endpoint-url=https://storage.yandexcloud.net
        Write-ColorOutput Green "Bucket $YcBucketName created."
        
        # Configure public read access
        Write-ColorOutput Blue "Configuring public access..."
        aws s3api put-bucket-acl --bucket $YcBucketName --acl public-read --profile yandex --endpoint-url=https://storage.yandexcloud.net
        Write-ColorOutput Green "Public access configured."
    } catch {
        Write-ColorOutput Yellow "Bucket may already exist or an error occurred."
    }
}

# Cleanup
Write-Output ""
Write-ColorOutput Blue "Cleaning up temporary files..."
Remove-Item $SaKeyFile -Force -ErrorAction SilentlyContinue
Write-ColorOutput Green "Temporary files removed."

# Final message
Write-Output ""
Write-ColorOutput Green "SETUP COMPLETE!"
Write-Output ""
Write-ColorOutput Blue "Summary:"
Write-Output "  * Service Account: $SaName"
Write-Output "  * Cloud ID: $YcCloudId"
Write-Output "  * Folder ID: $YcFolderId"
Write-Output "  * Bucket: $YcBucketName"
Write-Output "  * GitHub Repo: $GitHubOwner/$GitHubRepo"
Write-Output ""
Write-ColorOutput Yellow "Next steps:"
Write-Output "  1. Push your code to the main branch."
Write-Output "  2. Go to GitHub Actions and monitor the deployment."
Write-Output "  3. Your site will be available at: https://$YcBucketName"
Write-Output ""
Write-ColorOutput Blue "Documentation: github-actions-setup.md" 