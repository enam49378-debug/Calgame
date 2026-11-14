using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.NetworkInformation;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace CalFightLauncher
{
    static class Program
    {
        [DllImport("user32.dll")]
        private static extern bool SetProcessDPIAware();

        [STAThread]
        static void Main()
        {
            try
            {
                SetProcessDPIAware();
            }
            catch { }

            // Target URLs
            string onlineUrl = "https://calfight.vercel.app/";
            string localHtmlPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "index.html");
            string targetUrl = onlineUrl;

            // Check if online or offline fallback
            try
            {
                using (var client = new WebClient())
                {
                    client.Headers.Add("User-Agent", "CalFightDesktop/1.0");
                    client.DownloadString(onlineUrl);
                    targetUrl = onlineUrl;
                }
            }
            catch
            {
                // Fallback to local index.html if offline
                if (File.Exists(localHtmlPath))
                {
                    targetUrl = "file:///" + localHtmlPath.Replace('\\', '/');
                }
            }

            // Find browser engine
            string browserPath = FindBrowserExecutable();
            if (string.IsNullOrEmpty(browserPath))
            {
                MessageBox.Show(
                    "No se encontró un motor de ejecución web (Chrome o Edge) en tu sistema.\nPor favor instala Google Chrome o Microsoft Edge.",
                    "CalFight - Error de Inicio",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return;
            }

            // Dedicated data directory for saves, settings, audio
            string dataDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "CalFight",
                "GameProfile"
            );
            Directory.CreateDirectory(dataDir);

            // Create desktop shortcut if not exists
            try
            {
                CreateDesktopShortcut();
            }
            catch { }

            // Launch flags for native gaming experience
            // --app=URL: removes browser address bar, menus, navigation and tabs
            // --start-fullscreen: exclusive full screen gaming
            // --autoplay-policy=no-user-gesture-required: seamless audio/voices
            // --disable-pinch: prevents accidental zooming
            string arguments = string.Format(
                "--app=\"{0}\" " +
                "--start-fullscreen " +
                "--user-data-dir=\"{1}\" " +
                "--autoplay-policy=no-user-gesture-required " +
                "--disable-pinch " +
                "--disable-translate " +
                "--no-first-run " +
                "--no-default-browser-check " +
                "--disable-features=Translate,OptimizationHints,MediaRouter",
                targetUrl,
                dataDir
            );

            ProcessStartInfo psi = new ProcessStartInfo
            {
                FileName = browserPath,
                Arguments = arguments,
                UseShellExecute = false,
                WindowStyle = ProcessWindowStyle.Maximized
            };

            try
            {
                Process.Start(psi);
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Error al iniciar CalFight: " + ex.Message,
                    "CalFight",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }

        static string FindBrowserExecutable()
        {
            string[] candidates = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe")
            };

            foreach (string path in candidates)
            {
                if (File.Exists(path))
                    return path;
            }

            return null;
        }

        static void CreateDesktopShortcut()
        {
            string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            string shortcutPath = Path.Combine(desktop, "CalFight.lnk");
            string exePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "CalFight.exe");
            string iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "assets", "icon.ico");

            if (!File.Exists(exePath))
                return;

            Type shellType = Type.GetTypeFromProgID("WScript.Shell");
            if (shellType == null) return;
            dynamic shell = Activator.CreateInstance(shellType);
            dynamic shortcut = shell.CreateShortcut(shortcutPath);
            shortcut.TargetPath = exePath;
            shortcut.WorkingDirectory = AppDomain.CurrentDomain.BaseDirectory;
            shortcut.Description = "CalFight - El Juego Oficial de Peleas de Calsitos";
            if (File.Exists(iconPath))
            {
                shortcut.IconLocation = iconPath + ",0";
            }
            shortcut.Save();
        }
    }
}
