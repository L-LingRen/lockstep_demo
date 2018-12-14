# lockstep_demo  
使用js模拟游戏引擎(如unity3d)的update和socket的收发, 而写出来的demo。  
参考文献后仅仅实现了lockstep的基本逻辑, 并不完善(如:没写堆积包加速处理), 仅供参考, 请勿照搬。  
有误请包涵, 谢谢!  
  
发现的缺陷:   
    1.延迟受逻辑帧的间隔和网络2个主要因素影响。  
    2.延迟至少为逻辑帧的间隔(把logic_frame_interval调高可明显观察)。  
    


参考文献  
[1]: http://www.zhust.com/index.php/2014/02/%e7%bd%91%e7%bb%9c%e6%b8%b8%e6%88%8f%e7%9a%84%e7%a7%bb%e5%8a%a8%e5%90%8c%e6%ad%a5%ef%bc%88%e5%9b%9b%ef%bc%89%e5%b8%a7%e9%94%81%e5%ae%9a%e7%ae%97%e6%b3%95/#comments  
[2]: https://musoucrow.github.io/2018/03/09/bnb_1/  
[3]: http://www.skywind.me/blog/archives/131  