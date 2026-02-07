const path = require('path');
const fs = require('fs');
const child_process = require('child_process');
const express = require('express');

let AdmZip;
try {
    AdmZip = require('adm-zip');
} catch (e) {
    console.log("[Yuzu] 警告：缺少 adm-zip 库。");
}

async function init(context) {
    const app = context.app; 
    
    // ============================================================
    // 🔑 终极修复：双重路由映射！
    // 酒馆加载第三方插件时，通常会找 /third-party/ 这个路径
    // ============================================================
    
    // 路径 A：标准映射 (防守)
    app.use('/scripts/extensions/yuzu-manager', express.static(__dirname));
    
    // 路径 B：第三方映射 (进攻！这次报错就是因为缺了这个！)
    app.use('/scripts/extensions/third-party/yuzu-manager', express.static(__dirname));

    // --- API 部分保持不变 ---
    app.post('/api/yuzu/install-plugins', async (req, res) => {
        const urls = req.body.urls;
        if (!urls || !Array.isArray(urls)) return res.send({ success: false, msg: "无链接" });
        
        const results = [];
        const pluginDir = path.join(process.cwd(), 'plugins');
        if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir);

        for (const url of urls) {
            if (!url.trim()) continue;
            const folderName = url.split('/').pop().replace('.git', '');
            const targetPath = path.join(pluginDir, folderName);
            if (fs.existsSync(targetPath)) {
                results.push(`⚠️ 跳过: ${folderName}`);
                continue;
            }
            try {
                child_process.execSync(`git clone "${url}" "${targetPath}"`);
                results.push(`✅ 成功: ${folderName}`);
            } catch (err) {
                results.push(`❌ 失败: ${folderName}`);
            }
        }
        res.send({ success: true, logs: results });
    });

    app.get('/api/yuzu/backup', (req, res) => {
        if (!AdmZip) return res.status(500).send("缺少 adm-zip");
        const zip = new AdmZip();
        const rootDir = process.cwd();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const zipName = `SillyTavern_Backup_${timestamp}.zip`;
        const targets = ['public/characters', 'public/chats', 'public/worlds', 'public/groups', 'public/backgrounds', 'config.yaml', 'config.json', 'plugins'];
        targets.forEach(target => {
            const fullPath = path.join(rootDir, target);
            if (fs.existsSync(fullPath)) {
                if (fs.statSync(fullPath).isDirectory()) zip.addLocalFolder(fullPath, target);
                else zip.addLocalFile(fullPath);
            }
        });
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename=${zipName}`);
        res.send(zip.toBuffer());
    });

    console.log("[Yuzu Manager] 柚子双通道已开启！正在监听 third-party 路径！♡");
}

module.exports = { init };
