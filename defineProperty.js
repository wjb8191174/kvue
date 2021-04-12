// 数据响应式原理
// Object.defineProperty
function defineReaction(obj, key, val) {
    Object.defineProperty(obj, key, 
        {
            get() {
                console.log('get', val);
                return val
            },
            set(newVal) {
                if(newVal !== val) {
                    console.log('set', newVal);
                    val = newVal
                }
            }
        }    
    )
}

var obj = {}

defineReaction(obj, 'foo', 'foo')

obj.foo
obj.foo = 'foooo'