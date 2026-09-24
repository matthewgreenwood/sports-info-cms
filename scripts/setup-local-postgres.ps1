param(
  [string]$DumpPath,
  [string]$HostName = "127.0.0.1",
  [int]$Port = 5432,
  [ValidatePattern('^[A-Za-z_][A-Za-z0-9_]*$')]
  [string]$DatabaseName = "sports_info_cms_local",
  [ValidatePattern('^[A-Za-z_][A-Za-z0-9_]*$')]
  [string]$DatabaseUser = "strapi",
  [string]$DatabasePassword = "strapi",
  [string]$PostgresAdminUser = "postgres",
  [string]$PostgresAdminPassword,
  [switch]$Recreate,
  [string]$PsqlPath = "psql",
  [string]$PgRestorePath = "pg_restore"
)

$ErrorActionPreference = "Stop"

function Find-PostgresTool {
  param(
    [string]$ToolName,
    [string]$ConfiguredPath
  )

  if (Get-Command $ConfiguredPath -ErrorAction SilentlyContinue) {
    return $ConfiguredPath
  }

  $standardTool = Get-ChildItem "C:\Program Files\PostgreSQL" -Recurse -Filter $ToolName -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -match '\\bin\\' } |
    Sort-Object FullName -Descending |
    Select-Object -First 1

  if ($standardTool) {
    return $standardTool.FullName
  }

  return $ConfiguredPath
}

$PsqlPath = Find-PostgresTool -ToolName "psql.exe" -ConfiguredPath $PsqlPath
$PgRestorePath = Find-PostgresTool -ToolName "pg_restore.exe" -ConfiguredPath $PgRestorePath

if (-not (Get-Command $PsqlPath -ErrorAction SilentlyContinue)) {
  throw "PostgreSQL CLI tool '$PsqlPath' was not found. Install PostgreSQL locally or pass -PsqlPath with the full path to psql.exe."
}

if ($DumpPath -and -not ([System.IO.Path]::GetExtension($DumpPath).ToLowerInvariant() -eq ".sql") -and -not (Get-Command $PgRestorePath -ErrorAction SilentlyContinue)) {
  throw "PostgreSQL CLI tool '$PgRestorePath' was not found. Install PostgreSQL locally or pass -PgRestorePath with the full path to pg_restore.exe."
}

if ($DumpPath -and -not (Test-Path $DumpPath)) {
  throw "Dump file '$DumpPath' was not found. Replace the example path with the real VPS dump file path."
}

if (-not $PostgresAdminPassword) {
  $securePassword = Read-Host "PostgreSQL admin password for '$PostgresAdminUser'" -AsSecureString
  $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  try {
    $PostgresAdminPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  }
}

function ConvertTo-SqlLiteral {
  param([AllowNull()][string]$Value)

  return "'" + ($Value -replace "'", "''") + "'"
}

function Invoke-Psql {
  param(
    [string]$Database = "postgres",
    [string[]]$Arguments
  )

  & $PsqlPath -h $HostName -p $Port -U $PostgresAdminUser -d $Database @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "psql failed with exit code $LASTEXITCODE."
  }
}

if ($PostgresAdminPassword) {
  $env:PGPASSWORD = $PostgresAdminPassword
}

$quotedUser = '"' + $DatabaseUser + '"'
$quotedDatabase = '"' + $DatabaseName + '"'
$passwordLiteral = ConvertTo-SqlLiteral $DatabasePassword

Write-Host "Ensuring PostgreSQL role '$DatabaseUser' exists..."
$roleSql = @"
DO `$`$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DatabaseUser') THEN
    CREATE ROLE $quotedUser LOGIN PASSWORD $passwordLiteral;
  ELSE
    ALTER ROLE $quotedUser WITH LOGIN PASSWORD $passwordLiteral;
  END IF;
END
`$`$;
"@
Invoke-Psql -Arguments @("-v", "ON_ERROR_STOP=1", "-c", $roleSql)

if ($Recreate) {
  Write-Host "Recreating database '$DatabaseName'..."
  Invoke-Psql -Arguments @("-v", "ON_ERROR_STOP=1", "-c", "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DatabaseName' AND pid <> pg_backend_pid();")
  Invoke-Psql -Arguments @("-v", "ON_ERROR_STOP=1", "-c", "DROP DATABASE IF EXISTS $quotedDatabase;")
  Invoke-Psql -Arguments @("-v", "ON_ERROR_STOP=1", "-c", "CREATE DATABASE $quotedDatabase OWNER $quotedUser;")
} else {
  $databaseExists = & $PsqlPath -h $HostName -p $Port -U $PostgresAdminUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DatabaseName';"
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to check whether database '$DatabaseName' exists."
  }

  if (-not $databaseExists) {
    Write-Host "Creating database '$DatabaseName'..."
    Invoke-Psql -Arguments @("-v", "ON_ERROR_STOP=1", "-c", "CREATE DATABASE $quotedDatabase OWNER $quotedUser;")
  } else {
    Write-Host "Database '$DatabaseName' already exists. Use -Recreate to drop and recreate it."
  }
}

if ($DumpPath) {
  $resolvedDumpPath = Resolve-Path $DumpPath
  $extension = [System.IO.Path]::GetExtension($resolvedDumpPath.Path).ToLowerInvariant()

  Write-Host "Restoring '$($resolvedDumpPath.Path)' into '$DatabaseName'..."
  $env:PGPASSWORD = $DatabasePassword
  if ($extension -eq ".sql") {
    & $PsqlPath -h $HostName -p $Port -U $DatabaseUser -d $DatabaseName -v ON_ERROR_STOP=1 -f $resolvedDumpPath.Path
  } else {
    & $PgRestorePath -h $HostName -p $Port -U $DatabaseUser -d $DatabaseName --clean --if-exists --no-owner --verbose $resolvedDumpPath.Path
  }

  if ($LASTEXITCODE -ne 0) {
    throw "Database restore failed with exit code $LASTEXITCODE."
  }
}

Write-Host "Verifying local database..."
$env:PGPASSWORD = $DatabasePassword
& $PsqlPath -h $HostName -p $Port -U $DatabaseUser -d $DatabaseName -c "SELECT count(*) AS public_table_count FROM information_schema.tables WHERE table_schema = 'public';"
if ($LASTEXITCODE -ne 0) {
  throw "Verification query failed. Check the local database credentials in .env."
}

Write-Host "Local PostgreSQL database is ready for Strapi."