package android.view;
public class View {
    public static final int OVER_SCROLL_NEVER = 2;
    public interface OnLongClickListener { boolean onLongClick(View v); }
    public void setOverScrollMode(int m) {}
    public void setVerticalScrollBarEnabled(boolean b) {}
    public void setHorizontalScrollBarEnabled(boolean b) {}
    public void setHapticFeedbackEnabled(boolean b) {}
    public void setOnLongClickListener(OnLongClickListener l) {}
    public void setBackgroundColor(int c) {}
}
