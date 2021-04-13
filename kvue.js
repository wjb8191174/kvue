// 数据响应式处理
function defineReaction(obj, key, val) {
    // val 可能是对象 需要递归调用
    observer(val)

    const dep = new Dep()

    Object.defineProperty(obj, key, 
        {
            get() {
                // console.log('get', val);
                Dep.target && dep.addDep(Dep.target)
                return val
            },
            set(newVal) {
                if(newVal !== val) {
                    // console.log('set', newVal);
                    // newVal 可能对象 需要递归调用
                    observer(newVal)
                    val = newVal

                    dep.notify()
                }
            }
        }    
    )
}

// 对象响应式处理
function observer(obj) {
    if(typeof obj !== 'object' || obj == null) {
        return
    }

    new Observer(obj)
}

// 代理 把data属性挂载到 KVue实例上
function proxy(vm) {
    Object.keys(vm.$data).forEach(key => {
        Object.defineProperty(vm, key, 
            {
                get() {
                    return vm.$data[key]
                },
                set(newVal) {
                    vm.$data[key] = newVal
                }
            }
        )
    })
}

class KVue {
    constructor(options) {
        // 保存传递进来的选项
        this.$options = options

        this.$data = options.data

        // 给KVue传递进来的参数做响应式处理
        observer(this.$data)

        // 代理
        proxy(this)

        // 编译
        new Compile(this.$options.id, this)
    }
}

// 劫持监听所有属性
// 每一个响应式对象, 伴生一个Observer实例
class Observer {
    constructor(value) {
        this.value = value

        this.walk(this.value)
    }

    // 判断KVue的$data是对象还是数组
    // todo 处理数据类型
    walk(obj) {
        Object.keys(obj).forEach(key => 
            defineReaction(obj, key, obj[key]))
    }
}

/**
 * 
 */
class Compile {
    constructor(el, vm) {
        this.$vm = vm
        this.$el = document.querySelector(el)

        // 编译模板
        if(this.$el) {
            this.compile(this.$el)
        }
    }

    compile(el) {
        // 遍历所有子节点
        el.childNodes.forEach(node => {

            if (this.isElement(node)) {
                // console.log('编译元素', node.nodeName)
                this.compileELement(node)

            } else if(this.isInter(node)) {
                // console.log('编译插值文本', node.textContent)
                this.compileText(node)
            }

            // 递归 遍历所有子节点
            if (node.childNodes) {
                this.compile(node)
            }
        }) 
    }

    // 编译插值文本
    compileText(node) {
        // console.log(RegExp.$1);
        // node.textContent = this.$vm[RegExp.$1]
        this.update(node, RegExp.$1, 'text')
    }

    // 编译元素
    compileELement(node) {
        const nodeAttrs = node.attributes
        Array.from(nodeAttrs).forEach(attr => {
            // k-xxx="aaa"
            const attrName = attr.name
            const exp = attr.value

            if(this.isDirective(attrName)) {
                // 截取字符窜 获取指令相对应的方法
                const dir = attrName.substring(2)
                this[dir] && this[dir](node, exp)
            }
        })
    }


    /**
     * k-text指令对应方法
     * @param {*} node 
     * @param {*} exp 
     */
    text(node, exp) { 
        this.update(node, exp, 'text')
    }


    /**
     * k-html指令对应方法
     * @param {*} node 
     * @param {*} exp 
     */
    html(node, exp) {
        this.update(node, exp, 'html')
    }  


    /**
     * 
     * @param {*} node 
     * @param {*} exp 
     * @param {*} dir 
     */    
    update(node, exp, dir) {
        // 初始化
        const fn = this[dir + 'Updater'];
        fn && fn(node, this.$vm[exp])

        new Watcher(this.$vm, exp, function(val) {
            fn && fn(node, val)
        })
    }


    /**
     * 
     * @param {*} node 
     * @param {*} val 
     */
    textUpdater(node, val) {
        node.textContent = val
    }


    /**
     * 
     * @param {*} node 
     * @param {*} val 
     */
    htmlUpdater(node, val) {
        node.innerHTML = val
    }


    /**
     * 
     * @param {*} node 
     * @returns boolean
     */
    isElement(node) {
        return node.nodeType === 1
    }


    /**
     * 
     * @param {*} node 
     * @returns boolean
     */
    isInter(node) {
        return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
    }


    /**
     * 
     * @param {*} attrName 
     * @returns boolean
     */
    isDirective(attrName) {
        return attrName.indexOf('k-') === 0
    }
}


// Watcher: 小秘书，界面中的一个依赖对应一个小秘书
class Watcher {
    constructor(vm, key, updateFn) {
        this.vm = vm
        this.key = key
        this.updateFn = updateFn

        // 读一次数据，触发defineReactive里面的get()
        Dep.target = this
        this.vm[this.key]
        Dep.target = null
    }

    update() {
        this.updateFn.call(this.vm, this.vm[this.key])
    }
}

class Dep {
    constructor() {
        this.deps = []
    }

    addDep(watcher) {
        this.deps.push(watcher)
    }

    notify() {
        this.deps.forEach(watcher => watcher.update())
    }
}