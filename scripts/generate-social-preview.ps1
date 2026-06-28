Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$root = Split-Path -Parent $PSScriptRoot
$backgroundPath = Join-Path $root "public\images\editorial\clinic-interior.jpg"
$doctorPath = Join-Path $root "public\images\editorial\doctor-female.jpg"
$outputOgPath = Join-Path $root "src\app\opengraph-image.png"
$outputTwitterPath = Join-Path $root "src\app\twitter-image.png"

$width = 2400
$height = 1260
$scaleFactor = $width / 1200

function Resolve-WorkspacePath {
  param(
    [string]$Path,
    [switch]$MustExist
  )

  if ([string]::IsNullOrWhiteSpace($Path)) {
    throw "Path cannot be empty."
  }

  $resolved = if ($MustExist) {
    (Resolve-Path -LiteralPath $Path).Path
  } else {
    [System.IO.Path]::GetFullPath($Path)
  }

  $workspaceRoot = [System.IO.Path]::GetFullPath($root)
  if (-not $resolved.StartsWith($workspaceRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to access path outside workspace: $resolved"
  }

  return $resolved
}

function Save-ImageAtomically {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$DestinationPath
  )

  $directory = Split-Path -Parent $DestinationPath
  if (-not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory | Out-Null
  }

  $tempPath = Join-Path $directory ([System.IO.Path]::GetRandomFileName() + ".png")
  try {
    $Bitmap.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Move-Item -LiteralPath $tempPath -Destination $DestinationPath -Force
  } finally {
    if (Test-Path -LiteralPath $tempPath) {
      Remove-Item -LiteralPath $tempPath -Force
    }
  }
}

function Scale {
  param([double]$Value)

  return [float]($Value * $scaleFactor)
}

function New-RoundedPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Draw-CoverImage {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Image]$Image,
    [float]$DestWidth,
    [float]$DestHeight
  )

  $scale = [Math]::Max($DestWidth / $Image.Width, $DestHeight / $Image.Height)
  $srcWidth = $DestWidth / $scale
  $srcHeight = $DestHeight / $scale
  $srcX = ($Image.Width - $srcWidth) / 2
  $srcY = ($Image.Height - $srcHeight) / 2
  $Graphics.DrawImage(
    $Image,
    (New-Object System.Drawing.RectangleF(0, 0, $DestWidth, $DestHeight)),
    (New-Object System.Drawing.RectangleF($srcX, $srcY, $srcWidth, $srcHeight)),
    [System.Drawing.GraphicsUnit]::Pixel
  )
}

$background = $null
$doctor = $null
$bitmap = $null
$graphics = $null
$baseOverlay = $null
$leftOverlay = $null
$accentGlow = $null
$panelBrush = $null
$panelPen = $null
$accentBarBrush = $null
$eyebrowBrush = $null
$featureLinePen = $null
$shadowBrush = $null
$brandFont = $null
$titleFont = $null
$subtitleFont = $null
$pillFont = $null
$captionFont = $null
$whiteBrush = $null
$mutedBrush = $null
$goldBrush = $null
$cyanBrush = $null
$pillBrush = $null
$doctorCardBrush = $null
$doctorCardPen = $null
$doctorImagePen = $null
$doctorShadowPath = $null
$panelPath = $null
$pill1 = $null
$pill2 = $null
$doctorCardPath = $null
$doctorImagePath = $null

try {
  $backgroundPath = Resolve-WorkspacePath -Path $backgroundPath -MustExist
  $doctorPath = Resolve-WorkspacePath -Path $doctorPath -MustExist
  $outputOgPath = Resolve-WorkspacePath -Path $outputOgPath
  $outputTwitterPath = Resolve-WorkspacePath -Path $outputTwitterPath

  $bitmap = New-Object System.Drawing.Bitmap($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $background = [System.Drawing.Image]::FromFile($backgroundPath)
  $doctor = [System.Drawing.Image]::FromFile($doctorPath)

  Draw-CoverImage -Graphics $graphics -Image $background -DestWidth $width -DestHeight $height

  $baseOverlay = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.RectangleF(0, 0, $width, $height)),
    [System.Drawing.Color]::FromArgb(235, 7, 18, 33),
    [System.Drawing.Color]::FromArgb(110, 7, 18, 33),
    0
  )
  $graphics.FillRectangle($baseOverlay, 0, 0, $width, $height)

  $leftOverlay = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.RectangleF(0, 0, (Scale 760), $height)),
    [System.Drawing.Color]::FromArgb(238, 8, 18, 36),
    [System.Drawing.Color]::FromArgb(24, 8, 18, 36),
    0
  )
  $graphics.FillRectangle($leftOverlay, 0, 0, (Scale 760), $height)

  $accentGlow = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(32, 122, 214, 224))
  $graphics.FillEllipse($accentGlow, (Scale 835), (Scale 52), (Scale 290), (Scale 290))
  $graphics.FillEllipse($accentGlow, (Scale 1010), (Scale 360), (Scale 170), (Scale 170))

  $panelPath = New-RoundedPath -X (Scale 76) -Y (Scale 88) -Width (Scale 616) -Height (Scale 446) -Radius (Scale 30)
  $panelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(60, 255, 255, 255))
  $panelPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(82, 255, 255, 255), (Scale 1.2))
  $graphics.FillPath($panelBrush, $panelPath)
  $graphics.DrawPath($panelPen, $panelPath)

  $accentBarBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.RectangleF(0, 0, (Scale 12), (Scale 180))),
    [System.Drawing.Color]::FromArgb(255, 226, 190, 116),
    [System.Drawing.Color]::FromArgb(255, 122, 214, 224),
    90
  )
  $graphics.FillRectangle($accentBarBrush, (Scale 118), (Scale 156), (Scale 12), (Scale 166))

  $brandFont = New-Object System.Drawing.Font("Segoe UI Semibold", (Scale 20), [System.Drawing.FontStyle]::Regular)
  $titleFont = New-Object System.Drawing.Font("Segoe UI Semibold", (Scale 25), [System.Drawing.FontStyle]::Bold)
  $subtitleFont = New-Object System.Drawing.Font("Segoe UI", (Scale 17), [System.Drawing.FontStyle]::Regular)
  $pillFont = New-Object System.Drawing.Font("Segoe UI Semibold", (Scale 16), [System.Drawing.FontStyle]::Regular)
  $captionFont = New-Object System.Drawing.Font("Segoe UI", (Scale 16), [System.Drawing.FontStyle]::Regular)

  $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(244, 249, 251, 255))
  $mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(228, 219, 228, 238))
  $goldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 226, 190, 116))
  $cyanBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 122, 214, 224))
  $eyebrowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(44, 255, 255, 255))
  $featureLinePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, 255, 255, 255), (Scale 1))
  $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(36, 0, 0, 0))

  $eyebrowPath = New-RoundedPath -X (Scale 146) -Y (Scale 118) -Width (Scale 214) -Height (Scale 40) -Radius (Scale 20)
  $graphics.FillPath($eyebrowBrush, $eyebrowPath)
  $graphics.DrawString("ADAKAN DENTAL KLINIK", $brandFont, $goldBrush, (Scale 170), (Scale 123))
  $graphics.DrawString(
    "Premium first impression.",
    $titleFont,
    $whiteBrush,
    (New-Object System.Drawing.RectangleF((Scale 146), (Scale 212), (Scale 404), (Scale 92)))
  )
  $graphics.DrawString(
    "A cleaner, more trustworthy social share experience before the site is even opened.",
    $subtitleFont,
    $mutedBrush,
    (New-Object System.Drawing.RectangleF((Scale 146), (Scale 314), (Scale 414), (Scale 92)))
  )

  $pillBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(38, 255, 255, 255))
  $pill1 = New-RoundedPath -X (Scale 146) -Y (Scale 458) -Width (Scale 164) -Height (Scale 42) -Radius (Scale 21)
  $pill2 = New-RoundedPath -X (Scale 324) -Y (Scale 458) -Width (Scale 150) -Height (Scale 42) -Radius (Scale 21)
  $graphics.FillPath($pillBrush, $pill1)
  $graphics.FillPath($pillBrush, $pill2)
  $graphics.DrawString("Online booking", $pillFont, $whiteBrush, (Scale 171), (Scale 469))
  $graphics.DrawString("Mobile first", $pillFont, $whiteBrush, (Scale 355), (Scale 469))
  $graphics.DrawLine($featureLinePen, (Scale 146), (Scale 530), (Scale 590), (Scale 530))
  $graphics.DrawString("Premium social preview", $captionFont, $cyanBrush, (Scale 146), (Scale 546))

  $doctorShadowPath = New-RoundedPath -X (Scale 772) -Y (Scale 98) -Width (Scale 366) -Height (Scale 434) -Radius (Scale 34)
  $graphics.FillPath($shadowBrush, $doctorShadowPath)
  $doctorCardPath = New-RoundedPath -X (Scale 760) -Y (Scale 86) -Width (Scale 366) -Height (Scale 434) -Radius (Scale 34)
  $doctorCardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(72, 10, 22, 40))
  $doctorCardPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 122, 214, 224), (Scale 1.6))
  $graphics.FillPath($doctorCardBrush, $doctorCardPath)
  $graphics.DrawPath($doctorCardPen, $doctorCardPath)

  $doctorImagePath = New-RoundedPath -X (Scale 788) -Y (Scale 114) -Width (Scale 310) -Height (Scale 248) -Radius (Scale 24)
  $graphics.SetClip($doctorImagePath)
  $doctorScale = [Math]::Max((Scale 310) / $doctor.Width, (Scale 248) / $doctor.Height)
  $doctorSrcWidth = (Scale 310) / $doctorScale
  $doctorSrcHeight = (Scale 248) / $doctorScale
  $doctorSrcX = ($doctor.Width - $doctorSrcWidth) / 2
  $doctorSrcY = 80
  $graphics.DrawImage(
    $doctor,
    (New-Object System.Drawing.RectangleF((Scale 788), (Scale 114), (Scale 310), (Scale 248))),
    (New-Object System.Drawing.RectangleF($doctorSrcX, $doctorSrcY, $doctorSrcWidth, $doctorSrcHeight)),
    [System.Drawing.GraphicsUnit]::Pixel
  )
  $graphics.ResetClip()
  $doctorImagePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 255, 255, 255), (Scale 1.2))
  $graphics.DrawPath($doctorImagePen, $doctorImagePath)

  $graphics.DrawString("Confident first impression", $pillFont, $cyanBrush, (Scale 790), (Scale 390))
  $graphics.DrawString(
    "Cleaner hierarchy and softer contrast.",
    $captionFont,
    $whiteBrush,
    (New-Object System.Drawing.RectangleF((Scale 790), (Scale 424), (Scale 262), (Scale 62)))
  )

  Save-ImageAtomically -Bitmap $bitmap -DestinationPath $outputOgPath
  Save-ImageAtomically -Bitmap $bitmap -DestinationPath $outputTwitterPath
}
finally {
  if ($graphics) { $graphics.Dispose() }
  if ($bitmap) { $bitmap.Dispose() }
  if ($background) { $background.Dispose() }
  if ($doctor) { $doctor.Dispose() }
  if ($baseOverlay) { $baseOverlay.Dispose() }
  if ($leftOverlay) { $leftOverlay.Dispose() }
  if ($accentGlow) { $accentGlow.Dispose() }
  if ($panelBrush) { $panelBrush.Dispose() }
  if ($panelPen) { $panelPen.Dispose() }
  if ($accentBarBrush) { $accentBarBrush.Dispose() }
  if ($brandFont) { $brandFont.Dispose() }
  if ($titleFont) { $titleFont.Dispose() }
  if ($subtitleFont) { $subtitleFont.Dispose() }
  if ($pillFont) { $pillFont.Dispose() }
  if ($captionFont) { $captionFont.Dispose() }
  if ($whiteBrush) { $whiteBrush.Dispose() }
  if ($mutedBrush) { $mutedBrush.Dispose() }
  if ($goldBrush) { $goldBrush.Dispose() }
  if ($cyanBrush) { $cyanBrush.Dispose() }
  if ($pillBrush) { $pillBrush.Dispose() }
  if ($doctorCardBrush) { $doctorCardBrush.Dispose() }
  if ($doctorCardPen) { $doctorCardPen.Dispose() }
  if ($doctorImagePen) { $doctorImagePen.Dispose() }
  if ($eyebrowBrush) { $eyebrowBrush.Dispose() }
  if ($featureLinePen) { $featureLinePen.Dispose() }
  if ($shadowBrush) { $shadowBrush.Dispose() }
  if ($panelPath) { $panelPath.Dispose() }
  if ($pill1) { $pill1.Dispose() }
  if ($pill2) { $pill2.Dispose() }
  if ($doctorCardPath) { $doctorCardPath.Dispose() }
  if ($doctorImagePath) { $doctorImagePath.Dispose() }
  if ($doctorShadowPath) { $doctorShadowPath.Dispose() }
  if ($eyebrowPath) { $eyebrowPath.Dispose() }
}
