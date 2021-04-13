// 数据响应式处理
function defineReaction(obj, key, val) {
    // val 可能是对象 需要递归调用
    observer(val)

    Object.defineProperty(obj, key, 
        {
            get() {
                // console.log('get', val);
                return val
            },
            set(newVal) {
                if(newVal !== val) {
                    // console.log('set', newVal);
                    // newVal 可能对象 需要递归调用
                    observer(newVal)
                    val = newVal
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

// 编译过程
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
            if(node.childNodes) {
                this.compile(node)
            }
        }) 
    }

    // 编译插值文本
    compileText(node) {
        // console.log(RegExp.$1);
        node.textContent = this.$vm[RegExp.$1]
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

    /** ********************************************
     * 指令相关的方法
     * @param {*} node 
     * @param {*} exp 
     */

    text(node, exp) {
        node.textContent = this.$vm[exp]
    }

    html(node, exp) {
        node.innerHTML = this.$vm[exp]
    }  

    /** ****************** end ******************** */
    

    // 判断节点是否是元素
    isElement(node) {
        return node.nodeType === 1
    }

    // 判断是否是插值表达式{{xx}} 
    isInter(node) {
        return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
    }

    // 判断是否是指令
    isDirective(attrName) {
        return attrName.indexOf('k-') === 0
    }
}