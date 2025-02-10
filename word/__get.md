# __get

__get 是一个魔术方法，用于在尝试访问一个不存在或不可访问的对象属性时自动调用。它允许你定义如何处理对未定义属性的访问。
## demo
```php
class Example {
    private $data = [];

    public function __set($name, $value) {
        $this->data[$name] = $value;
    }

    public function __get($name) {
        if (array_key_exists($name, $this->data)) {
            return $this->data[$name];
        }
        return null; // 或者抛出异常
    }
}

$example = new Example();
$example->foo = 'bar'; // 使用 __set 方法设置值
echo $example->foo; // 使用 __get 方法获取值，输出 'bar'
```
### 关键点
__get($name) 方法接收一个参数，即尝试访问的属性名 $name。
当访问不存在的属性时，__get 会被自动调用。
你可以在 __get 中定义自定义逻辑，例如返回默认值或抛出异常。
### 适用场景
提供封装：控制对对象属性的访问。
动态属性管理：在不知道具体属性名的情况下，动态获取属性值。
读取配置或数据存储。