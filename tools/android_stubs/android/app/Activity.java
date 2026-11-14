package android.app;
public class Activity extends android.content.Context {
    protected void onCreate(android.os.Bundle b) {}
    protected void onPause() {}
    protected void onResume() {}
    protected void onDestroy() {}
    public void onBackPressed() {}
    public void setContentView(android.view.View v) {}
    public final void runOnUiThread(Runnable r) {}
    public boolean moveTaskToBack(boolean nonRoot) { return true; }
    public void finish() {}
}
