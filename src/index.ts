import {
  Plugin,
  getFrontend,
  Dialog,
} from "siyuan";
import "@/index.scss";
import PluginInfoString from '@/../plugin.json'
import { createApp, App } from "vue";
import { TaskRenderer } from "./renderer";
import TaskModal from "./components/TaskModal.vue";

let PluginInfo = {
  version: '',
}
try {
  PluginInfo = PluginInfoString
} catch (err) {
  console.log('Plugin info parse error: ', err)
}
const {
  version,
} = PluginInfo

const EDIT_ICON_SVG = `<svg t="1670989982294" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4447" width="16" height="16"><path d="M823.381333 399.210667L625.066667 200.896 685.952 140.010667c16.597333-16.597333 43.52-16.597333 60.117333 0l77.312 77.312c16.597333 16.597333 16.597333 43.52 0 60.117333L823.381333 399.210667zM229.418667 864.853333l-74.069334-74.069333L576.426667 369.706667l198.314666 198.314666L353.664 989.12l-223.786667 34.901333 34.901333-223.786666 164.736-164.736-198.314666-198.314667L229.418667 864.853333z" p-id="4448" fill="currentColor"></path></svg>`;

export default class PluginSample extends Plugin {
  // Run as mobile
  public isMobile: boolean
  // Run in browser
  public isBrowser: boolean
  // Run as local
  public isLocal: boolean
  // Run in Electron
  public isElectron: boolean
  // Run in window
  public isInWindow: boolean
  public platform: SyFrontendTypes
  public readonly version = version
  private vueApp: App | null = null;
  private renderer: TaskRenderer;

  async onload() {
    const frontEnd = getFrontend();
    this.platform = frontEnd as SyFrontendTypes
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile"
    this.isBrowser = frontEnd.includes('browser')
    this.isLocal =
      location.href.includes('127.0.0.1')
      || location.href.includes('localhost')
    this.isInWindow = location.href.includes('window.html')

    try {
      require("@electron/remote")
        .require("@electron/remote/main")
      this.isElectron = true
    } catch (err) {
      this.isElectron = false
    }

    console.log("Plugin TaskMaster loaded successfully.");
  }

  async onLayoutReady() {
    this.renderer = new TaskRenderer();
    this.eventBus.on("ws-main", this.handleEvents.bind(this));
    this.eventBus.on("click-blockicon", this.handleNewTaskCreation.bind(this));

    setTimeout(() => {
        document.querySelectorAll(".protyle-wysiwyg").forEach(el => this.renderer.process(el as HTMLElement));
    }, 200);
  }

  onunload() {
    //destroy()
  }

  openSetting() {
    window._sy_plugin_sample.openSetting()
  }

  private handleEvents({ detail }: any) {
    if (detail.cmd === "transactions") {
      for (const data of detail.data) {
        for (const op of data.doOperations) {
          setTimeout(() => this.addEditIconsToAllTasks(), 200);
          if (op.action === "update" && op.id) {
              const blockElement = document.querySelector(`.protyle-wysiwyg [data-node-id="${op.id}"]`);
              if (blockElement?.getAttribute("data-subtype") === "t") {
                const titleElement = blockElement.querySelector(".p");
                const title = titleElement?.textContent?.replace(/^- \[[ xX]\]\s*/, "") ?? "";
                console.log("Task block detected:", titleElement, title);
                setTimeout(() => this.openTaskModal(op.id, false, title), 200)
              }
          }
        }
      }
    }
  }

  private addEditIconsToAllTasks() {
      const taskListItems = document.querySelectorAll(".protyle-wysiwyg [data-type='NodeListItem'][data-subtype='t']");
      taskListItems.forEach((taskNode: HTMLElement) => {
          let icon = taskNode.querySelector(".task-master-edit-icon");
          if (!icon) {
              icon = document.createElement("span");
              icon.className = "task-master-edit-icon";
              icon.innerHTML = EDIT_ICON_SVG;
              taskNode.appendChild(icon);

              icon.addEventListener("click", (event) => {
                  event.stopPropagation();
                  const blockId = taskNode.getAttribute("data-node-id");
                  const titleElement = taskNode.querySelector(".p");
                  const title = titleElement ? titleElement.textContent : "";
                  this.openTaskModal(blockId, true, title);
              });
          }
      });
  }

  private handleNewTaskCreation({ detail }: any) {
      const blockElements = detail.blockElements as HTMLElement[];
      if (blockElements && blockElements.length > 0) {
          const blockId = blockElements[0].getAttribute("data-node-id");
          const action: string = detail.action;
          if (action === "insert" && blockElements[0].innerText.trim() === "") {
              setTimeout(() => this.openTaskModal(blockId, false, ""), 100);
          }
      }
  }

  private openTaskModal(blockId: string, isEditing: boolean, initialTitle: string = "") {
      const content = document.createElement("div");
      content.style.height = "100%";

      new Dialog({
          title: isEditing ? "Edit Task" : "New Task",
          content: `<div id="task-master-modal-container" style="height: 100%;"></div>`,
          width: "600px",
          height: "400px",
          destroyCallback: () => {
              if (this.vueApp) {
                  this.vueApp.unmount();
                  this.vueApp = null;
              }
          },
      });

      this.vueApp = createApp(TaskModal, {
          blockId,
          isEditing,
          initialTitle,
      });
      this.vueApp.mount("#task-master-modal-container");
  }
}
