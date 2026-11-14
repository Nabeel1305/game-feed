package android.content;
public abstract class Context {
    public static final String VIBRATOR_SERVICE = "vibrator";
    public static final String VIBRATOR_MANAGER_SERVICE = "vibrator_manager";
    public android.content.res.AssetManager getAssets() { return null; }
    public java.io.File getNoBackupFilesDir() { return null; }
    public java.io.File getFilesDir() { return null; }
    public Object getSystemService(String name) { return null; }
    public android.content.pm.PackageManager getPackageManager() { return null; }
    public String getPackageName() { return null; }
}
