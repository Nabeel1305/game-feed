package android.webkit;
public class WebView extends android.view.View {
    public WebView(android.content.Context c) {}
    public WebSettings getSettings() { return null; }
    public void loadUrl(String url) {}
    public void evaluateJavascript(String script, ValueCallback<String> cb) {}
    public void addJavascriptInterface(Object o, String name) {}
    public void clearCache(boolean includeDiskFiles) {}
    public void onPause() {}
    public void onResume() {}
}
