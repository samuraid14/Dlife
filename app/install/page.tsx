import DesktopInstall from "../desktop-install";
export default function Install() {
  return (
    <main className="account-shell">
      <a href="/" className="account-brand">
        dlife日志
      </a>
      <section className="account-card install-guide">
        <img src="/icons/icon-192.png" alt="Dlife" width={64} height={64} />
        <h1>给生活一个桌面入口。</h1>
        <p>
          安装后，Dlife
          会以独立窗口打开。电脑和网页版共用同一个账号、同一份记录。
        </p>
        <DesktopInstall instructions />
        <h2 id="manual">Mac</h2>
        <ol>
          <li>在 Chrome 中打开网站。</li>
          <li>点击地址栏右侧的安装图标，或使用浏览器菜单中的安装选项。</li>
          <li>按提示安装，从「应用程序」或 Dock 打开。</li>
        </ol>
        <h2>Windows</h2>
        <ol>
          <li>在 Chrome 或 Edge 中打开网站。</li>
          <li>点击地址栏的安装图标，或在菜单的「应用」中选择安装。</li>
          <li>
            按提示完成，从开始菜单打开；是否创建桌面快捷方式由浏览器提示决定。
          </li>
        </ol>
        <p className="account-help">
          这是可安装的网页应用（PWA），第一版需要联网。若当前内置浏览器没有安装入口，请复制网站地址到
          Chrome 或 Edge 打开。
        </p>
        <a href="/" className="secondary">
          回到我的生活
        </a>
      </section>
    </main>
  );
}
