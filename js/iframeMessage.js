/**
 * 提供给打印使用
 */
window.addEventListener(
  "message",
  (e) => {
    if (!e.data) {
      return;
    }
    Vditor.preview(document.getElementById("preview"), e.data, {
      markdown: {
        theme: window.parent.options.preview.theme.current,
      },
      hljs: {
        style: window.parent.options.preview.hljs.style,
      },
    });
    setTimeout(() => {
      window.print();
    }, 3600);
  },
  false
);
