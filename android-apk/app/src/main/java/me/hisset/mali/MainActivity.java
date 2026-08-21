package me.hisset.mali;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private static final String PUBLIC_URL = "https://mali.hisset.me";
    private static final String FALLBACK_URL = "http://100.86.131.75:8081";
    private static final int FILE_CHOOSER_REQUEST = 501;

    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private SharedPreferences prefs;
    private boolean triedFallback = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(247, 249, 248));
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);

        prefs = getSharedPreferences("bmt", MODE_PRIVATE);
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(247, 249, 248));
        setContentView(webView);

        configureWebView();
        loadPreferredServer();
    }

    private void configureWebView() {
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.addJavascriptInterface(new AndroidBridge(), "Android");

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = filePathCallback;
                Intent intent;
                try {
                    intent = fileChooserParams.createIntent();
                } catch (Exception e) {
                    intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType("*/*");
                }
                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                } catch (Exception e) {
                    fileCallback.onReceiveValue(null);
                    fileCallback = null;
                }
                return true;
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                String scheme = u.getScheme();
                if ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme)) {
                    return false;
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, u));
                } catch (Exception ignored) {}
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (url.startsWith("https://mali.hisset.me")) {
                    triedFallback = false;
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (!request.isForMainFrame()) return;
                handleMainFrameError(request.getUrl().toString());
            }
        });
    }

    private void loadPreferredServer() {
        String custom = prefs.getString("server_url", "").trim();
        triedFallback = false;
        if (!custom.isEmpty()) {
            webView.loadUrl(normalize(custom));
        } else {
            webView.loadUrl(PUBLIC_URL);
        }
    }

    private void handleMainFrameError(String failedUrl) {
        String custom = prefs.getString("server_url", "").trim();
        if (custom.isEmpty() && failedUrl.startsWith(PUBLIC_URL) && !triedFallback) {
            triedFallback = true;
            webView.postDelayed(() -> webView.loadUrl(FALLBACK_URL), 350);
            return;
        }
        showConnectionPage();
    }

    private String normalize(String value) {
        String v = value.trim();
        if (!v.startsWith("http://") && !v.startsWith("https://")) v = "https://" + v;
        while (v.endsWith("/")) v = v.substring(0, v.length() - 1);
        return v;
    }

    private void showConnectionPage() {
        String current = prefs.getString("server_url", PUBLIC_URL);
        String html = "<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'>" +
                "<style>body{font-family:system-ui,-apple-system,sans-serif;background:#f5f8f7;color:#17221f;margin:0;padding:28px} .box{max-width:520px;margin:56px auto;background:white;border:1px solid #e3ebe8;border-radius:28px;padding:28px;box-shadow:0 18px 50px rgba(18,50,42,.08)} .icon{width:58px;height:58px;border-radius:18px;background:#e5f4ef;display:grid;place-items:center;margin-bottom:22px;font-size:28px} h2{margin:0 0 8px;font-size:24px} p{color:#687b75;line-height:1.5} input{width:100%;box-sizing:border-box;border:1px solid #d7e2de;border-radius:14px;padding:14px 16px;font-size:16px;margin:10px 0 12px;outline:none} button{width:100%;border:0;border-radius:14px;padding:15px 18px;font-size:16px;font-weight:700;background:#0d7765;color:white;margin-top:8px} .secondary{background:#eef4f2;color:#31574e} small{display:block;color:#8a9b96;margin-top:18px;line-height:1.5}</style></head><body><div class='box'><div class='icon'>◫</div><h2>Sunucuya ulaşılamadı</h2><p>Uygulama önce <b>mali.hisset.me</b> adresini, ardından mevcut VPS bağlantısını dener. Bağlantı adresini aşağıdan değiştirebilirsin.</p><input id='u' value='" + current.replace("'", "") + "' autocapitalize='off' autocomplete='off'><button onclick=\"Android.setServer(document.getElementById('u').value)\">Bağlan</button><button class='secondary' onclick=\"Android.resetServer()\">Otomatik dene</button><small>Public adres aktif olduğunda APK güncellemesi gerekmeden Tailscale'siz çalışacaktır.</small></div></body></html>";
        webView.loadDataWithBaseURL("https://local.hisset.me/", html, "text/html", "UTF-8", null);
    }

    public class AndroidBridge {
        @JavascriptInterface
        public void setServer(String value) {
            final String normalized = normalize(value);
            prefs.edit().putString("server_url", normalized).apply();
            runOnUiThread(() -> webView.loadUrl(normalized));
        }

        @JavascriptInterface
        public void resetServer() {
            prefs.edit().remove("server_url").apply();
            runOnUiThread(() -> loadPreferredServer());
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST || fileCallback == null) return;
        Uri[] result = null;
        if (resultCode == RESULT_OK && data != null) {
            if (data.getClipData() != null) {
                int count = data.getClipData().getItemCount();
                result = new Uri[count];
                for (int i = 0; i < count; i++) result[i] = data.getClipData().getItemAt(i).getUri();
            } else if (data.getData() != null) {
                result = new Uri[]{data.getData()};
            }
        }
        fileCallback.onReceiveValue(result);
        fileCallback = null;
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
        }
        super.onDestroy();
    }
}
