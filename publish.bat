@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================
echo    博客发布  Blog Publish
echo ============================================
echo.

rem ---------- 定位 Git（系统 PATH 里通常没有 Git）----------
set "GITROOT="
if exist "%LOCALAPPDATA%\Programs\WorkBuddy\resources\vendor\PortableGit\mingw64\bin" set "GITROOT=%LOCALAPPDATA%\Programs\WorkBuddy\resources\vendor\PortableGit"
if not defined GITROOT if exist "C:\Program Files\Git\mingw64\bin" set "GITROOT=C:\Program Files\Git"
if not defined GITROOT if exist "C:\Program Files (x86)\Git\mingw64\bin" set "GITROOT=C:\Program Files (x86)\Git"
if not defined GITROOT if exist "%LOCALAPPDATA%\Programs\Git\mingw64\bin" set "GITROOT=%LOCALAPPDATA%\Programs\Git"
if not defined GITROOT goto :nogit
set "PATH=%GITROOT%\mingw64\bin;%GITROOT%\usr\bin;%PATH%"
set "GIT="
for /f "delims=" %%G in ('where git.exe 2^>nul') do if not defined GIT set "GIT=%%G"
if not defined GIT goto :nogit
echo [准备] git: %GIT%
echo.

rem ---------- 定位 npm ----------
set "NPM="
for /f "delims=" %%N in ('where npm.cmd 2^>nul') do if not defined NPM set "NPM=%%N"
if not defined NPM if exist "C:\Program Files\nodejs\npm.cmd" set "NPM=C:\Program Files\nodejs\npm.cmd"
if not defined NPM goto :nonpm
echo [准备] npm: %NPM%
echo.

if exist "node_modules" goto :clean
echo [准备] 未检测到 node_modules，正在安装依赖...
call "%NPM%" ci
if errorlevel 1 goto :faildep
echo.

:clean
echo [准备] 清理构建缓存（避免已删除的文章残留）...
if exist "node_modules\.astro" rmdir /s /q "node_modules\.astro"
if exist ".astro" rmdir /s /q ".astro"
if exist "dist" rmdir /s /q "dist"
echo.

echo [1/4] 本地构建校验（检查 frontmatter 是否正确）...
call "%NPM%" run build
if errorlevel 1 goto :failbuild
echo [完成] 构建通过。
echo.

echo [2/4] 暂存改动...
"%GIT%" add -A
"%GIT%" status --short
echo.

echo [3/4] 提交...
"%GIT%" diff --cached --quiet
if errorlevel 1 goto :commit
echo [跳过] 没有新内容需要提交。
goto :push

:commit
"%GIT%" commit -m "post: update articles"
if errorlevel 1 goto :failcommit

:push
echo.
echo [4/4] 推送到 GitHub...
"%GIT%" push origin main
if errorlevel 1 goto :failpush
echo [完成] 已推送，站点约 1~2 分钟后更新：
echo        https://r3s3arcmsureness.github.io/blog/
goto :done

:nogit
echo [失败] 找不到 git。
echo        本机未安装 Git for Windows，也没找到 WorkBuddy 自带的 Git。
echo        请安装后重试。
goto :done

:nonpm
echo [失败] 找不到 npm（Node.js）。请安装 Node.js 后重试。
goto :done

:faildep
echo [失败] 依赖安装失败，已中止。
goto :done

:failbuild
echo.
echo [失败] 构建报错：frontmatter 缺字段或语法有问题。
echo        本次没有推送任何内容，请修正后重试。
goto :done

:failcommit
echo.
echo [失败] 提交失败。请检查 git 身份配置：
echo        "%GIT%" config user.name "你的名字"
echo        "%GIT%" config user.email "你的邮箱"
goto :done

:failpush
echo.
echo [失败] 推送失败，请检查网络 / SSH 密钥。
goto :done

:done
echo.
pause
