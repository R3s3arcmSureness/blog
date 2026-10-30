@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================
echo    博客发布  Blog Publish
echo ============================================
echo.

if not exist "node_modules" (
  echo [准备] 未检测到 node_modules，正在安装依赖...
  call npm ci
  if errorlevel 1 (
    echo [失败] 依赖安装失败，已中止。
    goto :done
  )
  echo.
)

echo [1/4] 本地构建校验（检查 frontmatter 是否正确）...
call npm run build
if errorlevel 1 (
  echo.
  echo [失败] 构建报错：frontmatter 缺字段或语法有问题。
  echo        本次没有推送任何内容，请修正后重试。
  goto :done
)
echo [完成] 构建通过。
echo.

echo [2/4] 暂存改动...
git add -A
git status --short
echo.

echo [3/4] 提交...
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "post: update articles"
  if errorlevel 1 (
    echo.
    echo [失败] 提交失败。请检查 git 身份配置：
    echo        git config user.name "你的名字"
    echo        git config user.email "你的邮箱"
    goto :done
  )
) else (
  echo [跳过] 没有新内容需要提交。
)
echo.

echo [4/4] 推送到 GitHub...
git push origin main
if errorlevel 1 (
  echo.
  echo [失败] 推送失败，请检查网络 / SSH 密钥。
  goto :done
)
echo [完成] 已推送，站点约 1~2 分钟后更新：
echo        https://r3s3arcmsureness.github.io/blog/

:done
echo.
pause
