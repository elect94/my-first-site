# 미리보기용 간단한 로컬 웹 서버 (http://localhost:8080)
$root = Split-Path -Parent $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Host "Serving $root at http://localhost:8080/"
$types = @{ ".html"="text/html; charset=utf-8"; ".css"="text/css"; ".js"="application/javascript";
            ".svg"="image/svg+xml"; ".png"="image/png"; ".jpg"="image/jpeg"; ".jpeg"="image/jpeg";
            ".gif"="image/gif"; ".webp"="image/webp"; ".mp3"="audio/mpeg" }
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart("/")
  if ($path -eq "") { $path = "index.html" }
  $file = Join-Path $root $path
  $full = [IO.Path]::GetFullPath($file)
  # The browser may cancel a request midway (common for audio); ignore that error and keep serving
  if ($full.StartsWith($root) -and (Test-Path $full -PathType Leaf)) { try {
    $bytes = [IO.File]::ReadAllBytes($full)
    $ext = [IO.Path]::GetExtension($full).ToLower()
    $ctx.Response.ContentType = $(if ($types[$ext]) { $types[$ext] } else { "application/octet-stream" })
    $ctx.Response.AddHeader("Accept-Ranges", "bytes")
    $range = $ctx.Request.Headers["Range"]
    if ($range -match '^bytes=(\d*)-(\d*)$') {
      # Range request (needed for seeking in audio/video)
      $total = $bytes.Length
      if ($Matches[1] -eq "") { $start = [Math]::Max(0, $total - [int64]$Matches[2]); $end = $total - 1 }
      else { $start = [int64]$Matches[1]; $end = $(if ($Matches[2] -eq "") { $total - 1 } else { [Math]::Min([int64]$Matches[2], $total - 1) }) }
      $len = $end - $start + 1
      $ctx.Response.StatusCode = 206
      $ctx.Response.AddHeader("Content-Range", "bytes $start-$end/$total")
      $ctx.Response.ContentLength64 = $len
      $ctx.Response.OutputStream.Write($bytes, [int]$start, [int]$len)
    } else {
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
  } catch {} } else {
    $ctx.Response.StatusCode = 404
  }
  try { $ctx.Response.Close() } catch {}
}
