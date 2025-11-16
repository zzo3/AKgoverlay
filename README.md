# AKG Overlay — 使用說明與部署指南

簡短說明：本專案將 overlay 的 HTML、CSS 與核心邏輯拆成獨立檔案，並提供 local 範本以利本機測試而不洩漏私密資訊。請依下列步驟操作以確保安全與一致性。

---

## 檔案結構（建議放同一資料夾）
- akgoverlay.html  
- akgoverlay.ui.css  
- akgoverlay.core.js  
- akgoverlay.local.example.js （範本，安全可上傳）  
- akgoverlay.local.js （本機私有設定，不上傳）  
- .gitignore

---

## 上線準備（必做清單）
1. 複製 local 範本：  
   - 從 akgoverlay.local.example.js 複製為 akgoverlay.local.js，並在該檔填入你的本機值。  
2. 加入 .gitignore（必須）：  
   - 在 repo 根新增一行：  
     ```
     /akgoverlay.local.js
     ```  
3. 編碼檢查：所有檔案儲存為 UTF-8 without BOM。  
4. 確認 akgoverlay.local.js 不含長期或敏感 token。在前端不得放置長期憑證；若需憑證，請用後端短期代理或動態發放。

---

## 本機啟動與 OBS 設定
1. 啟動簡易本機 server（在專案資料夾）：  
   ```
   python -m http.server 8000
   ```  
2. 在桌面瀏覽器開啟：  
   ```
   http://127.0.0.1:8000/akgoverlay.html
   ```  
3. 在 OBS 中新增 Browser Source：  
   - URL 設為上面 HTTP 地址（不要用 file://）。  
   - 建議選擇「Refresh when scene becomes active」或手動 refresh。  
   - 設定合適的寬高以配合你的螢幕。

---

## 測試與驗證（production-ready 指引）
- 預設行為：production config 預設 debug = false、無開發用 beacon。  
- 快速手動測試（在瀏覽器 Console 執行）：  
  - 呼叫公開 API 顯示訊息：  
    ```
    window.addMessageToOverlay({ chatname: 'Dev', chatmessage: 'hello', type: 'system' });
    ```  
  - 呼叫樣本序列（間隔推送）：  
    ```
    window.testPushOverlay();
    ```  
- 驗證中文事件關鍵字觸發（若輸入中文訊息會套用特殊視覺）：  
  ```
  window.addMessageToOverlay({ chatname:'測試', chatmessage:'感謝追隨', type:'system' })
  ```

---

## 安全與維護建議
- 永遠勿把 akgoverlay.local.js 提交至版本庫。  
- 若曾不慎 commit，本地或遠端歷史請用適當工具（例如 BFG 或 git filter-repo）清除敏感紀錄。  
- 將可變動的關鍵字或非敏感参数改為放在 akgoverlay.local.js，便於客製化但不會被推上 repo。  
- 若要把中文關鍵字交給他人管理，可在 local.example 中提供範例欄位，並在 README 註明如何修改。

---

## 常見問題快速解法
- 若 OBS 不載入 local config：確認 Browser Source 使用 HTTP URL 而非 file://，且 akgoverlay.local.js 在同資料夾且已加入 .gitignore（瀏覽器載入順序以 head 同步注入 local config）。  
- 若樣式或動畫不同步：確認所有檔案為 UTF-8 without BOM 且 akgoverlay.ui.css 已正確被 akgoverlay.html 引用。  
- 若 iframe / WebSocket 未收到訊息：在瀏覽器 Console 查看錯誤，確認目標服務允許來自 overlay 的請求，或檢查 cfg.websocketUrl 是否在 local config 內正確設定。

---