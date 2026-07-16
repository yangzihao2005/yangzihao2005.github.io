# 开发环境与硬件环境
## 1.VSCode
作用:代码编辑器
下载链接：https://code.visualstudio.com/
## 2.Keil MDK
Keil MDK也被叫做MDK-ARM是一些开发工具的集合,即集成开发环境。

下载链接：https://www.keil.arm.com/mdk-community/

注意点:安装路径不带中文、安装目录独立放
![](/images/img-34.png)
Core是指Keil的安装根路径,Pack是指芯片包的安装路径。
Keil首次启动会加载Pack Installer,即包含了所有芯片的DFP(器件支持包),这些支持包包含了如STM32、GD32等芯片的核心固件库和启动文件。

我们直接在这个页面搜索STM32F103下载即可。
## 3.STM32CubeMX
作用:是硬件配置与初始化代码生成的图形化工具.
说人话就是只做点点点,不写代码，就能完成初始化配置代码。
下载链接：https://www.st.com/en/development-tools/stm32cubemx.html
### 3.1 首次使用STM32CubeMX
首次启动会自动检查更新,如果此时退出,会报错。我们需要点击下图箭头,等待变灰。
![](/images/img-35.png)
随偶点击Help下的Connection&Updates
![](/images/img-36.png)
STM32CubeMX安装固件库是需要意法半导体账号。下图是固件库的存储路径
![](/images/img-37.png)
![](/images/img-38.png)
## 4 硬件环境
初次入门,因此尽量挑选片上丰富的板子(MCU用的STM32F103ZET6)
![](/images/img-39.png)