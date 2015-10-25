package org.carat20.client;

public class Constants {

    public static final String CARAT = "Carat";
    public static final int IMPORTANCE_SUGGESTION = 123456789;
    public static final int IMPORTANCE_PERCEPTIBLE = 130;
    public static final double ERROR_LIMIT = (double) 2/3;

    public static enum Type {
        OS, MODEL, HOG, BUG, SIMILAR, JSCORE, OTHER, BRIGHTNESS, 
        WIFI, MOBILEDATA;
    }

    public static enum ActionType {
        SETUP, CLEAR, UUID, REFRESH, JSCORE, MAIN, HOGS, BUGS, 
        KILL, REMOVE, MEMORY, UNKNOWN, CPU, TOAST;
        
        public static ActionType get(String action){
            if(action.equals("setup"))      return SETUP;
            if(action.equals("clear"))      return CLEAR;
            if(action.equals("uuid"))       return UUID;
            if(action.equals("refresh"))    return REFRESH;
            if(action.equals("jscore"))     return JSCORE;
            if(action.equals("main"))       return MAIN;
            if(action.equals("hogs"))       return HOGS;
            if(action.equals("bugs"))       return BUGS;
            if(action.equals("kill"))       return KILL;
            if(action.equals("uninstall"))  return REMOVE;
            if(action.equals("memory"))     return MEMORY;
            if(action.equals("cpu"))        return CPU;
            if(action.equals("toast"))      return TOAST;
            return UNKNOWN;
        }
    }
}
