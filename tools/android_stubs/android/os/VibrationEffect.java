package android.os;
public abstract class VibrationEffect {
    public static final int DEFAULT_AMPLITUDE = -1;
    public static VibrationEffect createOneShot(long ms, int amplitude) { return null; }
    public static VibrationEffect createWaveform(long[] timings, int repeat) { return null; }
}
