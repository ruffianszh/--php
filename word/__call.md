# __call()方法重载

```php
public mixed __call ( string $name , array $arguments )
public static mixed __callStatic ( string $name , array $arguments )
```

在对象中调用一个不可访问方法时，__call() 会被调用。
在静态上下文中调用一个不可访问方法时，__callStatic() 会被调用。
$name 参数是要调用的方法名称。$arguments 参数是一个枚举数组，包含着要传递给方法 $name 的参数。

## 使用 __call() 和 __callStatic() 对方法重载：
```php
class MethodTest 
{
    public function __call($name, $arguments) 
    {
        // 注意: $name 的值区分大小写
        echo "Calling object method '$name' "
             . implode(', ', $arguments). "\n";
    }

    /**  PHP 5.3.0之后版本  */
    public static function __callStatic($name, $arguments) 
    {
        // 注意: $name 的值区分大小写
        echo "Calling static method '$name' "
             . implode(', ', $arguments). "\n";
    }
}

$obj = new MethodTest;
$obj->runTest('in object context');

MethodTest::runTest('in static context');  
```
