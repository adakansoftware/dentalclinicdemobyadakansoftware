Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backgroundPath = Join-Path $root "public\images\editorial\clinic-interior.jpg"
$doctorPath = Join-Path $root "public\images\editorial\doctor-male.jpg"
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
$panelPath = $null
$pill1 = $null
$pill2 = $null
$pill3 = $null
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

  $panelPath = New-RoundedPath -X (Scale 62) -Y (Scale 68) -Width (Scale 630) -Height (Scale 494) -Radius (Scale 34)
  $panelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(78, 255, 255, 255))
  $panelPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(95, 255, 255, 255), (Scale 1.6))
  $graphics.FillPath($panelBrush, $panelPath)
  $graphics.DrawPath($panelPen, $panelPath)

  $accentBarBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.RectangleF(0, 0, (Scale 16), (Scale 240))),
    [System.Drawing.Color]::FromArgb(255, 226, 190, 116),
    [System.Drawing.Color]::FromArgb(255, 122, 214, 224),
    90
  )
  $graphics.FillRectangle($accentBarBrush, (Scale 96), (Scale 130), (Scale 16), (Scale 226))

  $brandFont = New-Object System.Drawing.Font("Segoe UI Semibold", (Scale 20), [System.Drawing.FontStyle]::Regular)
  $titleFont = New-Object System.Drawing.Font("Segoe UI Semibold", (Scale 34), [System.Drawing.FontStyle]::Bold)
  $subtitleFont = New-Object System.Drawing.Font("Segoe UI", (Scale 18), [System.Drawing.FontStyle]::Regular)
  $pillFont = New-Object System.Drawing.Font("Segoe UI Semibold", (Scale 17), [System.Drawing.FontStyle]::Regular)
  $captionFont = New-Object System.Drawing.Font("Segoe UI", (Scale 17), [System.Drawing.FontStyle]::Regular)

  $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(244, 249, 251, 255))
  $mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(228, 219, 228, 238))
  $goldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 226, 190, 116))
  $cyanBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 122, 214, 224))

  $graphics.DrawString("ADAKAN DENTAL KLINIK", $brandFont, $goldBrush, (Scale 130), (Scale 120))
  $graphics.DrawString(
    "Premium clinic care",
    $titleFont,
    $whiteBrush,
    (New-Object System.Drawing.RectangleF((Scale 128), (Scale 184), (Scale 482), (Scale 72)))
  )
  $graphics.DrawString(
    "Built for sharp, trustworthy first impressions across WhatsApp, X, and shared links.",
    $subtitleFont,
    $mutedBrush,
    (New-Object System.Drawing.RectangleF((Scale 130), (Scale 286), (Scale 472), (Scale 86)))
  )

  $pillBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(38, 255, 255, 255))
  $pill1 = New-RoundedPath -X (Scale 130) -Y (Scale 438) -Width (Scale 182) -Height (Scale 46) -Radius (Scale 23)
  $pill2 = New-RoundedPath -X (Scale 326) -Y (Scale 438) -Width (Scale 170) -Height (Scale 46) -Radius (Scale 23)
  $pill3 = New-RoundedPath -X (Scale 130) -Y (Scale 496) -Width (Scale 214) -Height (Scale 46) -Radius (Scale 23)
  $graphics.FillPath($pillBrush, $pill1)
  $graphics.FillPath($pillBrush, $pill2)
  $graphics.FillPath($pillBrush, $pill3)
  $graphics.DrawString("Online booking", $pillFont, $whiteBrush, (Scale 158), (Scale 451))
  $graphics.DrawString("Mobile first", $pillFont, $whiteBrush, (Scale 356), (Scale 451))
  $graphics.DrawString("Premium social preview", $pillFont, $whiteBrush, (Scale 157), (Scale 509))

  $doctorCardPath = New-RoundedPath -X (Scale 760) -Y (Scale 78) -Width (Scale 372) -Height (Scale 474) -Radius (Scale 36)
  $doctorCardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(80, 10, 22, 40))
  $doctorCardPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(128, 122, 214, 224), (Scale 2))
  $graphics.FillPath($doctorCardBrush, $doctorCardPath)
  $graphics.DrawPath($doctorCardPen, $doctorCardPath)

  $doctorImagePath = New-RoundedPath -X (Scale 792) -Y (Scale 110) -Width (Scale 308) -Height (Scale 286) -Radius (Scale 28)
  $graphics.SetClip($doctorImagePath)
  $doctorScale = [Math]::Max((Scale 308) / $doctor.Width, (Scale 286) / $doctor.Height)
  $doctorSrcWidth = (Scale 308) / $doctorScale
  $doctorSrcHeight = (Scale 286) / $doctorScale
  $doctorSrcX = ($doctor.Width - $doctorSrcWidth) / 2
  $doctorSrcY = 210
  $graphics.DrawImage(
    $doctor,
    (New-Object System.Drawing.RectangleF((Scale 792), (Scale 110), (Scale 308), (Scale 286))),
    (New-Object System.Drawing.RectangleF($doctorSrcX, $doctorSrcY, $doctorSrcWidth, $doctorSrcHeight)),
    [System.Drawing.GraphicsUnit]::Pixel
  )
  $graphics.ResetClip()
  $doctorImagePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 255, 255, 255), (Scale 1.2))
  $graphics.DrawPath($doctorImagePen, $doctorImagePath)

  $graphics.DrawString("Confident first impression", $pillFont, $cyanBrush, (Scale 792), (Scale 426))
  $graphics.DrawString(
    "Sharper preview art with a premium, trustworthy tone before the site is even opened.",
    $captionFont,
    $whiteBrush,
    (New-Object System.Drawing.RectangleF((Scale 792), (Scale 458), (Scale 286), (Scale 60)))
  )

  $bitmap.Save($outputOgPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Save($outputTwitterPath, [System.Drawing.Imaging.ImageFormat]::Png)
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
  if ($panelPath) { $panelPath.Dispose() }
  if ($pill1) { $pill1.Dispose() }
  if ($pill2) { $pill2.Dispose() }
  if ($pill3) { $pill3.Dispose() }
  if ($doctorCardPath) { $doctorCardPath.Dispose() }
  if ($doctorImagePath) { $doctorImagePath.Dispose() }
}
