// 数据响应式原理
// Object.defineProperty
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

function set(obj, key, val) {
    defineReaction(obj, key, val)
}

// 对象响应式处理
function observer(obj) {
    if(typeof obj !== 'object' || obj == null) {
        return
    }
    Object.keys(obj).forEach(key => defineReaction(obj, key, obj[key]))
}

var obj = {foo: 'foo', baz: 'baz', bar: {a: 1}}

// defineReaction(obj, 'foo', 'foo')
observer(obj)

// obj.foo
// obj.foo = 'foooo'

// obj.baz

// bar 是对象
// obj.bar.a = 10

// newVal 是对象
// obj.bar = {a : 10}
// obj.bar.a = 100

// 动态赋值
set(obj, 'dong', 'dong')
obj.dong
obj.dong = 'dongdong'