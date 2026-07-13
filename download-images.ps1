$ProgressPreference = 'SilentlyContinue'

# 扫描所有 .md 文件中的 cdn.nlark.com 图片链接
$files = Get-ChildItem -Path "docs" -Recurse -Filter "*.md" | Select-Object -ExpandProperty FullName

$imageMap = @{}
$count = 0

foreach ($file in $files) {
  $content = Get-Content -LiteralPath $file -Raw
  $urlPattern = [regex]'https://cdn\.nlark\.com/[^)]+\.(png|jpg|jpeg|gif|webp)'
  $matches = $urlPattern.Matches($content)

  foreach ($match in $matches) {
    $url = $match.Value
    if (-not $imageMap.ContainsKey($url)) {
      $count++
      $ext = [System.IO.Path]::GetExtension($url)
      $filename = "img-$count$ext"
      $localPath = "/images/$filename"
      $imageMap[$url] = @{ LocalPath = $localPath; FileName = $filename }

      Write-Host "下载第 $count 张: $filename"
      Invoke-WebRequest -Uri $url -OutFile "docs/public/images/$filename"
    }
  }
}

# 替换所有文件中的 CDN 链接为本地路径
foreach ($file in $files) {
  $content = Get-Content -LiteralPath $file -Raw
  $changed = $false
  foreach ($url in $imageMap.Keys) {
    $localPath = $imageMap[$url].LocalPath
    $content = $content -replace [regex]::Escape($url), $localPath
    $changed = $true
  }
  if ($changed) {
    [System.IO.File]::WriteAllText($file, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "已更新: $file"
  }
}

Write-Host "`n完成！共下载 $count 张图片"
