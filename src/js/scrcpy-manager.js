const { app } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const { spawn, exec } = require('child_process');
const os = require('os');

class ScrcpyManager {
  constructor() {
    this.platform = process.platform;
    this.arch = process.arch;
    this.resourcesPath = app.isPackaged
      ? process.resourcesPath
      : path.join(__dirname, '..', '..', 'scrcpy-electron', 'resources');
    this.scrcpyBasePath = path.join(this.resourcesPath, 'scrcpy');
    
    // 确定平台特定文件夹
    this.platformFolder = this.getPlatformFolder();
    
    // 临时工作目录 - 某些系统可能需要复制到临时目录才能执行
    this.tempWorkDir = path.join(os.tmpdir(), 'scrcpy-electron');
    
    // 初始化
    this.initialize();
  }
  
  getPlatformFolder() {
    // 获取CPU架构
    const arch = process.arch;
    
    if (this.platform === 'win32') {
      // Windows平台: win32 或 win64
      return arch === 'x64' ? 'win64' : 'win32';
    } else if (this.platform === 'darwin') {
      // macOS平台: mac-arm64 或 mac-x64
      return arch === 'arm64' ? 'mac-arm64' : 'mac-x64';
    } else if (this.platform === 'linux') {
      // Linux平台: 所有架构使用同一目录
      return 'linux';
      
      /* 如果未来需要根据架构细分Linux版本，可使用以下代码：
      switch(arch) {
        case 'x64':
          return 'linux-x64';
        case 'arm64':
          return 'linux-arm64';
        case 'arm':
          return 'linux-arm';
        case 'ia32':
          return 'linux-ia32';
        case 'riscv64':
          return 'linux-riscv64';
        case 'ppc64':
          return 'linux-ppc64';
        case 's390x':
          return 'linux-s390x';
        default:
          // 未明确支持的架构使用通用Linux目录
          console.log(`未明确支持的Linux架构: ${arch}，使用通用Linux目录`);
          return 'linux';
      }
      */
    } else {
      throw new Error(`不支持的平台: ${this.platform} (${arch})`);
    }
  }
  
  initialize() {
    try {
      // 确保临时工作目录存在
      fs.ensureDirSync(this.tempWorkDir);
      
      // 检查是否已有打包的 scrcpy 文件
      const platformPath = path.join(this.scrcpyBasePath, this.platformFolder);
      if (!fs.existsSync(platformPath)) {
        throw new Error(`未找到该平台 ${this.platformFolder} 的 scrcpy 二进制文件，请确保 resources/scrcpy/${this.platformFolder} 目录下包含所需文件。`);
      }
      
      // 复制并设置可执行权限
      this.copyExecutablesToTemp();
    } catch (error) {
      console.error('初始化 scrcpy 管理器失败:', error.message.toString('utf8'));
    }
  }
  
  copyExecutablesToTemp() {
    try {
      const platformPath = path.join(this.scrcpyBasePath, this.platformFolder);
      
      if (!fs.existsSync(platformPath)) {
        const errorMsg = `Platform binary files not found for ${this.platformFolder}. Please ensure the required files exist in resources/scrcpy/${this.platformFolder} directory.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // 检查临时目录是否存在，不存在则创建
      if (!fs.existsSync(this.tempWorkDir)) {
        fs.mkdirSync(this.tempWorkDir, { recursive: true });
      }
      
      // 复制所有文件到临时目录
      try {
        fs.copySync(platformPath, this.tempWorkDir);
        console.log(`Successfully copied files from ${platformPath} to ${this.tempWorkDir}`);
      } catch (copyError) {
        throw new Error(`Failed to copy files: ${copyError.message}`);
      }
      
      // 设置可执行权限 (仅在macOS和Linux上需要)
      if (this.platform !== 'win32') {
        const executableFiles = ['scrcpy', 'adb'];
        
        for (const file of executableFiles) {
          const filePath = path.join(this.tempWorkDir, file);
          if (fs.existsSync(filePath)) {
            try {
              fs.chmodSync(filePath, 0o755); // 设置可执行权限
              console.log(`Set executable permission for ${file}`);
            } catch (chmodError) {
              console.warn(`Failed to set executable permission for ${file}: ${chmodError.message}`);
            }
          } else {
            console.warn(`Executable ${file} not found in temp directory`);
          }
        }
      }
    } catch (error) {
      console.error('复制可执行文件到临时目录失败:', error.message.toString('utf8'));
      throw error; // 向上传播错误以便调用者处理
    }
  }
  
  getScrcpyPath() {
    const execName = this.platform === 'win32' ? 'scrcpy.exe' : 'scrcpy';
    const tempPath = path.join(this.tempWorkDir, execName);
    
    if (!fs.existsSync(tempPath)) {
      const sourceScrcpyPath = path.join(this.scrcpyBasePath, this.platformFolder, execName);
      if (fs.existsSync(sourceScrcpyPath)) {
        try {
          this.copyExecutablesToTemp();
        } catch (copyError) {
          throw new Error(`未找到 scrcpy 可执行文件: ${tempPath}`);
        }
      } else {
        throw new Error(`未找到 scrcpy 可执行文件: ${tempPath}`);
      }
      if (!fs.existsSync(tempPath)) {
        throw new Error(`未找到 scrcpy 可执行文件: ${tempPath}`);
      }
    }
    return tempPath;
  }
  
  getAdbPath() {
    const execName = this.platform === 'win32' ? 'adb.exe' : 'adb';
    const tempPath = path.join(this.tempWorkDir, execName);
    
    if (!fs.existsSync(tempPath)) {
      // 检查原始资源目录是否有adb文件
      const sourceAdbPath = path.join(this.scrcpyBasePath, this.platformFolder, execName);
      if (fs.existsSync(sourceAdbPath)) {
        // 如果资源目录有adb文件但临时目录没有，尝试重新复制
        try {
          fs.copySync(sourceAdbPath, tempPath);
          console.log(`重新复制adb文件从 ${sourceAdbPath} 到 ${tempPath}`);
        } catch (copyError) {
          const errorMsg = `ADB executable not found at ${tempPath} and failed to copy from ${sourceAdbPath}\nPlease ensure:\n1. Android SDK is installed and environment variables are set\n2. The adb${this.platform === 'win32' ? '.exe' : ''} exists in resources/scrcpy/${this.platformFolder}\n3. Device is connected via USB with USB debugging enabled`;
          throw new Error(errorMsg);
        }
      } else {
        const errorMsg = `ADB executable not found at ${tempPath} and source path ${sourceAdbPath}\nPlease ensure:\n1. Android SDK is installed and environment variables are set\n2. The adb${this.platform === 'win32' ? '.exe' : ''} exists in resources/scrcpy/${this.platformFolder}\n3. Device is connected via USB with USB debugging enabled`;
        throw new Error(errorMsg);
      }
    }
    return tempPath;
  }
  
  /**
   * 执行 adb 命令并返回输出
   * @param {Array} args - adb 命令参数
   * @returns {Promise<string>} 命令输出
   */
  async execAdb(args) {
    return new Promise((resolve, reject) => {
      const adbPath = this.getAdbPath();
      const process = spawn(adbPath, args);
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`adb 命令失败 (${code}): ${stderr}`));
        }
      });
      
      process.on('error', (err) => {
        reject(new Error(`执行 adb 失败: ${err.message}`));
      });
    });
  }
  
  /**
   * 获取已连接的设备列表
   * @returns {Promise<Array>} 设备列表
   */
  async listDevices() {
    try {
      const output = await this.execAdb(['devices', '-l']);
      const lines = output.split('\n').slice(1); // 跳过第一行 "List of devices attached"
      const devices = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('*')) {
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 2) {
            const id = parts[0];
            const status = parts[1];
            
            // 提取附加信息（如果有）
            const info = {};
            for (let i = 2; i < parts.length; i++) {
              const [key, value] = parts[i].split(':');
              if (key && value) {
                info[key] = value;
              }
            }
            
            devices.push({ id, status, info, type: 'usb' });
          }
        }
      }
      
      return devices;
    } catch (error) {
      if (error.message.includes('ENOENT')) {
        console.error('获取设备列表失败: 未找到adb.exe，请确保：\n1. 已安装Android SDK并配置环境变量\n2. 或项目resources/scrcpy/win64目录下包含adb.exe\n3. 或使用数据线连接设备并开启USB调试模式');
      } else {
        console.error('获取设备列表失败:', error.message.toString('utf8'));
      }
      return [];
    }
  }
  
  /**
   * 获取设备的 IP 地址
   * @param {string} deviceId - 设备 ID
   * @returns {Promise<string>} 设备 IP 地址
   */
  async getDeviceIpAddress(deviceId) {
    try {
      // 先尝试获取 wlan0 接口 IP
      let ip = await this.execAdb(['-s', deviceId, 'shell', 
        "ip addr show wlan0 | grep 'inet ' | cut -d' ' -f6 | cut -d'/' -f1"]);
      
      if (!ip) {
        // 如果 wlan0 没有 IP，尝试 eth0
        ip = await this.execAdb(['-s', deviceId, 'shell', 
          "ip addr show eth0 | grep 'inet ' | cut -d' ' -f6 | cut -d'/' -f1"]);
      }
      
      if (!ip) {
        throw new Error('未找到设备 IP 地址。请确保 WiFi 已启用。');
      }
      
      return ip;
    } catch (error) {
      console.error('获取设备 IP 地址失败:', error);
      throw error;
    }
  }
  
  /**
   * 启用设备的 TCP/IP 模式
   * @param {string} deviceId - 设备 ID
   * @returns {Promise<boolean>} 成功状态
   */
  async enableTcpipMode(deviceId) {
    try {
      await this.execAdb(['-s', deviceId, 'tcpip', '5555']);
      
      // 等待一下让设备有时间切换模式
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('启用 TCP/IP 模式失败:', error);
      throw error;
    }
  }
  
  /**
   * 断开特定设备
   * @param {string} deviceId - 设备 ID
   * @returns {Promise<boolean>} 成功状态
   */
  async disconnectDevice(deviceId) {
    try {
      await this.execAdb(['disconnect', deviceId]);
      return true;
    } catch (error) {
      console.error('断开设备失败:', error);
      throw error;
    }
  }
  
  /**
   * 通过 WiFi 连接到设备
   * @param {string} deviceIp - 设备 IP 地址
   * @returns {Promise<string>} 连接结果
   */
  async connectOverWifi(deviceIp) {
    try {
      // 确保 IP 格式正确
      const ipAddress = deviceIp.includes(':') ? deviceIp : `${deviceIp}:5555`;
      
      const result = await this.execAdb(['connect', ipAddress]);
      
      if (result.includes('failed') || result.includes('error')) {
        throw new Error(`连接失败: ${result}`);
      }
      
      return result;
    } catch (error) {
      console.error('通过 WiFi 连接失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取通过 WiFi 连接的设备
   * @returns {Promise<Array>} WiFi 设备列表
   */
  async listWirelessDevices() {
    try {
      const allDevices = await this.listDevices();
      
      // 筛选出通过 IP:PORT 格式连接的设备（即无线设备）
      return allDevices.filter(device => 
        device.id.includes(':') || 
        (device.info && device.info.transportid && device.info.transportid.startsWith('wifi'))
      ).map(device => ({...device, type: 'wireless'}));
    } catch (error) {
      console.error('获取无线设备列表失败:', error);
      return [];
    }
  }
  
  /**
   * 获取通过 USB 连接的设备（排除无线设备）
   * @returns {Promise<Array>} USB 设备列表
   */
  async listUsbDevices() {
    try {
      const allDevices = await this.listDevices();
      return allDevices.filter(device => 
        !device.id.includes(':')
      ).map(device => ({...device, type: 'usb'}));
    } catch (error) {
      console.error('获取USB设备列表失败:', error);
      return [];
    }
  }
  
  /**
   * 运行 scrcpy 并返回进程
   * @param {Array} args - 命令行参数
   * @returns {Promise<ChildProcess>} 运行的进程
   */
  async runScrcpy(args = []) {
    const scrcpyPath = this.getScrcpyPath();
    
    // 设置环境变量以便 scrcpy 可以找到 adb
    const env = { ...process.env };
    env.ADB = this.getAdbPath();
    
    try {
      // 启动 scrcpy 进程
      const process = spawn(scrcpyPath, args, {
        env,
        stdio: 'pipe', // 或者 'inherit' 如果想直接显示输出
        detached: false
      });
      
      // 处理进程输出
      process.stdout.on('data', (data) => {
        console.log(`scrcpy stdout: ${data}`);
      });
      
      process.stderr.on('data', (data) => {
        console.error(`scrcpy stderr: ${data}`);
      });
      
      process.on('close', (code) => {
        console.log(`scrcpy 进程退出，退出码 ${code}`);
      });
      
      return process;
    } catch (error) {
      console.error('启动 scrcpy 失败:', error);
      throw error;
    }
  }
  
  /**
   * 使用单一命令执行无线连接
   * @param {string} [deviceIp] - 可选的设备 IP 地址，不提供则自动检测
   * @param {Array} [additionalArgs] - 额外的命令行参数
   * @returns {Promise<ChildProcess>} scrcpy 进程
   */
  async runScrcpyWireless(deviceIp, additionalArgs = []) {
    const args = deviceIp 
      ? ['-s', deviceIp, ...additionalArgs]
      : [...additionalArgs];
      
    return this.runScrcpy(args);
  }
  
  /**
   * 检查设备是否处于锁屏状态
   * @param {string} deviceId - 设备ID
   * @returns {Promise<boolean>} 是否锁屏
   */
  async isDeviceLocked(deviceId) {
    try {
      const result = await this.execAdb([
        '-s', deviceId, 'shell', 
        'dumpsys window | grep mDreamingLockscreen=true || dumpsys window | grep mShowingLockscreen=true'
      ]);
      
      return result.trim().length > 0;
    } catch (error) {
      console.error('检查设备锁屏状态失败:', error);
      return false;
    }
  }
  
  /**
   * 解锁设备屏幕
   * @param {string} deviceId - 设备ID
   * @param {string} password - 解锁密码
   * @returns {Promise<boolean>} 解锁结果
   */
  async unlockDevice(deviceId, password) {
    try {
      // 检查设备是否锁定
      const isLocked = await this.isDeviceLocked(deviceId);
      if (!isLocked) {
        console.log('设备未锁定，无需解锁');
        return true;
      }
      
      // 唤醒屏幕
      await this.execAdb(['-s', deviceId, 'shell', 'input keyevent KEYCODE_WAKEUP']);
      
      // 等待屏幕亮起
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 滑动解锁（从屏幕中间向上滑动）
      await this.execAdb(['-s', deviceId, 'shell', 'input swipe 500 1500 500 500']);
      
      // 等待滑动动画完成
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 如果提供了密码，则输入密码
      if (password && password.trim().length > 0) {
        // 输入密码
        for (const char of password) {
          await this.execAdb(['-s', deviceId, 'shell', `input text ${char}`]);
          // 短暂延迟，避免输入过快
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // 按确认键
        await this.execAdb(['-s', deviceId, 'shell', 'input keyevent KEYCODE_ENTER']);
      }
      
      // 等待解锁完成
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 再次检查是否解锁成功
      const stillLocked = await this.isDeviceLocked(deviceId);
      return !stillLocked;
    } catch (error) {
      console.error('解锁设备失败:', error);
      return false;
    }
  }
  
  /**
   * 清理临时资源
   */
  cleanup() {
    try {
      fs.removeSync(this.tempWorkDir);
      console.log('已清理临时文件:', this.tempWorkDir);
    } catch (error) {
      console.error('清理临时文件失败:', error);
    }
  }
}

module.exports = new ScrcpyManager();
