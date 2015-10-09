package org.carat20.client.storage;

import android.app.ActivityManager.RunningAppProcessInfo;
import android.graphics.drawable.Drawable;
import android.util.Log;
import android.util.SparseArray;
import java.io.Serializable;

import org.carat20.client.Constants;

/**
 * Simple container class for Hog/Bug data to save memory.
 *
 * @author Eemil Lagerspetz
 * @author Jonatan Hamberg
 */
public class SimpleHogBug implements Serializable, Comparable<SimpleHogBug> {
    
    
    //Auto-generated UID for serialization
    private static final long serialVersionUID = 8272459694607111058L;
    
    // Used to map importances to human readable strings for sending samples to
    // the server, and showing them in the process list.
    private static final SparseArray<String> importanceToString = new SparseArray<String>();

    private String appPackage;
    private String appIcon;
    
    static {
        importanceToString.put(RunningAppProcessInfo.IMPORTANCE_EMPTY, "Not running");
        importanceToString.put(RunningAppProcessInfo.IMPORTANCE_BACKGROUND, "Background process");
        importanceToString.put(RunningAppProcessInfo.IMPORTANCE_SERVICE, "Service");
        importanceToString.put(RunningAppProcessInfo.IMPORTANCE_VISIBLE, "Visible task");
        importanceToString.put(RunningAppProcessInfo.IMPORTANCE_FOREGROUND, "Foreground app");

        importanceToString.put(Constants.IMPORTANCE_PERCEPTIBLE, "Perceptible task");
        importanceToString.put(Constants.IMPORTANCE_SUGGESTION, "Suggestion");
    }
    
    private Constants.Type type = null;

    public Constants.Type getType() {
        return type;
    }

    public boolean isBug() {
        return type == Constants.Type.BUG;
    }

    public SimpleHogBug(String packageName, Constants.Type type) {
        this.type = type;
        if (type == Constants.Type.OS) {
            appPriority = importanceString(Constants.IMPORTANCE_SUGGESTION);
        }
        this.appName = packageName;
    }

    public SimpleHogBug(String appName, Constants.Type type, String priority) {
        this.type = type;
        if (type == Constants.Type.OTHER) {
            appPriority = priority;
        } else if (type == Constants.Type.OS) {
            appPriority = importanceString(Constants.IMPORTANCE_SUGGESTION);
        }
        this.appName = appName;
    }

    private String appName; // optional

    /**
     * @return the appName
     */
    public String getAppName() {
        return appName;
    }

    /**
     * @param appName the appName to set
     */
    public void setAppName(String appName) {
        this.appName = appName;
    }

    /**
     * @return the wDistance
     */
    public double getwDistance() {
        return wDistance;
    }

    /**
     * @param wDistance the wDistance to set
     */
    public void setwDistance(double wDistance) {
        this.wDistance = wDistance;
    }

    /**
     * @return the expectedValue
     */
    public double getExpectedValue() {
        return expectedValue;
    }

    /**
     * @param expectedValue the expectedValue to set
     */
    public void setExpectedValue(double expectedValue) {
        this.expectedValue = expectedValue;
    }

    /**
     * @return the expectedValueWithout
     */
    public double getExpectedValueWithout() {
        return expectedValueWithout;
    }

    /**
     * @param expectedValueWithout the expectedValueWithout to set
     */
    public void setExpectedValueWithout(double expectedValueWithout) {
        this.expectedValueWithout = expectedValueWithout;
    }

    /**
     * @return the appLabel
     */
    public String getAppLabel() {
        return appLabel;
    }

    /**
     * @param appLabel the appLabel to set
     */
    public void setAppLabel(String appLabel) {
        this.appLabel = appLabel;
    }
    
    /**
     * Returns application icon as base64 encoded bitmap
     * @return the appIcon
     */
    public String getAppIcon() {
        return appIcon;
    }

    /**
     * Sets application icon as base64 encoded bitmap
     * @param appIcon the appIcon
     */
    public void setAppIcon(String appIcon) {
        this.appIcon = appIcon;
    }
    

    /**
     * @return the appPriority
     */
    public String getAppPriority() {
        return appPriority;
    }

    /**
     * @param appPriority the appPriority to set
     */
    public void setAppPriority(String appPriority) {
        this.appPriority = appPriority;
    }

    private double wDistance; // optional
    private double expectedValue; // optional
    private double expectedValueWithout; // optional
    private String appLabel; // optional
    private String appPriority; // optional

    // error of with dist in %/s
    private double error = 0;
    // error of without dist in %/s
    private double errorWithout = 0;

    private int samples = -1;

    private int samplesWithout = -1;

    public double getError() {
        return error;
    }

    public void setError(double error) {
        this.error = error;
    }

    public double getErrorWithout() {
        return errorWithout;
    }

    public void setErrorWithout(double error) {
        this.errorWithout = error;
    }

    public int getSamples() {
        return samples;
    }

    public void setSamples(double samples) {
        this.samples = (int) samples;
    }

    public int getSamplesWithout() {
        return samplesWithout;
    }

    public void setSamplesWithout(double samplesWithout) {
        this.samplesWithout = (int) samplesWithout;
    }

    // overloaded method. note that one of them is static
    public String getBenefitText() {
        double ev = getExpectedValue();
        double evWo = getExpectedValueWithout();
        double error = getError();
        double errorWo = getErrorWithout();
        return getBenefitText(ev, error, evWo, errorWo);
    }

    public int[] getBenefit() {
        double ev = getExpectedValue();
        double evWo = getExpectedValueWithout();
        double error = getError();
        double errorWo = getErrorWithout();
        return getBenefit(ev, error, evWo, errorWo);
    }

    public static int[] getBenefit(double ev, double error, double evWo, double errorWo) {
	// Max battery life: What if the we swing entirely to the left end of
        // the 95% error bar?
        double blMax = 100.0 / (ev - error);
        double blMaxWo = 100.0 / (evWo - errorWo);

        // Min battery life
        double blMin = 100.0 / (ev + error);
        double blMinWo = 100.0 / (evWo + errorWo);

        double ebMin = blMinWo - blMax;
        double ebMax = blMaxWo - blMin;

        double benefit = 100.0 / evWo - 100.0 / ev;

        if (benefit < 0) {
            return new int[]{0, 0, 0, 0, 0};
        }

        double maxError = benefit - ebMin;
        if (ebMax - benefit > maxError) {
            maxError = ebMax - benefit;
        }

        int min = (int) (benefit / 60);
        int hours = (int) (min / 60);
        // correct seconds value will be in benefit
        benefit -= min * 60;
        min -= hours * 60;

        int errorMins = (int) (maxError / 60);
        maxError -= errorMins * 60;

        return new int[]{hours, min, (int) benefit, errorMins, (int) maxError};
    }

    public static String getBenefitText(double ev, double error, double evWo,
            double errorWo) {
        int[] benefit = getBenefit(ev, error, evWo, errorWo);
        int hours = benefit[0];
        int min = benefit[1];
        int sec = benefit[2];
        int errorMins = benefit[3];
        int errorSec = benefit[4];

        StringBuilder b = new StringBuilder();
        if (hours > 0) {
            b.append(hours).append("h ");
        }
        if (min > 0) {
            b.append(min).append("m ");
        }
        if (hours <= 0) {
            b.append(sec).append("s ");
        }
        b.append("\u00B1 ");
        // int errorMins = (int) ((benefit - ebMin) / 60);
        if (errorMins == 0) {
            b.append(errorSec).append("s");
        } else {
            b.append(errorMins).append("m");
        }
        return b.toString();
    }

    public static String getErrorText(double ev, double error, double evWo,
            double errorWo) {
        int[] benefit = getBenefit(ev, error, evWo, errorWo);
        int errorMins = benefit[3];
        int errorSec = benefit[4];

        if (errorMins == 0) {
            return errorSec + "s";
        } else {
            return errorMins + "m";
        }
    }

    @Override
    public int compareTo(SimpleHogBug another) {
        double benefit = 100.0 / expectedValueWithout - 100.0 / expectedValue;
        double benefit2 = 100.0 / another.expectedValueWithout - 100.0
                / another.expectedValue;

        double diff = benefit2 - benefit;
        if (diff > 0) {
            return 1;
        } else if (diff < 0) {
            return -1;
        } else {
            return 0;
        }
    }

    // Converts importance to a human readable string.
    private static String importanceString(int importance) {
        return importanceToString.get(importance);
    }
}
