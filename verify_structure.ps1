# verify_structure.ps1
# Script de vérification de la structure du projet playwright_stealth
# Exécute ce script depuis la racine du projet

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🔍 VÉRIFICATION DE LA STRUCTURE - PLAYWRIGHT STEALTH" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# =============================================================================
# 1. VÉRIFICATION DE L'EMPLACEMENT
# =============================================================================

Write-Host "📌 1. Vérification de l'emplacement" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------"

$currentPath = Get-Location
Write-Host "   Chemin actuel: $currentPath"

# Vérifier la présence des fichiers clés
$rootFiles = @(
    "setup.py",
    "pyproject.toml",
    "__init__.py",
    "version.py"
)

$allRootFilesExist = $true
foreach ($file in $rootFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file présent" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file MANQUANT" -ForegroundColor Red
        $allRootFilesExist = $false
    }
}

if (-not $allRootFilesExist) {
    Write-Host ""
    Write-Host "⚠️  ATTENTION: Certains fichiers racine sont manquants." -ForegroundColor Yellow
    Write-Host "   Assurez-vous d'être à la racine du projet (playwright_stealth/)" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "   ✅ Emplacement correct" -ForegroundColor Green
Write-Host ""

# =============================================================================
# 2. VÉRIFICATION DES SOUS-DOSSIERS
# =============================================================================

Write-Host "📌 2. Vérification des sous-dossiers" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------"

$requiredFolders = @(
    "core",
    "models",
    "services",
    "adapters",
    "js",
    "cache",
    "config",
    "scripts",
    "migration",
    "diagnostics",
    "benchmark",
    "tests"
)

$allFoldersExist = $true
$foldersList = @()

foreach ($folder in $requiredFolders) {
    if (Test-Path $folder) {
        Write-Host "   ✅ $folder/ présent" -ForegroundColor Green
        $foldersList += $folder
    } else {
        Write-Host "   ❌ $folder/ MANQUANT" -ForegroundColor Red
        $allFoldersExist = $false
    }
}

if (-not $allFoldersExist) {
    Write-Host ""
    Write-Host "⚠️  ATTENTION: Des dossiers sont manquants." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""

# =============================================================================
# 3. VÉRIFICATION DES FICHIERS __init__.py
# =============================================================================

Write-Host "📌 3. Vérification des fichiers __init__.py" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------"

$allInitExist = $true

foreach ($folder in $foldersList) {
    $initFile = "$folder\__init__.py"
    if (Test-Path $initFile) {
        # Vérifier que le fichier n'est pas vide
        $content = Get-Content $initFile -Raw
        if ([string]::IsNullOrWhiteSpace($content)) {
            Write-Host "   ⚠️ $folder/__init__.py est VIDE" -ForegroundColor Yellow
            $allInitExist = $false
        } else {
            Write-Host "   ✅ $folder/__init__.py présent (non vide)" -ForegroundColor Green
        }
    } else {
        Write-Host "   ❌ $folder/__init__.py MANQUANT" -ForegroundColor Red
        $allInitExist = $false
    }
}

Write-Host ""

# =============================================================================
# 4. VÉRIFICATION DU DOSSIER playwright_stealth (package)
# =============================================================================

Write-Host "📌 4. Vérification du package playwright_stealth" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------"

if (Test-Path "playwright_stealth") {
    Write-Host "   ✅ Dossier playwright_stealth/ présent" -ForegroundColor Green
    
    # Vérifier le __init__.py du package
    if (Test-Path "playwright_stealth\__init__.py") {
        $content = Get-Content "playwright_stealth\__init__.py" -Raw
        if ([string]::IsNullOrWhiteSpace($content)) {
            Write-Host "   ⚠️ playwright_stealth/__init__.py est VIDE" -ForegroundColor Yellow
        } else {
            Write-Host "   ✅ playwright_stealth/__init__.py présent (non vide)" -ForegroundColor Green
        }
    } else {
        Write-Host "   ❌ playwright_stealth/__init__.py MANQUANT" -ForegroundColor Red
    }
    
    # Vérifier les sous-dossiers du package
    $packageFolders = @("core", "models", "services", "adapters", "js", "cache", "config")
    foreach ($folder in $packageFolders) {
        if (Test-Path "playwright_stealth\$folder") {
            Write-Host "   ✅ playwright_stealth/$folder/ présent" -ForegroundColor Green
        } else {
            Write-Host "   ❌ playwright_stealth/$folder/ MANQUANT" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ❌ Dossier playwright_stealth/ MANQUANT" -ForegroundColor Red
}

Write-Host ""

# =============================================================================
# 5. VÉRIFICATION DES FICHIERS ESSENTIELS
# =============================================================================

Write-Host "📌 5. Vérification des fichiers essentiels" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------"

$essentialFiles = @(
    "core\types.py",
    "core\profile.py",
    "core\engine.py",
    "models\plan.py",
    "models\snapshot.py",
    "services\builder.py",
    "services\injector.py",
    "adapters\playwright.py",
    "js\loader.py",
    "cache\memory.py"
)

$allEssentialExist = $true
foreach ($file in $essentialFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file présent" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file MANQUANT" -ForegroundColor Red
        $allEssentialExist = $false
    }
}

Write-Host ""

# =============================================================================
# 6. VÉRIFICATION DES SCRIPTS JS
# =============================================================================

Write-Host "📌 6. Vérification des scripts JS" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------"

$jsFiles = @(
    "js\audio.js",
    "js\canvas.js",
    "js\webgl.js",
    "js\chrome.runtime.js",
    "js\navigator.webdriver.js",
    "js\utils.js"
)

$jsCount = 0
foreach ($file in $jsFiles) {
    if (Test-Path $file) {
        $jsCount++
    }
}

Write-Host "   ✅ $jsCount/${jsFiles.Count} fichiers JS présents" -ForegroundColor Green
Write-Host ""

# =============================================================================
# 7. VÉRIFICATION DE L'INSTALLATION PIP
# =============================================================================

Write-Host "📌 7. Vérification de l'installation pip" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------"

$pipShow = pip show playwright-stealth 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Package playwright-stealth installé" -ForegroundColor Green
    $pipShow | Select-String "Version" | ForEach-Object { Write-Host "      $_" }
    $pipShow | Select-String "Location" | ForEach-Object { Write-Host "      $_" }
    $pipShow | Select-String "Editable" | ForEach-Object { Write-Host "      $_" }
} else {
    Write-Host "   ❌ Package playwright-stealth NON INSTALLÉ" -ForegroundColor Red
    Write-Host "      Exécute: pip install -e ." -ForegroundColor Yellow
}

Write-Host ""

# =============================================================================
# 8. VÉRIFICATION DES IMPORTS
# =============================================================================

Write-Host "📌 8. Vérification des imports" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------"

$imports = @(
    @{Module="playwright_stealth"; Import="stealth_sync"; Name="stealth_sync"},
    @{Module="playwright_stealth.core"; Import="HardwareTier"; Name="HardwareTier"},
    @{Module="adapters.playwright"; Import="stealth_sync"; Name="stealth_sync (adapters)"}
)

foreach ($import in $imports) {
    $testCommand = "from $($import.Module) import $($import.Import); print('✅ OK')"
    $result = python -c $testCommand 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ $($import.Name) import OK" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $($import.Name) import ÉCHEC" -ForegroundColor Red
        $errorMsg = $result | Select-Object -First 1
        Write-Host "      $errorMsg" -ForegroundColor DarkRed
    }
}

Write-Host ""

# =============================================================================
# 9. VÉRIFICATION DES TESTS
# =============================================================================

Write-Host "📌 9. Vérification des tests" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------"

if (Test-Path "tests\unit") {
    $unitTests = Get-ChildItem "tests\unit\*.py" -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne "__init__.py" }
    Write-Host "   ✅ Tests unitaires: $($unitTests.Count) fichiers" -ForegroundColor Green
}

if (Test-Path "tests\integration") {
    $integrationTests = Get-ChildItem "tests\integration\*.py" -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne "__init__.py" }
    Write-Host "   ✅ Tests d'intégration: $($integrationTests.Count) fichiers" -ForegroundColor Green
}

Write-Host ""

# =============================================================================
# 10. RÉSUMÉ FINAL
# =============================================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$totalChecks = 0
$totalPassed = 0

# Compter les vérifications
if ($allRootFilesExist) { $totalPassed++; $totalChecks++ } else { $totalChecks++ }
if ($allFoldersExist) { $totalPassed++; $totalChecks++ } else { $totalChecks++ }
if ($allInitExist) { $totalPassed++; $totalChecks++ } else { $totalChecks++ }
if ($allEssentialExist) { $totalPassed++; $totalChecks++ } else { $totalChecks++ }

$percentage = [math]::Round(($totalPassed / $totalChecks) * 100, 0)

Write-Host "   📁 Emplacement: $currentPath"
Write-Host "   📊 Taux de réussite: $percentage% ($totalPassed/$totalChecks)"
Write-Host ""

if ($percentage -ge 80) {
    Write-Host "✅ Structure VALIDE - Le projet est correctement configuré" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Pour tester les imports:" -ForegroundColor Yellow
    Write-Host "   python -c 'from playwright_stealth import stealth_sync; print(\"✅ OK\")'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Pour exécuter les tests:" -ForegroundColor Yellow
    Write-Host "   python run_all_tests.py" -ForegroundColor Gray
} elseif ($percentage -ge 50) {
    Write-Host "⚠️ Structure PARTIELLEMENT VALIDE - Des fichiers sont manquants" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Pour corriger:" -ForegroundColor Yellow
    Write-Host "   1. Copier les fichiers manquants" -ForegroundColor Gray
    Write-Host "   2. pip install -e ." -ForegroundColor Gray
} else {
    Write-Host "❌ Structure INVALIDE - Vérifiez que vous êtes à la racine du projet" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Pour corriger:" -ForegroundColor Yellow
    Write-Host "   cd C:\Users\jeffx\Documents\VsCode\playwright_stealth" -ForegroundColor Gray
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""