package org.carat20.client;

public class Constants {

    public static final String APP_NAME = "Carat";
    public static final int IMPORTANCE_SUGGESTION = 123456789;
    public static final int IMPORTANCE_PERCEPTIBLE = 130;

    // Used for bugs and hogs, and EnergyDetails sub-screen (previously known as drawing)
    public static enum Type {
        OS, MODEL, HOG, BUG, SIMILAR, JSCORE, OTHER, BRIGHTNESS, WIFI, MOBILEDATA
    }
}
