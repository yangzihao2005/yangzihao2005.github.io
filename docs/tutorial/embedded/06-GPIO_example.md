# GPIO输出输入具体操作
## 1.GPIO输出-LED控制
通过配置一些寄存器,既可以完成对GPIOx的相关配置。就如同对洗衣机、空调进行参数设定,然后这些家用电器就按照你预设的参数进行工作一般。
:![](/images/img-113.png)

任务目标:通过配置MCU特定针脚,进行点灯

### 1.1 开发板硬件设计
:![](/images/img-114.png)
:![](/images/img-115.png)

使用外接电源:
- 如果使用开漏输出:对输出寄存器写1会使NMOS断开，形不成回路,没有压差，因此LED会熄灭；对输出寄存器写0会使NMOS闭合,形成回路，有压差，LED被点亮。
- 如果使用推挽输出:对输出寄存器写1会使PMOS闭合，NMPOS断开，形成回路，但是两端都是3.3V，因为外接了电源导致外部也是3.3V，没有压差，LED熄灭。对输出寄存器写0会使NMOS闭合，形成回路，有压差，LED被点亮。

### 1.2 软件设计
目标实现:
- 1.单灯点亮
- 2.单灯闪烁
- 3.跑马灯效果

### 1.3 配置
1.打开STM32CubeMX 新建立STM32F103ZET6工程

2.开启调试接口
:![](/images/img-116.png)

3.启用GPIO以及配置模式
:![](/images/img-117.png)

- GPIO output level:设置该引脚的初始电平值,严格意义上将是输出寄存器的初始值。
- GPIO mode:常见Output Push Pull(推挽输出)或者开漏输出。
- GPIO Pull-up/Pull-down:表示该引脚是否进行上拉/下拉。
- Maximum output speed:设置输出速度
- User Label:用户标签,当我们设置多个引脚时,可以通过标签给出一个"描述性信息",便于我们理解引脚的作用。

4.开启外部时钟源
:![](/images/img-118.png)

5.配置时钟树:

我们开发板上是⼀个8MHz的HSE晶振,如下图标识区域所⽰,需要选通8MHz晶振作为时钟源,并将系统运⾏最⼤频率配置到72MHz。
:![](/images/img-119.png)

6.项目名词、路径以及工具链配置  并生成项目
:![](/images/img-120.png)
>MDK-ARM 就是 Keil 这⼀套开发⼯具。STM32CubeMX 只是帮我们简化创建⼯程的过程, 开发代码/编译/烧录/调试 这些过程仍然是通过 Keil 完成。 

:![](/images/img-121.png)

### 1.4 认识项目目录结构
打开CubeMX生成的项目
:![](/images/img-122.png)

1.Application/MDK-ARM/
-  内部存放了启动文件startup_stm32f103xe.s(该启动文件由汇编代码实现,不需要我们手动拷贝了,直接生成)

2.Applation/User/Core/
- 包含了main.c(人口文件)、stm32f1xx_it.c(和中断处理相关的逻辑)、stm32f1xx_hal_msp.c:msp(MCU Support Package)内部包含一些硬件层的初始化。

3.Drivers/STM32F1xx_HAL_Driver/
- 存放了HAL库的源码实现。HAL库本身的实现源代码文件非常多,未来控制生成的二进制可执行程序的体积,STM32CubeMX会根据当前配置的外设,自动拷贝对应HAL库代码到工程中,确保未使用的部分不会被拷贝尽量,不会参与编译。后续如果需要引入其他的外设,在STM32CubeMX中重写配置对应外设,重新生成项目即可。


4.Drivers/CMSIS
- 存放了CMSIS的源码实现(HAL库会调用CMSIS来完成针对CPU核心的操作)

5.CMSIS(绿色图标)
- 知识表示项目中依赖了CMSIS,并不代表实际的文件

ST 官⽅推出了⼀套定义好的函数库,称为 HAL 库 (Hardware Abstraction Layer),可以让我们直接通过调⽤库函数的⽅式来完成上述所有外设寄存器的操作,简化了开发的流程,提⾼开发效率。CMSIS (Cortex MicroController Software Interface Standard) 是 ARM 公司为不同的芯⽚⼚商(ST, NXP, TI 等), 提供的⼀套底层的统⼀编程接⼝.

CMSIS (Cortex MicroController Software Interface Standard) 是 ARM 公司为不同的芯⽚⼚商(ST, NXP, TI 等), 提供的⼀套底层的统⼀编程接⼝.

STM32CubeMX下载的固件包位置:
:![](/images/img-123.png)

:![](/images/img-124.png)

- Drivers:HAL库核心内容(内部包含了大量的.h和.c文件),后续学习的HAL库函数都在这里
- Middlewares:中间件目录,所谓"中间件",指的是应用程序和HAL之间的部分。这部分内容基于HAL库核心来实现,供应用程序调用。例如文件系统,音视频操作,图形化界面,USB协议库等。
- Utilties:辅助工具。例如CPU使用率统计工具,嵌入式字体库,日志库等。
- Project:示例代码。
- Documentation:HAL介绍文档

>现在可以结合AI+HAL库源码+手册的方式进行学习。

:![](/images/img-125.png)
### 1.5 进行操作
单灯点亮
```
HAL_GPIO_WritePin(GPIOF,GPIO_PIN_8,GPIO_PIN_RESET);//点亮
```

单灯闪烁
```
//v1
HAL_GPIO_WritePin(GPIOF,GPIO_PIN_8,GPIO_PIN_RESET);//点亮
HAL_Delay(1000);
HAL_GPIO_WritePin(GPIOF,GPIO_PIN_8,GPIO_PIN_SET);//熄灭
HAL_Delay(1000);


//v2
HAL_GPIO_TogglePin(GPIOF,GPIO_PIN_8);//翻转
HAL_Delay(1000);    
```


跑马灯效果
```
uint16_t leds[] = {GPIO_PIN_8, GPIO_PIN_9, GPIO_PIN_10, GPIO_PIN_11};
#define LED_NUM (sizeof(leds) / sizeof(leds[0]))


// 先⼿动保证所有的LED都是熄灭的
for(int i = 0; i < LED_NUM; i++)
{
HAL_GPIO_WritePin(GPIOF, leds[i], GPIO_PIN_SET); // 设置低电平为点亮LED
}

while (1)
{
    /* USER CODE END WHILE */
    /* USER CODE BEGIN 3 */
    // 下⾯从左向右跑⼀圈
    for(int i = 0; i < LED_NUM; i++)
    {
    // 先点亮当前下标的LED灯
    HAL_GPIO_WritePin(GPIOF, leds[i], GPIO_PIN_RESET);
    // 等待200ms
    HAL_Delay(200);
    // 熄灭当前的LED灯，下⼀轮重新开始
    HAL_GPIO_WritePin(GPIOF, leds[i], GPIO_PIN_SET);
    } /
    / ⼀轮遍历完成，反向再来⼀圈
    for(int i = LED_NUM-1; i >= 0; i--)
    {
    // 先点亮
    HAL_GPIO_WritePin(GPIOF, leds[i], GPIO_PIN_RESET);
    // 等待200ms
    HAL_Delay(200);
    // 熄灭当前的LED灯，下⼀轮重新开始
    HAL_GPIO_WritePin(GPIOF, leds[i], GPIO_PIN_SET);
    }
}
```
>后续编写代码的时候, ⼀定要放到 "BEGIN" 和 "END" 之间，要不然重新⽣成代码，就会覆盖在注释之外的代码。

## 2.GPIO输出-按键检测
### 2.1 硬件
:![](/images/img-126.png)
共有4个按键SYS_SW1、SYS_SW2、SYS_SW3、SYS_SW4。这4个按键连接方式完全相同。这些按键在没有被按下的时候,GPIO引脚的输入状态为高电平(按键断开,引脚上拉到高电平);当按键按下时,GPIO引脚的输入状态为低电平(按键导通,引脚连接到地)。因此,只要判断按键检测引脚的输入电平高、低,即可判断按键状态。
### 2.2 消抖问题
在设计程序时我们假定了按键“松开”是⾼电平,按键“按下”是低电平。
当我们按下按键的时候,可能会出现抖动的问题。
:![](/images/img-127.png)

>按键抖动时间一般是5ms~20ms,常见5~10ms,工程上一般按20ms的"最坏情况"来设计消抖

施密特触发器能解决吗？
```
施密特触发器解决的是"信号不干净"的问题,而不是"信号乱跳"的问题。
抖动可能穿越施密特触发器的迟滞区域。
因此,这个抖动,MCU内部施密特触发器无法解决。
```

有硬件消抖解决(那个与按键并联的小电容)和软件消抖解决

>硬件消抖的电容只能只能衰减⾼频⽑刺,对于⼀些按键的按下后⾃⼰的机械抖动可持续数毫秒这就需要软件来滤除。
### 2.3 输入模式选择
根据硬件设计不同,输入选择模式也不同:

#### 2.3.1 方式1
:![](/images/img-128.png)

因为外部只有"下拉到地"(按键按下),没有"上拉到高"的能力。必须由MCU内部提供上拉电阻,引脚在按键松开时才能回到确定的高电平,从而使用01区分按键状态。因此这种情况就需要将GPIO配置成"上拉输入"模式。

#### 2.3.2 方式2
:![](/images/img-129.png)
因为外部只有"上拉到高"(按键按下),没有"下拉到低"的能力。必须由MCU内部提供下拉电阻,引脚在按键松开时才能回到确定的低电平,从而使用01区分按键状态。因此这种情况就需要将GPIO配置成"下拉输入"模式。

#### 2.3.3 方式3
:![](/images/img-130.png)
按键按下,GPIOx Pin接通到GND,引脚输入低电平,输入数据寄存器读到0;按键断开,GPIOx Pin接通到外部VDD(把引脚当导线),引脚输入数据寄存器读到1。由于外部有上拉电阻,且本身具有"上拉到高"和"下拉到低"的能力,所以只需要将GPIO配置成"浮空输入"模式。
>MCU内部提供上拉和下拉,本质是提供"缺省"的上拉和下拉能力。外部上拉,电阻阻值可以根据需求自由设置,远比使用MCU内部上拉灵活的多,所以很多人愿意用。

```
按键断开:3.3v-->上拉电阻--->引脚--->GPIO内部阻值(很大),此时不是回路。电流必须从电源正极（3.3V）流出来，再流回电源负极（GND），形成完整的闭环。

电压（电势）的传播：不需要电流。就像你的手摸到火线，哪怕你悬空没触电，你身上也带220V电压。同样，3.3V这个“电势”通过金属导线（电阻）瞬间就传到了GPIO引脚，所以引脚测得3.3V。

电流的流动：必须要有从正极流回负极的闭环路径。按键断开了，闭环就不存在，所以没有电流，电阻也就不分压。
```

#### 2.3.4 方式4
:![](/images/img-131.png)
外部提供了下拉电阻。按键按下,GPIOx Pin接通VDD,引脚输入高电平,输入数据寄存器读到1。按键断开,GPIOx Pin接通到外部下拉电阻(把引脚当导线)然后再接地,引脚输入低电平,输入数据寄存器读到0。由于外部有下拉电阻,且本身具有"上拉到高"和"下拉到低"的能力,因此只需要将GPIO配置成"浮空输入模式"。

而这个板子用的是方式3,即外部提供上拉能力,未来输入配置是浮空模式。

### 2.4 配置
开启调试、开启外部时钟源、配置时钟树、开启针脚GPIO输出--LED、开启针脚GPIO输入--按键  等省略。

:![](/images/img-132.png)
:![](/images/img-133.png)

### 2.5 实现
#### 2.5.1 按一下就亮,不按就不亮
```
//v1  可能会有问题
if(HAL_GPIO_ReadPin(GPIOG, GPIO_PIN_10) == GPIO_PIN_RESET)
{
HAL_GPIO_WritePin(GPIOF, GPIO_PIN_8, GPIO_PIN_RESET);
} 
else{
HAL_GPIO_WritePin(GPIOF, GPIO_PIN_8, GPIO_PIN_SET);
}

```
#### 2.5.2 按一下就亮,再按一下就灭
```
bool led_status = false; // false: 灭 true: 亮
while (1)
{
    if (HAL_GPIO_ReadPin(GPIOG, GPIO_PIN_10) == GPIO_PIN_RESET)
    {
        /* 延时消抖后⼆次确认，过滤机械抖动的⽑刺 */
        HAL_Delay(20);
        if (HAL_GPIO_ReadPin(GPIOG, GPIO_PIN_10) == GPIO_PIN_RESET)
        {
        led_status = !led_status;
        HAL_GPIO_WritePin(GPIOF, GPIO_PIN_8, led_status ? GPIO_PIN_RESET :GPIO_PIN_SET);
        } 
        // 不光考虑按下，也有考虑按完，这样后续逻辑就具有⽐较强的确定性了
        // 如果⽤⼾按下之后，⼀直处于低电平，就暂时不让while退出，直到⽤⼾松开，变成⾼
        while(HAL_GPIO_ReadPin(GPIOG, GPIO_PIN_10) == GPIO_PIN_RESET);
        HAL_Delay(20); // 保险起⻅，对松开也进⾏⼀下消抖
        } 
        /* USER CODE END WHILE */
        /* USER CODE BEGIN 3 */
}
```

#### 2.5.3 多LED,多按键(按下点亮,松开熄灭)
```
/* USER CODE BEGIN Includes */
#include <stdbool.h>
/* USER CODE END Includes */
/* USER CODE BEGIN PTD */
// ⽤⼾层⾃主命名，未来调⽤⽅便
typedef enum
{
    LED1 = 1,
    LED2,
    LED3,
    LED4
} LED_t;
typedef enum
{
    KEY1 = 1,
    KEY2,
    KEY3,
    KEY4
} KEY_t;

/* USER CODE END PTD */

/* USER CODE BEGIN PFP */
void BSP_Led_Control(LED_t led, bool flag);
void BSP_Led_Off(LED_t led);
void BSP_Led_On(LED_t led);
bool BSP_Key_IsPressed(KEY_t key);
/* USER CODE END PFP */

int main(void)
{
/* USER CODE BEGIN 1 */
/* USER CODE END 1 */
/* MCU Configuration--------------------------------------------------------
*/
/* Reset of all peripherals, Initializes the Flash interface and the
Systick. */
HAL_Init();
/* USER CODE BEGIN Init */
/* USER CODE END Init */
/* Configure the system clock */
SystemClock_Config();
/* USER CODE BEGIN SysInit */
/* USER CODE END SysInit */
/* Initialize all configured peripherals */
MX_GPIO_Init();
/* USER CODE BEGIN 2 */
/* USER CODE END 2 */
/* Infinite loop */
/* USER CODE BEGIN WHILE */
    while (1)
    {
        BSP_Key_IsPressed(KEY1) ? BSP_Led_On(LED1) : BSP_Led_Off(LED1);
        BSP_Key_IsPressed(KEY2) ? BSP_Led_On(LED2) : BSP_Led_Off(LED2);
        BSP_Key_IsPressed(KEY3) ? BSP_Led_On(LED3) : BSP_Led_Off(LED3);
        BSP_Key_IsPressed(KEY4) ? BSP_Led_On(LED4) : BSP_Led_Off(LED4);
    /* USER CODE END WHILE */
    /* USER CODE BEGIN 3 */
    } 
/* USER CODE END 3 */
}


/* USER CODE BEGIN 4 */
// flag : true, On, false:Off
void BSP_Led_Control(LED_t led, bool flag)
{
// 开漏模式,GPIO_PIN_RESET=0,表⽰点亮LED灯,否则，就是熄灭LED灯
GPIO_PinState state = flag ? GPIO_PIN_RESET : GPIO_PIN_SET;
switch (led)
    { 
        case LED1:
        HAL_GPIO_WritePin(GPIOF, GPIO_PIN_8, state);
        break;
        case LED2:
        HAL_GPIO_WritePin(GPIOF, GPIO_PIN_9, state);
        break;
        case LED3:
        HAL_GPIO_WritePin(GPIOF, GPIO_PIN_10, state);
        break;
        case LED4:
        HAL_GPIO_WritePin(GPIOF, GPIO_PIN_11, state);
        break;
        default:
        break;
    }
} 

void BSP_Led_Off(LED_t led)
{
    BSP_Led_Control(led, false);
} 

void BSP_Led_On(LED_t led)
{
    BSP_Led_Control(led, true);
} 

// BSP的全称是 Board Support Package,板级⽀持包
// 未消抖版本
bool BSP_Key_IsPressed(KEY_t key)
{
    bool ret = false;
    switch(key)
    {
    case KEY1:
    ret = (HAL_GPIO_ReadPin(GPIOG, GPIO_PIN_10) == GPIO_PIN_RESET);
    break;
    case KEY2:
    ret = (HAL_GPIO_ReadPin(GPIOG, GPIO_PIN_6) == GPIO_PIN_RESET);
    break;
    case KEY3:
    ret = (HAL_GPIO_ReadPin(GPIOG, GPIO_PIN_8) == GPIO_PIN_RESET);
    break;
    case KEY4:
    ret = (HAL_GPIO_ReadPin(GPIOG, GPIO_PIN_7) == GPIO_PIN_RESET);
    break;
    default:
    break;
    } 
    return ret;
} 
/* USER CODE END 4 */    
```

```
//消抖检测按键
/* USER CODE BEGIN PM */
#define KEY_DEBOUNCE_MS 20
/* USER CODE END PM */

bool BSP_Key_IsPressed(KEY_t key)
{
    bool ret = false;
    switch (key)
    { 
    case KEY1:
    {
        if (HAL_GPIO_ReadPin(GPIOG, GPIO_PIN_10) == GPIO_PIN_RESET)
        {
            /* 延时消抖后⼆次确认，过滤机械抖动的⽑刺 */
            HAL_Delay(KEY_DEBOUNCE_MS);
            if (HAL_GPIO_ReadPin(GPIOG, GPIO_PIN_10) == GPIO_PIN_RESET)
            {
            ret = true;
            }
        }
    } 
    break;
    case KEY2:
    {
        if (HAL_GPIO_ReadPin(GPIOG, GPIO_PIN_6) == GPIO_PIN_RESET)
        {
            /* 延时消抖后⼆次确认，过滤机械抖动的⽑刺 */
            HAL_Delay(KEY_DEBOUNCE_MS);
            if (HAL_GPIO_ReadPin(GPIOG, GPIO_PIN_6) == GPIO_PIN_RESET)
            {
            ret = true;
            }
        }
    } 
    break;
    case KEY3:
    {
        if (HAL_GPIO_ReadPin(GPIOG, GPIO_PIN_8) == GPIO_PIN_RESET)
        {
            /* 延时消抖后⼆次确认，过滤机械抖动的⽑刺 */
            HAL_Delay(KEY_DEBOUNCE_MS);
            if (HAL_GPIO_ReadPin(GPIOG, GPIO_PIN_8) == GPIO_PIN_RESET)
            {
            ret = true;
            }
        }
    } 
    break;
    case KEY4:
    {
        if (HAL_GPIO_ReadPin(GPIOG, GPIO_PIN_7) == GPIO_PIN_RESET)
        {
            /* 延时消抖后⼆次确认，过滤机械抖动的⽑刺 */
            HAL_Delay(KEY_DEBOUNCE_MS);
            if (HAL_GPIO_ReadPin(GPIOG, GPIO_PIN_7) == GPIO_PIN_RESET)
            {
            ret = true;
            }
        }
    } 
    break;
    default:
    break;
    } 
    return ret;
}
```