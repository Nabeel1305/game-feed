package android.os;
public abstract class Vibrator { public abstract boolean hasVibrator(); public abstract void cancel(); public void vibrate(VibrationEffect e) {} }
