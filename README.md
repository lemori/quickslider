# QuickSlider

一种翻屏插件，无依赖。受*pager_slider*插件启发。

## 适用场景

有超过一屏的长页面，也有刚好一屏的普通；长页面到底部，才能滑动到下一个页面，反之亦然。

不支持手势跟随，即页面的切换是一次连续的过程。

## usage

```
new QuickSlider({
  pages: '.page-wrap .page',
  duration: 300,
  debug: true
});
```

### html example

长页面无须单独设定滚动相关样式，但如果有图像背景，应当放在内部元素上。

可以给长页面添加`long`属性，但这是可选的。

```html
<html>
  <body>
    <div class="page-wrap">
      <div class="page">
        ...
      </div>
      <div class="page" long>
        <div class="page-inner">
          ...
        </div>
      </div>
    </div>
  </body>
</html>
```

### css example

```
html, body, .page, .page-wrap {
  width: 100%;
  height: 100%
}
.page {
  position: relative;
}
.quick-slider {
  overflow: hidden;

  & > .page:first-child {
    transition: margin-top 0.5s ease;
  }
}
.page-inner {
  background: url('path/to/bg') center top / 100% auto no-repeat;
}
```

## TODO

[] Add callbacks
[] Add bounce effect
