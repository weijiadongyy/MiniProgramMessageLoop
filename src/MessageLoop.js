import {isArray} from "./Object";

function MessageLoop() {

}

var HOOK_SITE = {
    HEAD: "head",
    // END: "end"
}

/**
 * 消息循环队列
 * @type {*[]}
 */
MessageLoop.msg = [];
/**
 * 记录一种消息数量
 * @type {{}}
 */
MessageLoop.msgCount = {};

/**
 * 默认消息处理函数
 * @type {{setData: MessageLoop.handle.setData}}
 */
MessageLoop.handle = {
    "_setData": function (par) {
        this.setData(par);
    },
    "setData": function (par) {
        console.log("setData", par)
        var page = par.router
        switch (typeof page) {
            case "string":
                page = [page]
                break
            case "object":
                if (!isArray(page)) {
                    console.log("参数错误", page)
                    return
                }
                break
            default:
                console.log("参数错误", page)
                return

        }

        MessageLoop.postMessage("_setData", par.data, null, {
            router: page
        })
    },
    "goToGoods": function (par) {
        console.log("goToGoods", par)
        MessageLoop.postMessage("setData", {
            router: "pages/goods/goods",
            data: {
                RenderData: par.data,
                RenderData_show: par.data,
            }
        })
    }
}

/**
 * hook列表
 * @type {{}}
 * @private
 */
MessageLoop._hook = {};


/**
 * 发生消息
 * @param msg 消息名称
 * @param par 回调参数
 * @param callback 消息回调
 * @param other 其他参数【date:延时触发或者定时触发，onlyOne:消息队列最多允许一个, router:发送到拿个页面(子字符串匹配)】
 */
MessageLoop.postMessage = function (msg, par, callback = null, other = {}) {

    let obj = translatorMessage(msg, par, callback, other);

    if (obj) {
        // console.log(obj)
        MessageLoop.msg.push(obj);
        _addMsg(msg);
    }
}

/**
 * HOOK 某一种消息
 * @param msg 要hook的消息名
 * @param callBack hook回调(参数为消息完整参数)
 * @param other
 */
MessageLoop.hook = function (msg, callBack, other = {}) {
    var _hook = {}
    if (MessageLoop._hook.hasOwnProperty(msg)) {
        _hook = MessageLoop._hook[msg]
    }

    _hook[HOOK_SITE.HEAD] = callBack

    // if (other.site == HOOK_SITE.END) {
    //     _hook[HOOK_SITE.END] = callBack
    // } else {
    //     _hook[HOOK_SITE.HEAD] = callBack
    // }

    MessageLoop._hook[msg] = _hook


    // console.log("hook 拉 ", MessageLoop._hook)
}

/**
 * 解除HOOk
 * @param msg
 * @param callBack
 * @param other
 */
MessageLoop.unhook = function (msg, other = {}) {
    MessageLoop._hook[msg] = null;
}


/**
 * 翻译消息，处理成合法数据
 * @param msg 消息名称
 * @param par 回调参数
 * @param callback 消息回调
 * @param other 其他参数
 * @returns {{msg: *, par: *, other: {}, callback: null}|null}
 */
let translatorMessage = function (msg, par, callback = null, other = {}) {
    //onlyOne事件队列只允许出现一个
    if (other.onlyOne == true && MessageLoop.msgCount.hasOwnProperty(msg) && MessageLoop.msgCount[msg] > 0) {
        return null;
    }

    if (!other.hasOwnProperty("date")) {
        other.date = 0;
    }


    if (other.date < 100000000000) {
        other.date = Date.now() + other.date;
    }


    return {
        msg,
        other,
        par,
        callback,
    }

}


/**
 * 获取当前页面
 * @returns {string|*}
 */
let getCurPage = function () {
    let pages = getCurrentPages() //获取加载的页面
    if (pages.length < 1) {
        return null;
    }

    let currentPage = pages[pages.length - 1]; //获取当前页面的对象

    return currentPage;

}


/**
 * 消息入队列数量加一
 * @param msg
 * @private
 */
let _addMsg = function (msg) {
    // console.log(msg, "add")
    if (MessageLoop.msgCount.hasOwnProperty(msg)) {
        MessageLoop.msgCount[msg]++;
    } else {
        MessageLoop.msgCount[msg] = 1;
    }
}

/**
 * 消息处理函数执行完毕，数量减一
 * @param msg
 * @private
 */
let _subMsg = function (msg) {
    // console.log(msg, "sub")
    if (MessageLoop.msgCount.hasOwnProperty(msg) && MessageLoop.msgCount[msg] > 0) {
        MessageLoop.msgCount[msg]--;
    } else {
        MessageLoop.msgCount[msg] = 0;
    }
}


/**
 * 判断函数是否可以执行，未到消息触发事件，不是消息触发页面，数据非法等军返回false
 * @param msg
 * @returns {boolean|*}
 */
let funRunCheck = function (msg) {
    if (!msg) {
        return;
    }
    const {par, other, callback} = msg;
    let {date, router} = other;
    let _handle = callback;
    if (!router) {
        router = [];
    }
    // console.log(msg)
    if (typeof callback != "function") {
        if (typeof MessageLoop.handle[msg.msg] != "function") {
            console.log("msg error!", msg.msg);
            return false;
        } else {
            _handle = MessageLoop.handle[msg.msg];
        }
    }
    if (Date.now() < date) {
        return false;
    }


    if (router.length > 0) {
        let flag = false;
        let cRouter = getCurPage();
        if (!cRouter) {
            return false;
        }

        for (let r of router) {
            if (cRouter.route.indexOf(r) >= 0) {
                flag = true;
                break;
            }
        }
        if (!flag) {
            return false;
        }
        return _handle.bind(cRouter);
    }
    return _handle;

}

/**
 * onlyOne 消息 同步执行等待执行完毕
 * @param fnc
 * @param par
 * @param self
 * @returns {Promise}
 */
function runFncAsync(fnc, par, self) {
    return new Promise((resolve, reject) => {
        if (self) {
            fnc.call(self, par).then(res => {
                resolve(res);
            });
        } else {
            fnc(par).then(res => {
                resolve(false);
            });

        }
    })
}

/**
 * 普通消息无需等待
 * @param fnc
 * @param par
 * @param self
 */
function runFnc(fnc, par, self) {
    if (self) {
        return fnc.call(self, par);
    } else {
        return fnc(par);
    }
}

/**
 * 判断是否有HOOK
 * @param msg
 * @returns {boolean|*}
 */
function hookCallBack(msg, site = HOOK_SITE.HEAD, reslult = null) {
    if (!MessageLoop._hook.hasOwnProperty(msg.msg)) {
        // console.log(msg.msg, "没hook")
        return true;
    }

    if (typeof MessageLoop._hook[msg.msg][site] != "function") {
        console.log(msg.msg, "hook回调有问题", MessageLoop._hook[msg.msg]);
        return true;
    }

    switch (site) {
        case HOOK_SITE.HEAD:
            return MessageLoop._hook[msg.msg][site](msg);
            break
        // case HOOK_SITE.END:
        //     return MessageLoop._hook[msg.msg][site](msg, reslult);
        //     break
        default:
            return true
            break
    }

}

/**
 * 处理消息
 * @param msg
 */
let run = function (msg) {
    if (!hookCallBack(msg, HOOK_SITE.HEAD)) {
        _subMsg(msg.msg);
        return;
    }
    const {par, other} = msg;
    const {self, onlyOne} = other;
    var result = null
    //消息不执行，放到队列末尾
    let handle = funRunCheck(msg);
    if (!handle) {
        MessageLoop.msg.push(msg);
    } else {
        // console.log("run");
        if (onlyOne) {
            runFncAsync(handle, par, self).then(res => {
                result = res
                if (result) {
                    console.log("事件继续", msg)
                    MessageLoop.msg.push(msg);
                } else {

                    _subMsg(msg.msg);
                }

                // hookCallBack(msg, HOOK_SITE.END)
            });
        } else {
            result = runFnc(handle, par, self);
            // console.log(result)
            if (result) {
                console.log("事件继续", msg)
                MessageLoop.msg.push(msg);
            } else {
                _subMsg(msg.msg);
            }
            // hookCallBack(msg, HOOK_SITE.END)
        }
    }
}

// 消息主循环
setInterval(function () {
    if (MessageLoop.msg.length < 1) {
        return;
    }
    // console.log(MessageLoop.msg)
    const msg = MessageLoop.msg.shift();
    run(msg);
}, 100);


export {
    MessageLoop,
    HOOK_SITE
};