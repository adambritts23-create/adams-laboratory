# Standalone raster scientific figure from the same calculated cell geometry as SVG.
Add-Type -AssemblyName System.Drawing
$viewData = Get-Content -Raw -LiteralPath 'docs/oxidation-state-fe-view.json' | ConvertFrom-Json
$bitmap = New-Object System.Drawing.Bitmap([int]$viewData.width, [int]$viewData.height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
function Brush($hex) { return [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($hex)) }
function Label($text, $x, $y, $size=18, $color='#e7f0f3', $bold=$false, $center=$false) {
 $style = if($bold){[System.Drawing.FontStyle]::Bold}else{[System.Drawing.FontStyle]::Regular}
 $font = [System.Drawing.Font]::new('Segoe UI',[float]$size,$style,[System.Drawing.GraphicsUnit]::Pixel)
 $brush = Brush $color
 if($center){$x -= $graphics.MeasureString($text,$font).Width/2}
 $graphics.DrawString([string]$text,$font,$brush,[float]$x,[float]$y)
 $font.Dispose(); $brush.Dispose()
}
$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#091a24'))
Label 'Iron • oxidation-state predominance' 70 22 32 '#e7f0f3' $true
Label 'Calculated validation prototype · 2,565 exact samples · public support pending' 70 70 18 '#a8beca'
Label 'Total Fe = 10⁻³ mol/kg H₂O · 25 °C · 1 bar (declared) · ideal · fixed pH / Eh' 70 102 18
$colors=@('#677780','#469ec2','#d09b58','#a181bb');$legend=@(('Fe(0) · '+$viewData.counts.'0'),('Fe(II) · '+$viewData.counts.'2'),('Fe(III) · '+$viewData.counts.'3'),('Fe(VI) · '+$viewData.counts.'6'))
for($i=0;$i -lt 4;$i++){$brush=Brush $colors[$i];$graphics.FillRectangle($brush,[float](75+245*$i),153,23,23);$brush.Dispose();Label $legend[$i] (109+245*$i) 149 19}
$plot=$viewData.plot
$graphics.SetClip([System.Drawing.RectangleF]::new([float]$plot.x,[float]$plot.y,[float]$plot.w,[float]$plot.h))
foreach($cell in $viewData.cells){$brush=Brush $cell.fill;$graphics.FillRectangle($brush,[float]$cell.x,[float]$cell.y,[float]($cell.w+0.1),[float]($cell.h+0.1));$brush.Dispose()}
$gridPen=[System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(32,255,255,255),1)
for($t=0;$t -le 14;$t+=2){$px=$plot.x+$t/14*$plot.w;$graphics.DrawLine($gridPen,[float]$px,[float]$plot.y,[float]$px,[float]($plot.y+$plot.h))}
for($i=0;$i -le 11;$i++){$v=-1+0.2*$i;$py=$plot.y+(1.2-$v)/2.2*$plot.h;$graphics.DrawLine($gridPen,[float]$plot.x,[float]$py,[float]($plot.x+$plot.w),[float]$py)}
foreach($water in $viewData.water){foreach($style in @(@('#14232c',4),@('#eef2ed',2))){$pen=[System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml($style[0]),[float]$style[1]);$pen.DashPattern=[single[]]@(5,4);$graphics.DrawLine($pen,[float]$water.x1,[float]$water.y1,[float]$water.x2,[float]$water.y2);$pen.Dispose()};Label $water.name ($plot.x+4/14*$plot.w) ($water.y1+($water.y2-$water.y1)*4/14-24) 15 '#14232c' $true}
foreach($label in $viewData.labels){Label $label.text ($label.x+1) ($label.y-17+1) 32 '#14232c' $true $true;Label $label.text $label.x ($label.y-17) 32 '#f1f6f8' $true $true}
$graphics.ResetClip()
$border=[System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#aac0cb'),1)
$graphics.DrawRectangle($border,[float]$plot.x,[float]$plot.y,[float]$plot.w,[float]$plot.h)
for($t=0;$t -le 14;$t+=2){Label ([string]$t) ($plot.x+$t/14*$plot.w) 791 17 '#e7f0f3' $false $true}
for($i=0;$i -le 11;$i++){$v=-1+0.2*$i;$py=$plot.y+(1.2-$v)/2.2*$plot.h;Label ($v.ToString('F1',[System.Globalization.CultureInfo]::InvariantCulture)) 71 ($py-12) 17 '#e7f0f3' $false $true}
Label 'pH' 665 828 20 '#e7f0f3' $false $true
$graphics.TranslateTransform(25,495);$graphics.RotateTransform(-90);Label 'Eh (V vs SHE)' 0 0 20 '#e7f0f3' $false $true;$graphics.ResetTransform()
Label 'Color indicates oxidation-state predominance, not physical appearance.' 70 868 17
Label 'Dots: no majority · diagonal hatch: tie · crosshatch: unavailable (none in this grid).' 70 898 16 '#b8cbd3'
Label 'Dashed: water H₂ / O₂ references · unit normalized fugacity, a(H₂O) = 1 · gas equilibrium not solved.' 70 927 16 '#b8cbd3'
Label 'Cell footprints represent sampled points, not exact boundaries. Eh limits are a validation range.' 70 956 16 '#b8cbd3'
Label 'Equilibrium classification does not predict formation times, corrosion rates or kinetic persistence.' 70 985 16 '#b8cbd3'
$bitmap.Save((Join-Path (Get-Location) 'docs/oxidation-state-fe-map.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose();$bitmap.Dispose();$gridPen.Dispose();$border.Dispose()
