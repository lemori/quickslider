/*
 * QuickSlider
 *
 * 根据活动页的特征定制的翻屏插件，无依赖。
 *
 * 适用场景：有超过一屏的长页面，也有刚好一屏的普通；长页面到底部，才能滑动到下一个页面，反之亦然。
 * 不支持手势跟随，即页面的切换是一次连续的过程。
 *
 * @author lemori
*/

;(function (win, doc) {
  'use strict';

  // 调试窗口
  var _ibox;

  /*
   * @function Slider
   * @param {object} options
   ```
    pages:    页面selector
    duration: 页面切换动画时长，单位ms，默认500
    debug:    是否开启调试，默认false
   ```
   * @warn: 应当在页面完全加载后再调用。
  */
  function Slider (options) {
    if (!options || !options.pages) {
      throw new Error('[Slider]pages undefined');
    }

    this.duration = options.duration || 500;
    this.pages = doc.querySelectorAll(options.pages);

    if (!this.pages || this.pages.length === 0) {
      return console.warn('[Slider]pages are empty');
    }

    // 页面数
    this.pageCount = this.pages.length;
    // 所有“屏”应该在同一个容器内
    var wrapper = this.pages[0].parentElement;
    // 容器高度，应不大于实际页面可用高度
    this.pageHeight = wrapper.clientHeight;
    // 初始在首屏
    this.currentPage = 0;
    // 设置基本量
    this.preprocess();

    // 切页时，第一个页面上下移动，进而整体位移
    this.pages[0].addEventListener('transitionend', onAnimated.bind(this), false);

    // 侦听滑动事件，必要时切换页面
    wrapper.classList.add('quick-slider');
    wrapper.addEventListener('touchstart', onMoveStart.bind(this), false);
    wrapper.addEventListener('touchend', onMoveEnd.bind(this), false);

    // 调试支持
    setupDebug(options.debug, 'pager_debug');
  }

  /*
   * 预计算各个页面的基本数据，以减少dom操作
  */
  Slider.prototype.preprocess = function () {
    this.pageData = [];

    var page, height;

    for (var i = 0; i < this.pageCount; i++) {
      page = this.pages[i];
      height = page.scrollHeight;
      this.pageData[i] = {
        height: height,
        isLong: height > this.pageHeight || page.hasAttribute('long'),
        scrollTop: 0,
        maxScroll: 0
      };

      if (this.pageData[i].isLong) {
        this.pageData[i].maxScroll = this.pageData[i].height - this.pageHeight;
        page.style.overflowY = 'auto';
        page.style.webkitOverflowScrolling = 'touch';
      }
    }
  };

  // 上滑，进入下一屏
  Slider.prototype.slideUp = function (page) {
    if (page.isLong && page.maxScroll > page.scrollTop) {
      // 如果剩余可滑动距离大于实际移动距离，不翻页
      return;
    }

    this.moveTo(++this.currentPage);
  };

  // 下滑，进入上一屏
  Slider.prototype.slideDown = function (page) {
    if (page.isLong && page.scrollTop > 0) {
      // 如果还没滑动到顶部，不翻页
      return;
    }

    this.moveTo(--this.currentPage);
  };

  // 直接进入特定页面
  Slider.prototype.moveTo = function (index) {
    this.isRunning = true;
    log('move to page ' + index);

    var distance = -index * 100 + '%';
    // 多个页面做transform操作，可能导致在ios上出现空白页问题，margin更稳定
    this.pages[0].style.marginTop = -index * this.pageHeight + 'px';
  };

  function onAnimated () {
    this.isRunning = false;
  }

  function onMoveStart (e) {
    log('move start,' + (this.isRunning ? '' : 'not') + ' running');

    if (this.isRunning) {
      e.preventDefault();
      return;
    }

    var touches = e.touches;
    if (touches && touches.length) {
      this.startX = touches[0].pageX;
      this.startY = touches[0].pageY;
    }

    var curPage = this.pageData[this.currentPage];
    if (curPage.isLong) {
      curPage.scrollTop = this.pages[this.currentPage].scrollTop;
    } else {
      // 确保touchend事件能被触发
      e.preventDefault();
    }
  }

  function isScrolling (page, deltaY) {
    if (!page.isLong) {
      return false;
    }

    var prev = page.scrollTop;
    var next = Math.max(0, Math.min(page.maxScroll, prev - deltaY));
    var distance = Math.abs(next - prev);

    log('distance', distance, ', deltaY', deltaY);

    page.scrollTop = prev - deltaY;

    return distance > 50;
  }

  function onMoveEnd (e) {
    log('move end, ' + (this.isRunning ? '' : 'not') + ' running');

    if (this.isRunning) {
      e.preventDefault();
      return;
    }

    var touches = e.changedTouches;
    var deltaY = 0;
    if (touches && touches.length) {
      deltaY = touches[0].pageY - this.startY;
    }

    var curPage = this.pageData[this.currentPage];

    // 手势不明显便不做切页操作
    if (isScrolling(curPage, deltaY) || Math.abs(deltaY) < 50) {
      return;
    }

    var isSlideUp = deltaY < 0;

    log('maySlide? ', isSlideUp ? 'up' : 'down', curPage.maxScroll, curPage.scrollTop);

    if (isSlideUp && this.currentPage < this.pageCount - 1) {
      this.slideUp(curPage);
    } else if (!isSlideUp && this.currentPage > 0) {
      this.slideDown(curPage);
    }
  }

  /*
   * 输出调试信息
  */
  function setupDebug (debug, id) {
    if (!debug) {
      if (_ibox) {
        doc.body.removeChild(_ibox);
        _ibox = null;
      }
      return;
    }
    if (!_ibox) {
      _ibox = doc.createElement('div');
      _ibox.id = id;
      _ibox.style = 'position:absolute;bottom:15%;left:0;right:0;z-index:1000;height:100px;background-color:rgba(0,0,0,.5);color:red;overflow-y:auto;padding:0 .5em;';
      doc.body.appendChild(_ibox);
    }
    _ibox.innerHTML = '<p>QuickSlider Debugging</p>';
  }

  function log () {
    if (!_ibox) return;

    var str = Array.prototype.slice.call(arguments).join(' ');
    win.console && console.log(str);

    var m = doc.createElement('p');
    m.textContent = str;
    _ibox.insertBefore(m, _ibox.firstChild);
  }

  win.QuickSlider = Slider;
})(window, document);
