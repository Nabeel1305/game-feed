package android.content.pm;
public abstract class PackageManager {
    public static class NameNotFoundException extends Exception {}
    public abstract PackageInfo getPackageInfo(String name, int flags) throws NameNotFoundException;
}
