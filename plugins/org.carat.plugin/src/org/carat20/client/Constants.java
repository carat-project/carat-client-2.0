package org.carat20.client;

public class Constants {

    public static final String CARAT = "Carat";
    public static final int IMPORTANCE_SUGGESTION = 123456789;
    public static final int IMPORTANCE_PERCEPTIBLE = 130;

    // Used for bugs and hogs, and EnergyDetails sub-screen (previously known as drawing)
    public static enum Type {
        OS, MODEL, HOG, BUG, SIMILAR, JSCORE, OTHER, BRIGHTNESS, WIFI, MOBILEDATA
    }

    public static enum ActionType {
        INIT, JSCORE, MAIN, HOGS, BUGS, KILL, REMOVE, UNKNOWN;
        
        public static ActionType get(String action){
            if(action.equals("init"))       return INIT;
            if(action.equals("jscore"))     return JSCORE;
            if(action.equals("main"))       return MAIN;
            if(action.equals("hogs"))       return HOGS;
            if(action.equals("bugs"))       return BUGS;
            if(action.equals("kill"))       return KILL;
            if(action.equals("uninstall"))  return REMOVE;
            return UNKNOWN;
        }
    }
}
