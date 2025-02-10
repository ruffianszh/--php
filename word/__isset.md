# __isset

__isset 是 PHP 中的一个魔术方法，它用于处理对象属性的存在检查操作。当使用 isset() 或 empty() 函数检查一个未定义或不可访问的成员变量时，PHP 会自动调用对象的 __isset() 方法。
__isset 方法提供了一种机制，允许你在检查属性是否存在时执行自定义逻辑。例如，它可以用于检查私有或受保护属性是否已设置，或者对不存在的属性返回特定的结果。此外，它还可以用于懒加载，即在检查属性是否存在时按需加载数据，如从数据库中获取数据。
__isset 方法接收一个参数 $name，表示要检查的属性名。该方法应该返回一个布尔值，表示属性是否存在。

## demo

```php
class Example {
    private $data = [];

    public function __isset($property) {
        return array_key_exists($property, $this->data);
    }

    public function __set($property, $value) {
        $this->data[$property] = $value;
    }
}

$example = new Example();
$example->someProperty = 'value';

var_dump(isset($example->someProperty)); // 输出: bool(true)
var_dump(isset($example->otherProperty)); // 输出: bool(false)


```