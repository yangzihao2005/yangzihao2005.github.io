# 总线与寄存器基础
## 1.学习完GPIO后,再总览全局一下
我们在入门阶段,大部分视角都在MCU内部。

总线、存储器映射、哈弗架构、寄存器操作原理等,都是指的是MCU内部的结构。而MCU外部的大部分由厂商提供的外设元器件叫做板级外设。
```
上述我们学过的GPIO就是MCU内部的一个外设(外设控制器,也叫片上外设,片指代的是MCU),之后会有其他的外设。我们学习这些外设后,用来配合我们完成特定功能或者项目需要所设定的。
```
![](/images/img-134.png)
![](/images/img-135.png)
![](/images/img-136.png)
## 2.总线
各种片上外设要被Cortex-M3内核控制,就需要Cortex-M3内核能访问这些片上外设,要访问就必须得通过"线"链接起来。这些"线"就叫做总线。

MCU系统结构体图:
![](/images/img-137.png)

总线即连接了STM32内部各个部分,传输控制信号和数据信号。
总线相当于"火车轨道",轨道上运行的火车就是"数据"。

几个重要的总线:
![](/images/img-138.png)

- 指令总线I-Bus/ICode:IBus中的I表示Instruction,即指令。我们写好的程序经过编译之后都是一条条指令,存放在FLASH中,内核要读取这些指令来执行程序就必须通过IBus总线,它几乎每时每刻都需要被使用,它是专门用来取指的。(我们编译生成的是二进制文件被烧录到STM32的Flash中的,这个二进制文件包含了要执行的指令,也就是我们通过C语言编写的逻辑。)

- 数据总线D-Bus/DCode:DBus中的D表示Data,即数据,那说明这条总线是用来取数的。我们在写程序的时候,数据有常量和变量两种。(常量是不变的,放到内部的Flash中;变量是可变的,不管是全局变量还是局部变量都放在内部的SRAM),通过DBus从Flash中读取常量,向SRAM中读写变量。

- 系统总线System:当CPU需要控制外设时,也会通过System总线向SRAM特定位置(地址)写入特定数值。这样的数据不会真的写入SRAM,而是由总线矩阵识别出写入的内存位置和外设之间的对应关系,把这个数据写入到对应的外设上。

- DMA总线:DMA的核心作用是实现外设与内存、或内存与内存之间的高速数据传输,无需CPU直接干预,从而显著提升系统效率并减轻CPU负担。DMA总线是外设和总线矩阵之间的桥梁。(比如:STM32连接了一个温度传感器,温度传感器就可以把外界温度读取到,直接通过DMA总线写入到SRAM中,这个过程不需要CPU参与,节省了CPU开销)

总线主设备是能够主动发起总线访问请求的硬件单元。
总线从设备是被动响应主设备访问请求的硬件模块。
![](/images/img-139.png)
![](/images/img-140.png)

## 3.总线矩阵
这里我们先不谈DMA

问题:但是不同的外设,处理信息的速度不同,有的快,有的慢。于是,就需要配上不同的"线",来控制不同的设备,这样才更具有性价比。就如同:高速路 vs 村路
![](/images/img-141.png)

可是，所有的线都从 CPU 引出(注意这里说的 CPU 而不是 MCU)，这样势必会导致 CPU 需要太多引脚，体积变大。
解决办法是使用总线矩阵，来简化相关设备的访问，从而可以有效减少主设备需要的针脚数。
![](/images/img-142.png)

可是即便同样都是片上外设，大家的速度也有差异，比如 SPI 要比 I2C 快上 1 到 2 个数量级。(周期频率 SPI 快)。
于是为了适配不同速度的外设，又引出了一条慢的线和更慢的线。
![](/images/img-143.png)

## 4.再次认识一下总线
```
可是,每一侧接入的外设,不是同时工作的,而且大家的工作速度在不同状态下,也是有不同的差别的啊,那怎么解决？


为了实现分好类的两类线上，各个大类中不同外设的速度不同，所以就需要"线"上的信号速度可调，方便满足不同的设备。所以又引入"桥"设备---一个协议转换器和速度适配器。
```
![](/images/img-144.png)
![](/images/img-145.png)

所有的数据如果都走总线矩阵的话那么大家就需要"仲裁"排队。对于高频访问的设备，我们就拉"专线"访问。
![](/images/img-146.png)

可以理解成 ICode（读取指令） 和 Dcode（读取常量） 是专门围绕 flash 来展开的。
![](/images/img-147.png)

AHB 相当于高速公路，APB2/APB1 相当于村里的路。高速主干低速分支。
![](/images/img-148.png)

AHB 高性能总线、APB 外设总线是一把线(<---->，图里经常这样表示)
![](/images/img-152.png)
![](/images/img-153.png)
## 5.理解哈弗架构
指令和数据分别存储，并行访问的模式叫哈佛架构
![](/images/img-149.png)

## 6.STM32程序执行过程
编译:编译C语言代码程序,生成二进制可执行文件

烧录:把生成的二进制可执行文件,通过一定的方式放到STM32内置的Flash中。

运行:
- CPU通过IBus从Flash中读取程序要执行的指令,并依次执行。
- CPU通过DBus从Flash中读取运行指令时需要依赖的常量。
- 代码中的"变量"放到SRAM中,CPU通过SBus读写这些变量(特殊情况通过DBus来读写SRAM)。
- 当CPU需要控制外设时,也会通过SBus向SRAM特定位置(地址)写入特定数值。这样的数据不会真的写入SRAM,而是由总线矩阵识别出写入的内存位置和外设之间的对应关系,把这个数据写入到对应的外设上。

![](/images/img-150.png)

代码在 flash，常量也在 flash。都在 flash 里面，但是读取指令和读取数据是用两条专线分别读取的。除此之外，出现的变量都会通过 sys 写到内存当中。

## 7.控制片上外设的本质
寄存器是硬件设备内部包含的一个用于存储/控制的单位。在CPU内核中有寄存器,在外设中也有寄存器。在嵌入式开发中谈到的寄存器,通常指的是外设中的寄存器。

外设的寄存器和外设硬件的电路是直接相连接的,读写这些寄存器,就能直接对外设的硬件电路产生影响。因此,控制外设的方式,就是读写外设的寄存器。
```
举个例⼦, ⽐如电⻛扇.电⻛扇上有旋钮, 旋转到不同的位置, 就可以控制⻛⼒⼤⼩. 这是因为旋钮背后连接着电机的电路, 就可以控制电机的转速.  

STM32 的外设的寄存器, 就相当于电⻛扇的旋钮, 可以通过给寄存器设置不同的值, 影响到电路的不同效果, 从⽽实现不同的功能.  
```

STM32F103相关的寄存器:
![](/images/img-151.png)

这些寄存器分成几个类别:
- 控制寄存器:写入寄存器的值,控制外设的工作行为。例如"Port configuration register low"和"Port configuration register high",可以去控制GPIO引脚的工作模式和速度。
- 数据寄存器:用于存储特定功能的数据。例如"Port input data register",能够读取到引脚输入的电平数值。
- 状态寄存器:表示当前外设的工作状态。对于GPIO不涉及,但是像USART,DAC等外设会包含。

目前的现状是,一个STM32上会有很多外设,每个外设上又有很多寄存器。如何对这些寄存器进行统一的管理,统一的操作,就是比较重要的问题。

寄存器这些是从参考手册得来的,那从官方网站的到的数据手册和参考手册有什么区别呢？
- 数据手册:聚焦具体型号的电气特性、引脚定义、封装信息和性能参数。常用于硬件设计阶段选型与原理图绘制。
- 参考手册:详细描述芯片架构、外设工作原理、寄存器配置以及功能实现。开发者通过该手册掌握外设驱动编写和寄存器操作逻辑。

例如:STM32F103ZET6的内部结构图在数据手册,寄存器详细说明在参考手册。

## 8.统一编址
STM32属于"改进型"哈弗体系结构
-  物理层面上,指令和数据分离,并且提供了独立的指令总线和数据总线。
-  逻辑层面上,把SRAM,Flash,其他各种外设进行统一编址,简化开发模型,提高开发的便利性。

```
理解统一编址
类似于去一些大型超市。这个大超市中有很多不同类别的商品....其中每个商品都会有一个统一规则的条形码。超市对商品管理时,如查询货架位置、仓储状态变更等,都通过这个条形码统一管理。
```
![](/images/img-154.png)
先谈一下上图灰色部分。

1.读取内存例子:
![](/images/img-155.png)
![](/images/img-156.png)
![](/images/img-157.png)
![](/images/img-158.png)


2.向GPIO写数据
![](/images/img-159.png)
![](/images/img-160.png)
![](/images/img-161.png)

```
从CPU的角度看,访问内存和访问片上外设没有本质区别,都是读或写操作。因此,我们只需要给内存的每个存储单元,以及每个片上外设的寄存器,都分配一个唯一的、不重叠的地址。这样,CPU就可以通过不同的地址来访问不同的目标。
从C语言角度,就可以直接使用指针,访问任意位置,可以访问内存,也可以直接访问片上外设,这个叫做统一编址。
对片上外设进行访问本质是对该片上外设寄存器的读写。对内存的访问,也是对特定位置的读写。
```

在我们看来，所有的"存储空间"，叫做统一编址。
![](/images/img-162.png)

所以，我们访问 GPIO 进行点灯。比如说 GPIOF，包括 GPIOF内部的各种寄存器，一定有自己的具体物理地址，供我们直接使用。
## 9.统一编址与寄存器
### 9.1 存储器映射
在 STM32 中, 把所有的主线从设备 (FLASH，RAM，FSMC 和 APB 外设), 分配地址. 每个外设占据⼀个地址区域, 每个外设内部的寄存器对应⼀个具体的地址. 这些外设的寄存器的地址共同排列在⼀个 4GB 的地址空间内。

我们在编程的时候，可以通过地址找到对应的外设和寄存器，然后按照读写内存来读写寄存器（通过C语⾔中的指针对这些地址进⾏数据的读和写） 。通过这样的设定, 就可以按照⼀种统⼀的⽅式来控制各种外设了, ⼤⼤的简化了编程难度, 也便于后序扩展更多的外设.  

### 9.2 存储器区域功能划分
![](/images/img-163.png)

通过上图, 可以看到地址空间分成了 8 个块, 每个块⼤⼩为 512MB, 每个块也都规定了⽤途.每个块的⼤⼩都有512MB，这对于嵌⼊式设备来说, 是⾮常⼤的，芯⽚⼚商在每个块的范围内设计各具特⾊的外设时并不⼀定都⽤得完，都是只⽤了其中的⼀部分⽽已。  

![](/images/img-164.png)
这些 Block 中我们重点关⼼ Block0, Block1, Block2. 我们在初学阶段主要就是针对这三个 Block 进⾏操作.

### 9.3 Block0区域
Block0 主要⽤于⽚内的FLASH.  
我使⽤的 STM32F103VET6 具有 512KB 的存储空间, 相⽐于整个块 512MB 来说, 是绰绰有余的.  因此 Flash 实际内容只需要占⽤ 0x0800 0000 ~ 0x0807 FFFF (512KB) 这样的地址范围.  
![](/images/img-165.png)

### 9.4 Block1区域
Block1 ⽤于⽚内的SRAM.  使⽤的 STM32F103VET6 的 SRAM 为 64KB. 整个 Block1 的⼤部分区域是没有被使⽤的.
![](/images/img-166.png)

### 9.5 Block2区域
Block2 ⽤于⽚内外设. 这个是我们编程中最关注的区域.  
![](/images/img-167.png)
根据外设的总线速度不同，Block被分成了APB和AHB两部分，其中APB⼜被分为APB1和APB2.
![](/images/img-168.png) 

在 APB1 和 APB2 总线上⼜挂载了各种外设, 这些外设也都有各⾃的地址.  以 GPIO 为例, 挂载在 APB2 总线上.  
![](/images/img-169.png) 

上述每个 GPIO 外设, ⼜包含 7 组寄存器, 以 GPIOB 为例:
![](/images/img-170.png) 

这⾥每个寄存器都是 32 位的整数. 具体作⽤在⼿册中有详细解释.  

```
基地址+偏移量这样的设定方式在计算机中非常常见。

GPIO如此,其他外设也是一样。每个外设上都包含很多寄存器,每个寄存器都会有一个内存地址。后续"读写寄存器",本质就是通过指针,操作对应内存地址的数据的bit位。

只要bit位一修改,背后的硬件电路就会随之改变,进而影响到硬件的工作特性。
```
## 10.HAL库控制寄存器方案
之前介绍了存储器映射和HAL库,STM32会把各种外设寄存器,映射到内存的不同地址中。然后就可以通过C语言的指针来操作了。

以GPIOB的ODR寄存器为例子:
![](/images/img-171.png) 

这个寄存器的 16:31 位没有被使⽤. 通过 0:15 位可以设置每个对应针脚输出的的电信号内容.  

GPIOB 的基地址为 0x4001 0C00 ;ODR 寄存器的偏移量为 0x0C ;则 GPIOB 的 ODR 寄存器的内存地址为⼆者相加, 即为 0x4001 0C0C 
⼜因为这个寄存器 32 位 (4 字节), 就可以使⽤ unsigned int* 类型的指针表⽰这个地址.  

```
*(unsigned int*)(0x40010C0C) = 0xFFFF; // 把所有位设为 1
*(unsigned int*)(0x40010C0C) = 0x0; // 把所有位设为 0
```

使⽤形如  0x40010C0C  来编写逻辑, ⾮常不⽅便的. 可读性⽐较差, 容易弄错弄混.  可以使⽤宏定义的⽅式, 来给这样的地址起⼀个更有描述性的名字. 

```
#define GPIOB_BASE 0x40010C00
#define GPIOB_ODR (unsigned int *)(GPIOB_BASE+0x0C)
*GPIOB_ODR = 0xFF; // 把所有位设为 1
*GPIOB_ODR = 0x0; // 把所有位设为 0
```

类似的, 就可以定义出⼀系列的宏, 表⽰各种外设的各种寄存器地址了.

```
/* 外设基地址 */
#define PERIPH_BASE ((unsigned int)0x40000000)
/* 总线基地址 */
#define APB1PERIPH_BASE PERIPH_BASE
#define APB2PERIPH_BASE (PERIPH_BASE + 0x00010000)
#define AHBPERIPH_BASE (PERIPH_BASE + 0x00020000)
/* GPIO外设基地址 */
#define GPIOA_BASE (APB2PERIPH_BASE + 0x0800)
#define GPIOB_BASE (APB2PERIPH_BASE + 0x0C00)
#define GPIOC_BASE (APB2PERIPH_BASE + 0x1000)
#define GPIOD_BASE (APB2PERIPH_BASE + 0x1400)
#define GPIOE_BASE (APB2PERIPH_BASE + 0x1800)
#define GPIOF_BASE (APB2PERIPH_BASE + 0x1C00)
#define GPIOG_BASE (APB2PERIPH_BASE + 0x2000)
/* 寄存器基地址，以GPIOB为例 */
#define GPIOB_CRL (GPIOB_BASE+0x00)
#define GPIOB_CRH (GPIOB_BASE+0x04)
#define GPIOB_IDR (GPIOB_BASE+0x08)
#define GPIOB_ODR (GPIOB_BASE+0x0C)
#define GPIOB_BSRR (GPIOB_BASE+0x10)
#define GPIOB_BRR (GPIOB_BASE+0x14)
#define GPIOB_LCKR (GPIOB_BASE+0x18)
```

- 先定义了"片上外设"基地址PERIPH_BASE
- 接着在PERIPH_BASE加上各个总线的地址偏移,得到APB1、APB2总线的地址APB1PERIPH_BASE、APB2PERIPH_BASE。
- 接着加上外设地址的偏移,得到GPIOA~G的外设地址
- 最后在外设地址上加入各个寄存器的地址偏移,得到特定寄存器的地址。一旦有了具体地址,就可以用指针读写。

```
// 读取 GPIOB 所有引脚的电平(读 IDR 寄存器)
unsigned int idr = *(unsigned int *)GPIOB_IDR;
// 写⼊ GPIOB 所有引脚的电平 (写 ODR 寄存器)
*(unsigned int *)GPIOB_ODR = 0xFFFF;
```
由于宏定义中,宏的值都是unsigned int,要当做指针进行运算,还需要进行类型强转。


⽤上⾯的⽅法去定义地址，还是稍显繁琐，我们引⼊结构体语法对寄存器进⾏进⼀步封装.我们以后可以多尝试这种写法。

```
typedef unsigned int uint32_t;
typedef struct {
uint32_t CRL; /*GPIO端⼝配置低寄存器 地址偏移: 0x00 */
uint32_t CRH; /*GPIO端⼝配置⾼寄存器 地址偏移: 0x04 */
uint32_t IDR; /*GPIO数据输⼊寄存器 地址偏移: 0x08 */
uint32_t ODR; /*GPIO数据输出寄存器 地址偏移: 0x0C */
uint32_t BSRR; /*GPIO位设置/清除寄存器 地址偏移: 0x10 */
uint32_t BRR; /*GPIO端⼝位清除寄存器 地址偏移: 0x14 */
uint32_t LCKR; /*GPIO端⼝配置锁定寄存器 地址偏移: 0x18 */
} GPIO_TypeDef;
```

C 语⾔学习的结构体内存布局的规则, 可以知道, 上述的 7 个结构体成员, 对应到 GPIO 的 7 个寄存器.  
>GPIO_TypeDef* GPIOx = （GPIO_TypeDef*)GPIOB_BASE;

![](/images/img-172.png) 

后续使⽤时直接可以通过结构体指针使⽤.  
```
uint32_t temp = GPIOx->IDR; // 读取 GPIOB_IDR 寄存器的值到变量 temp 中
GPIOx->ODR = 0xFFFF; // 写⼊数值到 GPIOB_ODR 寄存器中.
```

为了上述代码编写⽅便, 还可以⼀步到位, 在定义宏的时候直接把上述宏定义成  GPIO_TypeDef*  类型, 使⽤的时候就不需要强制类型转换了.  

```
#define GPIOA ((GPIO_TypeDef *) GPIOA_BASE)
#define GPIOB ((GPIO_TypeDef *) GPIOB_BASE)
#define GPIOC ((GPIO_TypeDef *) GPIOC_BASE)
#define GPIOD ((GPIO_TypeDef *) GPIOD_BASE)
#define GPIOE ((GPIO_TypeDef *) GPIOE_BASE)
#define GPIOF ((GPIO_TypeDef *) GPIOF_BASE)
#define GPIOG ((GPIO_TypeDef *) GPIOG_BASE)

/*使⽤定义好的宏直接访问*/
/*访问GPIOB端⼝的寄存器*/
GPIOB->BSRR = 0xFFFF; //通过指针访问并修改GPIOB_BSRR寄存器
GPIOB->CRL = 0xFFFF; //修改GPIOB_CRL寄存器
GPIOB->ODR = 0xFFFF; //修改GPIOB_ODR寄存器
uint32_t temp = GPIOB->IDR; //读取GPIOB_IDR寄存器的值到变量temp中
```
实际开发中,上述的这些宏已经被封装好了,不需要我们从头编写。



进行位操作(上述操作中,都是针对整个寄存器的32个bit位进行操作的)
```
GPIOB->ODR = 0xFFFF; //修改GPIOB_ODR寄存器
uint32_t temp = GPIOB->IDR; //读取GPIOB_IDR寄存器的值到变量temp中
```
如果只想操作其中的某个位, 保持其他位不变, 就需要使⽤ C 语⾔中的位运算了.  

```
//1.给指定位设为 1
uint32_t num = 0xF0F0F0F0;
// 把第 n 位设为 1. 此处 n 为 3
int n = 3;
num = num | (0x1 << n);
num |= (0x1 << n); 
```
![](/images/img-173.png) 

```
//2.给指定位设为 0
uint32_t num = 0xF0F0F0F0;
// 把第 n 位设为 0. 此处 n 为 4
int n = 4;
num = num & ~(0x1 << n);
num &= ~(0x1 << n);
```
![](/images/img-174.png) 

```
//3.给指定位取反
uint32_t num = 0xF0F0F0F0;
// 把第 n 位取反. 此处 n 为 3
int n = 3;
num = num ^ (0x1 << n);
num ^= (0x1 << n);
```
![](/images/img-175.png) 

```
//4.判断指定位是1还是0
uint32_t num = 0xF0F0F0F0;
// 判定第 n 位为 1 还是 0. 此处 n 为 3
int n = 3;
if ((num & (0x1 << n)) != 0) {
// 第 n 位为 1
} else {
// 第 n 位为 0
}
```
![](/images/img-176.png) 

```
//5.针对多个位操作
//(上述操作都只是针对一个bit位进行的。针对多个bit位也是同理。)
// 1. 把从第 n 位开始的两个位都设为 1
// 0x3 ⼆进制即为 11
num |= (0x3 << n);
// 2. 把从第 n 位开始的三个位都设为 0
// 0x7 的⼆进制即为 111
num &= ~(0x7 << n);
// 3. 把从第 n 位开始的四个位都进⾏取反
// 0xF 的⼆进制即为 1111
num ^= (0xF << n);
```


![](/images/img-177.png) 
通过上面的认识,就可以基于C语言进行精细的寄存器级别的操作了。