/**
 * 什么时候保存数据
 * 编辑器自动保存
 */
// 生成唯一  id
function uuid() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}

/**
 * 所有保存的 key 内容
 * key: list，列表信息 [{id: 'xx', time: 'xx', content: 'xx'}] // content 截取 200 字符
 * key: setting_preview 保持预览，还是编辑模式
 * key: setting_slide 侧边打开还是关闭
 * key: setting_outline 大纲
 * key: current 当前选中的页面
 * key： 为 uuid，每条 markdown 内容
 */
const Storage = {
  get(keys) {
    if (!Array.isArray(keys)) {
      keys = [keys];
    }
    return new Promise((resolve) => {
      chrome.storage.sync.get(keys, resolve);
    });
  },
  set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [key]: value }, resolve);
    });
  },
  clear() {
    chrome.storage.sync.clear();
  },
  remove(keys) {
    if (!Array.isArray(keys)) {
      keys = [keys];
    }
    return new Promise((resolve) => {
      chrome.storage.sync.remove(keys, resolve);
    });
  },
};

(async function () {
  let current = ""; // 当前选中值
  const editIcon = `<?xml version="1.0" standalone="no"?>
  <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 1024 1024">
    <path d="M257.7 752c2 0 4-.2 6-.5L431.9 722c2-.4 3.9-1.3 5.3-2.8l423.9-423.9a9.96 9.96 0 0 0 0-14.1L694.9 114.9c-1.9-1.9-4.4-2.9-7.1-2.9s-5.2 1-7.1 2.9L256.8 538.8c-1.5 1.5-2.4 3.3-2.8 5.3l-29.5 168.2a33.5 33.5 0 0 0 9.4 29.8c6.6 6.4 14.9 9.9 23.8 9.9zm67.4-174.4L687.8 215l73.3 73.3-362.7 362.6-88.9 15.7 15.6-89zM880 836H144c-17.7 0-32 14.3-32 32v36c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-36c0-17.7-14.3-32-32-32z"/>
  </svg>`;

  const previewIcon = `<?xml version="1.0" standalone="no"?>
  <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 1024 1024">
    <path d="M942.2 486.2C847.4 286.5 704.1 186 512 186c-192.2 0-335.4 100.5-430.2 300.3a60.3 60.3 0 0 0 0 51.5C176.6 737.5 319.9 838 512 838c192.2 0 335.4-100.5 430.2-300.3 7.7-16.2 7.7-35 0-51.5zM512 766c-161.3 0-279.4-81.8-362.7-254C232.6 339.8 350.7 258 512 258c161.3 0 279.4 81.8 362.7 254C791.5 684.2 673.4 766 512 766zm-4-430c-97.2 0-176 78.8-176 176s78.8 176 176 176 176-78.8 176-176-78.8-176-176-176zm0 288c-61.9 0-112-50.1-112-112s50.1-112 112-112 112 50.1 112 112-50.1 112-112 112z"/>
  </svg>`;

  let outlinEnable = await Storage.get("setting_outline");
  outlinEnable = outlinEnable?.setting_outline;

  const oUl = document.querySelector(".menu-container ul");

  window.options = {
    toolbar: [
      {
        name: "filelist",
        tipPosition: "s",
        tip: "文档",
        icon: `<?xml version="1.0" standalone="no"?>
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 1024 1024">
          <path d="M408 442h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8zm-8 204c0 4.4 3.6 8 8 8h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56zm504-486H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm0 632H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zM115.4 518.9L271.7 642c5.8 4.6 14.4.5 14.4-6.9V388.9c0-7.4-8.5-11.5-14.4-6.9L115.4 505.1a8.74 8.74 0 0 0 0 13.8z"/>
        </svg>
        `,
        click() {
          const menu = document.querySelector(".menu-container");
          if (menu.classList.contains("w-0")) {
            Storage.set("setting_slide", 1);
            menu.classList.remove("w-0");
          } else {
            Storage.remove("setting_slide");
            menu.classList.add("w-0");
          }
        },
      },
      // {
      //   name: "xxx",
      //   tip: "清除测试",
      //   click() {
      //     console.log("清除成功");
      //     Storage.clear();
      //   },
      // },
      {
        name: "outline",
        tip: "大纲",
        icon: `<?xml version="1.0" standalone="no"?>
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 1024 1024">
          <path d="M264 230h496c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H264c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8zm496 424c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H264c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496zm144 140H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm0-424H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8z"/>
        </svg>
        `,
        tipPosition: "s",
        className: "outline-container",
        afterClick() {
          const button = document.querySelector(".outline-container button");
          if (button.classList.contains("vditor-menu--current")) {
            Storage.set("setting_outline", 1);
          } else {
            Storage.remove("setting_outline");
          }
        },
      },
      {
        name: "preview",
        icon: previewIcon,
        tip: "进入预览",
        tipPosition: "s",
        className: "preview-container",
        afterClick() {
          const button = document.querySelector(".preview-container button");
          if (button.classList.contains("vditor-menu--current")) {
            button.setAttribute("aria-label", "取消预览，进入编辑。");
            Storage.set("setting_preview", 1);
          } else {
            Storage.remove("setting_preview");
            button.setAttribute("aria-label", "进入预览");
          }
        },
      },
      {
        name: "delete001",
        tipPosition: "s",
        icon: `<?xml version="1.0" standalone="no"?>
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 1024 1024">
          <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
          <path d="M623.6 316.7C593.6 290.4 554 276 512 276s-81.6 14.5-111.6 40.7C369.2 344 352 380.7 352 420v7.6c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V420c0-44.1 43.1-80 96-80s96 35.9 96 80c0 31.1-22 59.6-56.1 72.7-21.2 8.1-39.2 22.3-52.1 40.9-13.1 19-19.9 41.8-19.9 64.9V620c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8v-22.7a48.3 48.3 0 0 1 30.9-44.8c59-22.7 97.1-74.7 97.1-132.5.1-39.3-17.1-76-48.3-103.3zM472 732a40 40 0 1 0 80 0 40 40 0 1 0-80 0z"/>
        </svg>
        `,
        click() {
          console.log("清除成功");
          Storage.clear();
        },
      },
      {
        name: "help",
        tipPosition: "s",
        icon: `<?xml version="1.0" standalone="no"?>
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 1024 1024">
          <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
          <path d="M623.6 316.7C593.6 290.4 554 276 512 276s-81.6 14.5-111.6 40.7C369.2 344 352 380.7 352 420v7.6c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V420c0-44.1 43.1-80 96-80s96 35.9 96 80c0 31.1-22 59.6-56.1 72.7-21.2 8.1-39.2 22.3-52.1 40.9-13.1 19-19.9 41.8-19.9 64.9V620c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8v-22.7a48.3 48.3 0 0 1 30.9-44.8c59-22.7 97.1-74.7 97.1-132.5.1-39.3-17.1-76-48.3-103.3zM472 732a40 40 0 1 0 80 0 40 40 0 1 0-80 0z"/>
        </svg>
        `,
        className: "flex-1",
        click() {
          console.log("清除成功");
          Storage.clear();
        },
      },
      {
        name: "addfile",
        tip: "新增文件",
        icon: `<?xml version="1.0" standalone="no"?>
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 1024 1024">
          <path d="M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0 0 42 42h216v494zM544 472c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v108H372c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h108v108c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V644h108c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H544V472z"/>
        </svg>
        `,
        tipPosition: "w",
        click: add,
      },
      {
        name: "delete",
        tip: "删除",
        tipPosition: "w",
        confirm() {
          console.log("点击了确定，点击");
        },
      },
      {
        name: "content-theme",
        icon: `<?xml version="1.0" standalone="no"?>
      <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 1024 1024">
        <path d="M870 126H663.8c-17.4 0-32.9 11.9-37 29.3C614.3 208.1 567 246 512 246s-102.3-37.9-114.8-90.7a37.93 37.93 0 0 0-37-29.3H154a44 44 0 0 0-44 44v252a44 44 0 0 0 44 44h75v388a44 44 0 0 0 44 44h478a44 44 0 0 0 44-44V466h75a44 44 0 0 0 44-44V170a44 44 0 0 0-44-44zm-28 268H723v432H301V394H182V198h153.3c28.2 71.2 97.5 120 176.7 120s148.5-48.8 176.7-120H842v196z"/>
      </svg>
      `,
        tip: "主题",
        tipPosition: "w",
      },
      {
        name: "export",
        icon: `<?xml version="1.0" standalone="no"?>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="currentColor" fill-rule="evenodd">
          <path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h360c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H184V184h656v320c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V144c0-17.7-14.3-32-32-32ZM770.87 824.869l-52.2 52.2c-4.7 4.7-1.9 12.8 4.7 13.6l179.4 21c5.1.6 9.5-3.7 8.9-8.9l-21-179.4c-.8-6.6-8.9-9.4-13.6-4.7l-52.4 52.4-256.2-256.2c-3.1-3.1-8.2-3.1-11.3 0l-42.4 42.4c-3.1 3.1-3.1 8.2 0 11.3l256.1 256.3Z" transform="matrix(1 0 0 -1 0 1024)"/>
        </svg>
        `,
        tipPosition: "w",
      },
    ],

    outline: {
      enable: !!outlinEnable, // 初始化显示大纲
    },

    async input(value) {
      // console.log("input", value, current, !!value, value.length);
      if (current) {
        // 保存到本地 list 与 详情中
        const content = value.slice(0, 200);
        // 找到 list 则更新，否则添加
        const { list } = await Storage.get("list");

        let newList = [];
        if (list?.length > 0) {
          let has = false;
          newList = list.map((v) => {
            if (v.id === current) {
              has = true;
              v.time = Date.now();
              v.content = content;
            }
            return v;
          });
          // 如果没有则添加
          if (!has) {
            newList.push({ id: current, time: Date.now(), content });
          }
        } else {
          newList = [{ id: current, time: Date.now(), content }];
        }
        Storage.set("list", newList);
        render();
        Storage.set(current, value);
      }

      //
    },

    async after() {
      // console.log('after...')
      const { setting_preview, setting_slide } = await Storage.get([
        "setting_preview",
        "setting_slide",
      ]);

      if (setting_preview === 1) {
        const { vditor } = window.vditor;
        vditor.preview.element.style.display = "block";
        vditor["ir"].element.parentElement.style.display = "none";
        vditor.preview.render(vditor);
        const previewButton = document.querySelector(
          ".preview-container button"
        );
        previewButton.classList.add("vditor-menu--current");
      }

      if (setting_slide === 1) {
        const menu = document.querySelector(".menu-container");
        menu.classList.remove("w-0");
      }
      await init();
      render();
    },
    preview: {
      theme: {
        current: "ant-design",
        list: {
          "ant-design": "Ant Design",
          wechat: "WeChat",
        },
        path: "./vditor/dist/css/content-theme",
      },
      hljs: {
        enable: true,
        style: "github",
      },
      actions: ["desktop", "mp-wechat"],
    },
    height: "100vh",
    placeholder: "Take me notes in your new tab of browser.",
  };
  window.vditor = new Vditor("vditor", window.options);

  const menuContainer = document.querySelector(".menu-container");

  // 事件委托，监听左侧点击
  menuContainer.addEventListener("click", function (event) {
    let currentLi = event.target;
    if (currentLi.tagName !== "LI") {
      currentLi = currentLi.parentElement;
    }

    // 取消所有的选中
    menuContainer.querySelectorAll("li").forEach((ele) => {
      ele.classList.remove("active");
    });

    // 选中当前点击的
    currentLi.classList.add("active");
  });

  async function add() {
    const id = uuid();
    current = id;
    let { list } = await Storage.get("list");
    const item = { id, time: Date.now(), content: "" };
    if (!list) {
      list = [item];
    } else {
      list.push(item);
    }
    window.vditor.setValue("");
    window.vditor.focus();

    Promise.all([Storage.set("current", id), Storage.set("list", list)]);
    render();
  }

  async function remove() {}

  async function render() {
    const { list } = await Storage.get(["list"]);
    console.log("list", list);
    if (list?.length > 0) {
      const s = list
        .sort((a, b) => (a.time > b.time ? -1 : 1))
        .reduce((acc, curr) => {
          console.log("curr", curr, current);
          acc.push(
            template(
              curr.content,
              new Date(curr.time).toLocaleString(),
              curr.id === current
            )
          );
          return acc;
        }, [])
        .join("");
      oUl.innerHTML = s;
    }
  }

  async function init() {
    // 初始化数据，第一次进来没有数据，则默认给个模板
    const { list } = await Storage.get("list");

    if (!list) {
      add();
    }
    // const { ids } = await Storage.get("ids");
    // const { current: localCurrent } = await Storage.get("current");

    // if (localCurrent) {
    //   current = localCurrent;
    // }

    // if (ids) {
    //   if (!localCurrent) {
    //     current = ids[0];
    //   }
    //   return;
    // }
    // const id = uuid();
    // await Promise.all([Storage.set("current", id), Storage.set("ids", [id])]);
  }

  function template(text, time = "", active = false) {
    console.log("active", active);
    active = active ? " active" : "";
    return `<li class="flex flex-column justify-between${active}">
    <div class="description">
      ${text}
    </div>
    <time>${time}</time>
  </li>`;
  }
})();
