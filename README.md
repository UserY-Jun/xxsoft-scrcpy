# Android投屏助手 (Scrcpy Electron)

基于 [scrcpy](https://github.com/Genymobile/scrcpy) 和 [Electron](https://www.electronjs.org/) 开发的 Android 设备投屏工具，提供了简单易用的图形界面，支持 USB 和 WiFi 两种连接方式。

![应用截图](screenshot.png)

## 功能特性

- 📱 支持 USB 和 WiFi 两种方式连接 Android 设备
- 🌐 一键配置无线连接，无需手动输入复杂命令
- 🎮 友好的图形界面，无需记忆命令行参数
- ⚙️ 自定义投屏参数：分辨率、比特率、帧率等
- 🚀 内置 scrcpy，免去手动安装步骤
- 🔄 自动检测设备状态，实时更新连接信息
- 🔌 多设备管理，同时连接多个安卓设备

## 安装使用

### 下载预构建版本

从 [Releases](https://github.com/your-username/scrcpy-electron/releases) 页面下载适合您系统的安装包：

- Windows: `Android投屏助手-Setup-x.x.x.exe`
- macOS: `Android投屏助手-x.x.x.dmg`
- Linux: `Android投屏助手-x.x.x.AppImage` 或 `android-投屏助手_x.x.x_amd64.deb`

### 从源码构建

1. 克隆仓库

```bash
git clone https://github.com/your-username/scrcpy-electron.git
cd scrcpy-electron
```

2. 安装依赖

```bash
npm install
```

3. 准备 scrcpy 二进制文件（重要）

在构建应用前，需要将 scrcpy 的二进制文件放入对应的平台目录：

```
resources/scrcpy/
├── win32/    # Windows 32位版本的 scrcpy 文件
├── win64/    # Windows 64位版本的 scrcpy 文件
├── mac-x64/  # macOS Intel (x86_64) 版本的 scrcpy 文件
├── mac-arm64/# macOS Apple Silicon (arm64) 版本的 scrcpy 文件
└── linux/    # Linux 版本的 scrcpy 文件（适用于各种架构）
```

4. 启动开发版本

```bash
npm start
```

5. 构建分发版本

```bash
npm run build
```

## 获取 scrcpy 二进制文件

要使用预打包模式，您需要获取 scrcpy 的二进制文件：

### Windows

1. 从 [scrcpy 官方发布页](https://github.com/Genymobile/scrcpy/releases) 下载 Windows 版本的 zip 包（例如 `scrcpy-win64-v2.1.1.zip`）
2. 解压文件到 `resources/scrcpy/win/` 目录

### macOS

1. 使用 Homebrew 安装 scrcpy：`brew install scrcpy`
2. 找到安装位置：`which scrcpy` 和 `which adb`
3. 根据您的处理器架构，复制这些文件到相应目录：
   - Intel处理器：复制到 `resources/scrcpy/mac-x64/` 目录
   - Apple Silicon处理器：复制到 `resources/scrcpy/mac-arm64/` 目录
4. 确保包含所有必要的依赖库

### Linux

1. 安装 scrcpy（例如 `sudo apt install scrcpy`）
2. 找到安装位置：`which scrcpy` 和 `which adb`
3. 复制这些文件到 `resources/scrcpy/linux/` 目录
4. 确保包含所有必要的依赖库

## 使用方法

### USB 连接

1. 使用 USB 数据线连接 Android 设备到电脑
2. 确保设备已开启 USB 调试模式
3. 允许设备调试授权
4. 在应用中点击"刷新"按钮，设备将显示在 USB 设备列表中
5. 点击"选择"按钮，然后设置投屏参数
6. 点击"开始投屏"启动镜像

### WiFi 连接

1. 首先通过 USB 连接设备
2. 点击设备旁边的"启用 WiFi"按钮
3. 等待设备 IP 获取完成，此时您可以断开 USB 线
4. IP 地址会自动填入输入框，点击"连接"按钮
5. 连接成功后，设备将显示在无线设备列表中
6. 选择设备并启动投屏

## 常见问题

### Q: 无法检测到设备？

A: 请确保：
- 设备已开启 USB 调试模式（开发者选项中）
- 已在设备上允许 USB 调试授权
- 使用的是数据线而非充电线
- 尝试更换 USB 端口或数据线

### Q: 无线连接失败？

A: 请检查：
- 设备和电脑在同一局域网
- 设备 IP 地址是否正确
- 防火墙是否阻止了连接
- 设备的 TCP/IP 调试模式是否已启用

### Q: 投屏质量不佳？

A: 尝试调整以下参数：
- 降低分辨率（1280×720 通常是好的平衡点）
- 减小比特率（流畅度优先选择 2M）
- 降低帧率（选择 24 或 30）

## 系统要求

- **Windows**: Windows 10 64位 或更高版本
- **macOS**: macOS 10.15 (Catalina) 或更高版本
- **Linux**: 支持 scrcpy 的现代 Linux 分发版，如 Ubuntu 20.04+
- Android 设备需要 Android 5.0 (API 21) 或更高版本
- USB 数据线或同一局域网环境

## 技术栈

- Electron - 跨平台桌面应用框架
- scrcpy - Android 设备镜像和控制工具
- ADB (Android Debug Bridge) - 与 Android 设备通信

## 许可证

本项目基于 MIT 许可证开源。请注意，scrcpy 使用 [GPL-3.0 许可证](https://github.com/Genymobile/scrcpy/blob/master/LICENSE)。

## 鸣谢

- [Genymobile/scrcpy](https://github.com/Genymobile/scrcpy) - 提供核心功能的优秀工具
- [electron](https://www.electronjs.org/) - 跨平台桌面应用框架 