# MiniProgramMessageLoop v1.0.0
## 前言
由于微信小程序跨页面传递事件(参数),包括比如插槽dom要响应组件内事件啥的都比较蛋疼，插件限制就更多了。于是就简单模拟了一下Windows消息循环先做了个能达到目的

## 功能
可以发送一个全局消息，然后被响应。具体看说明

```javascript
    // 发送一个test消息，并且传递参数{value:"fuck"},当消息被触发时打印参数
    MessageLoop.postMessage("test",{value:"fuck"},function (par) {
        // console.log(par.value) // fuck
    })
```

```javascript
    // 延时3s触发，或者可以填写时间戳指定时间触发
    MessageLoop.postMessage("test",{value:"fuck"},function (par) {
        // console.log(par.value) // fuck
    },{
        date:3000
    })
```

```javascript
    // messaegLoop 内置消息处理函数
    MessageLoop.handle = {
        "setData": function (par) {
            this.setData(par);
        }
    }

    // 如果特定消息写在MessageLoop里面可以不传或者传null
    MessageLoop.postMessage("setData",{value:"fuck"},null)
```


```javascript
// othet 可以传递router 里面写哪些页面可以被触发，只要写页面的子字符串即可
// 同时触发回调的this默认bind为触发页面，故可以直接this.setData
MessageLoop.postMessage("setData",{fuckTest:"fuck"},null,{
  router:["pages/aaa/aaa"]
})
```

```javascript
// 消息回调可以调用时传递也可接收页面传递
MessageLoop.postMessage("showModal",{fuckTest:"fuck"},null,{
  router:["pages/aaa/aaa"]
})

// aaa 页面onLoad 实现消息回调
MessageLoop.handle["showModal"] = function (par) {
    wx.showModal({
        title:par.value
    })
}

```


```javascript
// onlyOne设置是否是独占消息
// 如果是独占执行会等待Promise结束，并且当消息队列中已经存在该消息时，
// 会拒收新消息，必须等待之前的消息处理完毕
// 独占消息处理函数必须是Promise

cb = function () {
    console.log("aaa")
},

cbsync = function () {
    console.log("开始计时")
    return new Promise((resolve, reject) => {
        setTimeout(function () {
            console.log("结束计时")
            resolve()
        }, 1000)
    })
},

handleClick = function() {
    MessageLoop.postMessage("test", {v: "s"}, this.cbsync, {
        onlyOne: true
    })
}
```

```javascript
// 回调执行头尾支持传入回调，头部返回完整msg，因为浅拷贝可以读写参数
// 返回true 继续执行， 返回false 直接结束
 MessageLoop.hook("test", (par) => {
    console.log("hook 打印参数", par)
    return true
})
// 尾hook 参数传入site，不传默认为头
// 回调参数多一个参数为返回值，如果是对象也可以修改返回值。。
// 返回一个数字啥的就没办法了，只能读取
MessageLoop.hook("test", (par, res) => {
    console.log("hook 打印结果", res)
    return true
}, {
    site: HOOK_SITE.END
})
//当然可以自己用原生语法进行hook(什么面向切面 aop 啥的 我都叫hook了)
```

