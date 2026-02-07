// 这里的路径改成了绝对路径，更加稳健
import { extension_settings } from "/scripts/extensions.js";
import { saveSettingsDebounced } from "/scripts/script.js";
import { popup_call } from "/scripts/popup.js";

const extensionName = "yuzu-manager";

function createYuzuUI() {
    const container = document.createElement("div");
    container.innerHTML = `
        <div class="yuzu-box" style="padding: 10px; border: 1px solid #666; background: rgba(0, 0, 0, 0.3); margin-top: 10px;">
            <h3 style="color: pink;">🍊 柚子·全能管家</h3>
            <p style="font-size: 0.9em;">如果看到这个界面，说明修复成功啦！♡</p>
            <hr>
            <h4>📥 插件安装</h4>
            <textarea id="yuzu_plugin_urls" rows="3" class="text_pole" style="width:100%" placeholder="输入GitHub链接..."></textarea>
            <button id="yuzu_btn_install" class="menu_button" style="width:100%; margin-top:5px">✨ 安装</button>
            <div id="yuzu_install_log" style="font-size:0.8em; margin-top:5px"></div>
            <hr>
            <h4>📦 备份</h4>
            <button id="yuzu_btn_backup" class="menu_button" style="width:100%">💾 下载备份 (.zip)</button>
        </div>
    `;

    const btnInstall = container.querySelector("#yuzu_btn_install");
    const logArea = container.querySelector("#yuzu_install_log");
    const inputArea = container.querySelector("#yuzu_plugin_urls");
    const btnBackup = container.querySelector("#yuzu_btn_backup");

    btnInstall.addEventListener("click", async () => {
        const urls = inputArea.value.split('\n').filter(l => l.includes('http'));
        if (!urls.length) return toastr.warning("没有链接喵！");
        btnInstall.innerText = "运行中...";
        try {
            const res = await fetch('/api/yuzu/install-plugins', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({urls})
            });
            const data = await res.json();
            logArea.innerHTML = data.logs ? data.logs.join('<br>') : data.msg;
        } catch(e) { logArea.innerText = "错误: " + e; }
        btnInstall.innerText = "✨ 安装";
    });

    btnBackup.addEventListener("click", () => {
        window.open("/api/yuzu/backup", "_blank");
    });

    return container;
}

jQuery(async () => {
    // 再次强调，这里必须用 ["yuzu-manager"]
    extension_settings["yuzu-manager"] = {
        render: (container) => {
            $(container).append(createYuzuUI());
        }
    };
});
