// 数据响应式处理
function defineReaction(obj, key, val) {
    // val 可能是对象 需要递归调用
    observer(val)

    Object.defineProperty(obj, key, 
        {
            get() {
                console.log('get', val);
                return val
            },
            set(newVal) {
                if(newVal !== val) {
                    console.log('set', newVal);
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