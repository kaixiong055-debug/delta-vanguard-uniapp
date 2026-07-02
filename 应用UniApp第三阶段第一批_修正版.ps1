$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pagesPath = Join-Path $repoRoot "pages.json"
$helperPath = Join-Path $repoRoot "sheep\helper\delta.js"

if (-not (Test-Path $pagesPath)) {
    throw "未找到 pages.json。请把脚本放到 UniApp 项目根目录后运行。"
}
if (-not (Test-Path $helperPath)) {
    throw "未找到 sheep/helper/delta.js。请确认脚本位于项目根目录。"
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

Copy-Item $pagesPath "$pagesPath.backup-$timestamp"
Copy-Item $helperPath "$helperPath.backup-$timestamp"

# ------------------------------------------------------------
# 1. 更新 DeltaRoute
# ------------------------------------------------------------
$helper = [System.IO.File]::ReadAllText($helperPath)

if ($helper -notmatch "CLUB_ORDER_DETAIL") {
    $routePattern = "(?m)^(\s*)CLUB_CLAIMED:\s*'/pages-delta/club/claimed/index',\s*$"
    $routeMatch = [regex]::Match($helper, $routePattern)

    if (-not $routeMatch.Success) {
        throw "sheep/helper/delta.js 中未找到 CLUB_CLAIMED 路由。为避免误改，脚本已停止。"
    }

    $indent = $routeMatch.Groups[1].Value
    $routeReplacement =
        $indent + "CLUB_CLAIMED: '/pages-delta/club/claimed/index'," + "`r`n" +
        $indent + "CLUB_ORDER_DETAIL: '/pages-delta/club/order/detail'," + "`r`n" +
        $indent + "CLUB_ORDER_WORKER_SELECT: '/pages-delta/club/order/worker-select',"

    $helper = [regex]::Replace(
        $helper,
        $routePattern,
        [System.Text.RegularExpressions.MatchEvaluator]{
            param($match)
            return $routeReplacement
        },
        1
    )

    [System.IO.File]::WriteAllText($helperPath, $helper, $utf8NoBom)
    Write-Host "已增加 DeltaRoute 路由常量。" -ForegroundColor Green
} else {
    Write-Host "DeltaRoute 已存在，跳过。" -ForegroundColor Yellow
}

# ------------------------------------------------------------
# 2. 更新 pages.json
# 不依赖固定换行和缩进，按 path 对象进行匹配
# ------------------------------------------------------------
$pages = [System.IO.File]::ReadAllText($pagesPath)

if ($pages -notmatch '"path"\s*:\s*"club/order/detail"') {
    $claimedPattern = '(?s)\{\s*"path"\s*:\s*"club/claimed/index"\s*,\s*"style"\s*:\s*\{\s*"navigationBarTitleText"\s*:\s*"我的已接挂牌"\s*,\s*"enablePullDownRefresh"\s*:\s*true\s*\}\s*,\s*"meta"\s*:\s*\{\s*"auth"\s*:\s*true\s*,\s*"title"\s*:\s*"我的已接挂牌"\s*,\s*"group"\s*:\s*"Delta 俱乐部"\s*\}\s*\}'

    $claimedMatch = [regex]::Match($pages, $claimedPattern)

    if (-not $claimedMatch.Success) {
        # 兼容 meta/style 字段顺序或格式有轻微差异的版本
        $claimedPattern = '(?s)\{\s*"path"\s*:\s*"club/claimed/index"\s*,.*?"group"\s*:\s*"Delta 俱乐部"\s*\}'
        $claimedMatch = [regex]::Match($pages, $claimedPattern)
    }

    if (-not $claimedMatch.Success) {
        throw "pages.json 中仍未找到 club/claimed/index 页面对象。请把当前 pages.json 发给我检查。"
    }

    $newRoutes = @'
,
        {
          "path": "club/order/detail",
          "style": {
            "navigationBarTitleText": "俱乐部订单详情"
          },
          "meta": {
            "auth": true,
            "title": "俱乐部订单详情",
            "group": "Delta 俱乐部"
          }
        },
        {
          "path": "club/order/worker-select",
          "style": {
            "navigationBarTitleText": "分派打手",
            "enablePullDownRefresh": true
          },
          "meta": {
            "auth": true,
            "title": "分派打手",
            "group": "Delta 俱乐部"
          }
        }
'@

    $matchedText = $claimedMatch.Value
    $replacement = $matchedText + $newRoutes

    $pages = $pages.Substring(0, $claimedMatch.Index) +
             $replacement +
             $pages.Substring($claimedMatch.Index + $claimedMatch.Length)

    # 验证 JSON 语法
    try {
        $null = $pages | ConvertFrom-Json
    } catch {
        throw "自动插入后 pages.json JSON 校验失败，已停止写入。错误：$($_.Exception.Message)"
    }

    [System.IO.File]::WriteAllText($pagesPath, $pages, $utf8NoBom)
    Write-Host "已增加俱乐部订单详情和分派打手页面路由。" -ForegroundColor Green
} else {
    Write-Host "pages.json 路由已存在，跳过。" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "更新完成。" -ForegroundColor Green
Write-Host "请检查：" -ForegroundColor Cyan
Write-Host "git diff --check"
Write-Host "git status --short"
Write-Host ""
Write-Host "建议启动后验证：" -ForegroundColor Cyan
Write-Host "俱乐部中心 → 我的已接挂牌 → 订单详情 → 分派打手"
